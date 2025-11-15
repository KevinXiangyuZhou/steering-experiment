"""
Heatmap Analysis Script for React Steering Experiment
Generates trajectory and acceleration/deceleration heatmaps from JSON data files for multiple participants
Example usage:
python plot_h1.py ./participant_data/ ./results/
"""

import json
import os
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.patches import Circle
import argparse
from pathlib import Path
import glob
from scipy import ndimage
from scipy.ndimage import gaussian_filter
from scipy.stats import gaussian_kde
import seaborn as sns


def generate_tunnel_path(curvature, tunnel_step=0.002):
    """Generate tunnel path based on curvature parameter.
    
    Args:
        curvature (float): Curvature parameter (amplitude of sine wave)
        tunnel_step (float): Step size for generating path points
        
    Returns:
        list: List of (x, y) tuples representing tunnel centerline
    """
    tunnel_start_x = 0.0
    tunnel_end_x = 0.46
    tunnel_y_base = 0.13
    amplitude = curvature
    wavelength = 0.15
    
    path = []
    x = tunnel_start_x
    while x < tunnel_end_x:
        y = tunnel_y_base + amplitude * np.sin(2 * np.pi * x / wavelength)
        path.append((x, y))
        x += tunnel_step
        
    return path


def generate_sequential_tunnel_path(condition, tunnel_step=0.002):
    """Generate sequential tunnel path with 2 segments.
    
    Args:
        condition (dict): Trial condition with segment parameters
        tunnel_step (float): Step size for generating path points
        
    Returns:
        tuple: (path, segment_widths) where path is list of (x, y) tuples and 
               segment_widths is list of widths for each segment
    """
    tunnel_start_x = 0.0
    tunnel_end_x = 0.46
    tunnel_y_base = 0.13
    segment_length = (tunnel_end_x - tunnel_start_x) / 2  # 2 segments instead of 3
    
    path = []
    segment_widths = []
    
    # Generate path points
    x = tunnel_start_x
    while x < tunnel_end_x:
        y = tunnel_y_base  # Default horizontal line
        
        # Apply curvature for straight-to-curved segments
        if condition.get('segmentType') == 'curvature':
            if x < tunnel_start_x + segment_length:
                # First segment: straight (curvature = 0)
                y = tunnel_y_base
            else:
                # Second segment: curved with single peak
                segment_x = x - (tunnel_start_x + segment_length)
                amplitude = condition.get('segment2Curvature', 0)
                segment_width = segment_length
                # Create a single peak curve using a quadratic function
                normalized_x = segment_x / segment_width  # 0 to 1
                y = tunnel_y_base + amplitude * (1 - (2 * normalized_x - 1) ** 2)
        
        path.append((x, y))
        x += tunnel_step
    
    # Determine segment widths for each point
    for i, (x, y) in enumerate(path):
        if x < tunnel_start_x + segment_length:
            segment_widths.append(condition['segment1Width'])
        else:
            segment_widths.append(condition['segment2Width'])
    
    return path, segment_widths


def is_point_in_tunnel(point_x, point_y, tunnel_path, tunnel_width):
    """Check if a point is within the tunnel boundaries.
    
    Args:
        point_x (float): X coordinate of the point
        point_y (float): Y coordinate of the point
        tunnel_path (list): List of (x, y) tuples representing tunnel centerline
        tunnel_width (float): Width of the tunnel
        
    Returns:
        bool: True if point is within tunnel, False otherwise
    """
    # Find the closest point on the tunnel path
    min_distance = float('inf')
    for i in range(len(tunnel_path) - 1):
        p1 = np.array(tunnel_path[i])
        p2 = np.array(tunnel_path[i + 1])
        point = np.array([point_x, point_y])
        
        # Calculate distance from point to line segment
        line_vec = p2 - p1
        point_vec = point - p1
        
        # Project point onto line segment
        line_len = np.linalg.norm(line_vec)
        if line_len == 0:
            continue
            
        t = np.dot(point_vec, line_vec) / (line_len ** 2)
        t = max(0, min(1, t))  # Clamp to [0, 1]
        
        closest_point = p1 + t * line_vec
        distance = np.linalg.norm(point - closest_point)
        
        if distance < min_distance:
            min_distance = distance
    
    return min_distance <= tunnel_width / 2.0


def calculate_tangential_acceleration(trajectory, timestamps):
    """Calculate signed tangential acceleration from trajectory and timestamps.
    
    Args:
        trajectory (list): List of (x, y) position tuples
        timestamps (list): List of timestamps in milliseconds
        
    Returns:
        list: List of signed tangential accelerations (positive = acceleration, negative = deceleration)
    """
    if len(trajectory) < 3 or len(timestamps) < 3:
        return []
    
    accelerations = []
    trajectory = np.array(trajectory)
    timestamps = np.array(timestamps) / 1000.0  # Convert to seconds
    
    # Calculate velocities
    velocities = []
    for i in range(1, len(trajectory)):
        dx = trajectory[i][0] - trajectory[i-1][0]
        dy = trajectory[i][1] - trajectory[i-1][1]
        dt = timestamps[i] - timestamps[i-1]
        if dt > 0:
            vx = dx / dt
            vy = dy / dt
            velocities.append((vx, vy))
        else:
            velocities.append((0, 0))
    
    # Calculate speed (magnitude of velocity)
    speeds = [np.sqrt(vx**2 + vy**2) for vx, vy in velocities]
    
    # Calculate tangential acceleration (change in speed)
    for i in range(1, len(speeds)):
        ds = speeds[i] - speeds[i-1]
        dt = timestamps[i+1] - timestamps[i]
        if dt > 0:
            tangential_acceleration = ds / dt
            accelerations.append(tangential_acceleration)
        else:
            accelerations.append(0)
    
    # Pad to match trajectory length
    accelerations = [0] + accelerations + [0]
    return accelerations


def create_trajectory_heatmap(all_trajectories, tunnel_path, tunnel_width, 
                             window_width=0.4608, window_height=0.2592, 
                             grid_resolution=100, save_path="trajectory_heatmap.png", 
                             title="Trajectory Overlap Density"):
    """Create a heatmap showing trajectory overlap density within the tunnel.
    
    Args:
        all_trajectories (list): List of trajectory lists from all participants
        tunnel_path (list): List of (x, y) tuples representing tunnel centerline
        tunnel_width (float): Width of the tunnel
        window_width (float): Width of the environment
        window_height (float): Height of the environment
        grid_resolution (int): Resolution of the heatmap grid
        save_path (str): Path to save the heatmap
        title (str): Title of the heatmap
    """
    # Create grid
    x = np.linspace(0, window_width, grid_resolution)
    y = np.linspace(0, window_height, grid_resolution)
    X, Y = np.meshgrid(x, y)
    
    # Initialize overlap density grid
    overlap_density = np.zeros_like(X)
    
    # Process each participant's trajectory separately
    participant_grids = []
    
    for trajectory in all_trajectories:
        if not trajectory:
            continue
            
        trajectory = np.array(trajectory)
        
        # Create a binary grid for this participant's trajectory
        participant_grid = np.zeros_like(X)
        
        # Mark trajectory points on the grid
        for point in trajectory:
            x_idx = int(np.clip(point[0] / window_width * grid_resolution, 0, grid_resolution-1))
            y_idx = int(np.clip(point[1] / window_height * grid_resolution, 0, grid_resolution-1))
            participant_grid[y_idx, x_idx] = 1
        
        # Apply Gaussian smoothing to create a smooth trajectory representation
        participant_grid = ndimage.gaussian_filter(participant_grid, sigma=2.0)
        participant_grids.append(participant_grid)
    
    if not participant_grids:
        print("Warning: No trajectory data found for heatmap")
        return
    
    # Calculate overlap density by summing all participant grids
    # Areas where more participants passed through will have higher values
    overlap_density = np.sum(participant_grids, axis=0)
    
    # Normalize to show overlap percentage
    max_possible_overlap = len(participant_grids)
    overlap_percentage = overlap_density / max_possible_overlap
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    
    # Use a more reasonable fixed scale for better visibility
    # Scale from 0 to 0.5 (50% overlap) to make patterns more obvious
    max_overlap_threshold = 0.5  # 50% overlap threshold
    
    # Clip values to the threshold for better visualization
    overlap_percentage_clipped = np.clip(overlap_percentage, 0, max_overlap_threshold)
    
    # Plot heatmap with fixed scale for better visibility
    im = ax.imshow(overlap_percentage_clipped, extent=[0, window_width, 0, window_height], 
                   origin='lower', cmap='Reds', alpha=0.8, aspect='equal',
                   vmin=0, vmax=max_overlap_threshold)
    
    # Draw tunnel boundaries
    tunnel_path = np.array(tunnel_path)
    xs, ys = tunnel_path[:, 0], tunnel_path[:, 1]
    half_width = tunnel_width / 2.0
    upper_boundary = ys + half_width
    lower_boundary = ys - half_width
    
    ax.plot(xs, upper_boundary, color='black', linestyle='-', linewidth=2, label="Tunnel Boundary")
    ax.plot(xs, lower_boundary, color='black', linestyle='-', linewidth=2)
    ax.fill_between(xs, lower_boundary, upper_boundary, color='lightgray', alpha=0.3)
    
    # Add colorbar with percentage labels
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Trajectory Overlap Percentage', rotation=270, labelpad=20)
    
    # Add custom tick labels for the fixed scale
    cbar.set_ticks([0, 0.1, 0.2, 0.3, 0.4, 0.5])
    cbar.set_ticklabels(['0%', '10%', '20%', '30%', '40%', '50%+'])
    
    # Set limits and labels
    ax.set_xlim(0, window_width)
    ax.set_ylim(0, window_height)
    ax.set_xlabel("X position (m)")
    ax.set_ylabel("Y position (m)")
    ax.set_title(f"{title}\n({len(participant_grids)} participants)")
    ax.legend()
    
    # Add text showing number of participants
    ax.text(0.02, 0.98, f'Participants: {len(participant_grids)}', 
            transform=ax.transAxes, fontsize=10, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9, edgecolor='black'))
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Trajectory overlap heatmap saved to {save_path}")


def create_acceleration_frequency_heatmap(all_trajectories, all_accelerations, tunnel_path, tunnel_width,
                                         window_width=0.4608, window_height=0.2592,
                                         num_segments=20, save_path="acceleration_frequency_heatmap.png",
                                         title="Acceleration/Deceleration Frequency Hot Spots"):
    """Create a heatmap showing acceleration/deceleration frequency for tunnel segments.
    
    Args:
        all_trajectories (list): List of trajectory lists from all participants
        all_accelerations (list): List of signed tangential acceleration lists from all participants
        tunnel_path (list): List of (x, y) tuples representing tunnel centerline
        tunnel_width (float): Width of the tunnel
        window_width (float): Width of the environment
        window_height (float): Height of the environment
        num_segments (int): Number of tunnel segments to create
        save_path (str): Path to save the heatmap
        title (str): Title of the heatmap
    """
    # Create tunnel segments
    tunnel_path = np.array(tunnel_path)
    xs, ys = tunnel_path[:, 0], tunnel_path[:, 1]
    
    # Create segments along the tunnel path
    segment_length = len(xs) / num_segments
    segments = []
    
    for i in range(num_segments):
        start_idx = int(i * segment_length)
        end_idx = int((i + 1) * segment_length)
        if end_idx >= len(xs):
            end_idx = len(xs) - 1
        
        # Get segment center and boundaries
        segment_x = np.mean(xs[start_idx:end_idx+1])
        segment_y = np.mean(ys[start_idx:end_idx+1])
        segment_width = tunnel_width
        
        segments.append({
            'center': (segment_x, segment_y),
            'start_idx': start_idx,
            'end_idx': end_idx,
            'width': segment_width,
            'acceleration_count': 0,
            'deceleration_count': 0,
            'total_count': 0
        })
    
    # Process each participant's data
    for trajectory, accelerations in zip(all_trajectories, all_accelerations):
        if not trajectory or not accelerations:
            continue
            
        trajectory = np.array(trajectory)
        accelerations = np.array(accelerations)
        
        # Ensure same length
        min_len = min(len(trajectory), len(accelerations))
        trajectory = trajectory[:min_len]
        accelerations = accelerations[:min_len]
        
        # For each trajectory point, find which segment it belongs to
        for point, acc in zip(trajectory, accelerations):
            point_x, point_y = point
            
            # Find the closest segment
            min_distance = float('inf')
            closest_segment = None
            
            for segment in segments:
                seg_x, seg_y = segment['center']
                distance = np.sqrt((point_x - seg_x)**2 + (point_y - seg_y)**2)
                
                # Check if point is within tunnel width of the segment
                if distance <= tunnel_width / 2:
                    if distance < min_distance:
                        min_distance = distance
                        closest_segment = segment
            
            # If point is within a segment, count the acceleration/deceleration
            if closest_segment is not None:
                closest_segment['total_count'] += 1
                if acc > 0:
                    closest_segment['acceleration_count'] += 1
                elif acc < 0:
                    closest_segment['deceleration_count'] += 1
    
    # Calculate frequencies for each segment
    num_participants = len(all_trajectories)
    for segment in segments:
        if segment['total_count'] > 0:
            segment['acceleration_freq'] = segment['acceleration_count'] / num_participants
            segment['deceleration_freq'] = segment['deceleration_count'] / num_participants
        else:
            segment['acceleration_freq'] = 0
            segment['deceleration_freq'] = 0
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    
    # Draw each segment with appropriate color, following the tunnel path
    for i, segment in enumerate(segments):
        # Get segment path points
        start_idx = segment['start_idx']
        end_idx = segment['end_idx']
        segment_xs = xs[start_idx:end_idx+1]
        segment_ys = ys[start_idx:end_idx+1]
        
        # Calculate color based on frequency
        acc_freq = segment['acceleration_freq']
        dec_freq = segment['deceleration_freq']
        
        # Determine color and intensity
        if acc_freq > dec_freq and acc_freq > 0.1:  # At least 10% acceleration
            # More acceleration than deceleration - create red gradient
            intensity = acc_freq
            # Create gradient from white to red (clamp values between 0 and 1)
            red_intensity = min(intensity, 1.0)
            red_component = max(0.0, 1.0 - red_intensity * 0.8)
            color = (1.0, red_component, red_component)
        elif dec_freq > acc_freq and dec_freq > 0.1:  # At least 10% deceleration
            # More deceleration than acceleration - create blue gradient
            intensity = dec_freq
            # Create gradient from white to blue (clamp values between 0 and 1)
            blue_intensity = min(intensity, 1.0)
            blue_component = max(0.0, 1.0 - blue_intensity * 0.8)
            color = (blue_component, blue_component, 1.0)
        else:
            # Constant speed or very low frequency
            color = (1.0, 1.0, 1.0)  # Pure white
        
        # Create segment boundaries following the tunnel path
        half_width = tunnel_width / 2.0
        upper_boundary = segment_ys + half_width
        lower_boundary = segment_ys - half_width
        
        # Fill the segment area
        ax.fill_between(segment_xs, lower_boundary, upper_boundary, 
                       color=color, alpha=0.8, edgecolor='none')
    
    # Draw tunnel boundaries
    half_width = tunnel_width / 2.0
    upper_boundary = ys + half_width
    lower_boundary = ys - half_width
    
    ax.plot(xs, upper_boundary, color='black', linestyle='-', linewidth=2, label="Tunnel Boundary")
    ax.plot(xs, lower_boundary, color='black', linestyle='-', linewidth=2)
    
    # Add colorbar showing both red and blue gradients
    from matplotlib.colors import LinearSegmentedColormap
    
    # Create a diverging colormap: blue -> white -> red
    colors = ['darkblue', 'blue', 'lightblue', 'white', 'lightcoral', 'red', 'darkred']
    n_bins = 100
    cmap = LinearSegmentedColormap.from_list('red_blue', colors, N=n_bins)
    
    # Create colorbar
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=plt.Normalize(vmin=-1, vmax=1))
    sm.set_array([])
    cbar = plt.colorbar(sm, ax=ax, shrink=0.8, pad=0.02)
    cbar.set_label('Acceleration/Deceleration Frequency', rotation=270, labelpad=20)
    
    # Set custom ticks and labels
    cbar.set_ticks([-1, -0.5, 0, 0.5, 1])
    cbar.set_ticklabels(['100% Decel', '50% Decel', 'Constant', '50% Accel', '100% Accel'])
    
    # Set limits and labels
    ax.set_xlim(0, window_width)
    ax.set_ylim(0, window_height)
    ax.set_xlabel("X position (m)")
    ax.set_ylabel("Y position (m)")
    ax.set_title(f"{title}\n({len(all_trajectories)} participants, {num_segments} segments)")
    ax.legend()
    
    # Add text showing number of participants and segments
    ax.text(0.02, 0.98, f'Participants: {len(all_trajectories)}\nSegments: {num_segments}', 
            transform=ax.transAxes, fontsize=10, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9, edgecolor='black'))
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Acceleration/Deceleration frequency heatmap saved to {save_path}")


def create_acceleration_magnitude_heatmap(all_trajectories, all_accelerations, tunnel_path, tunnel_width,
                                         window_width=0.4608, window_height=0.2592,
                                         grid_resolution=50, save_path="acceleration_magnitude_heatmap.png",
                                         title="Acceleration/Deceleration Magnitude Hot Spots"):
    """Create a heatmap showing acceleration/deceleration magnitude using grid-based approach.
    
    Args:
        all_trajectories (list): List of trajectory lists from all participants
        all_accelerations (list): List of signed tangential acceleration lists from all participants
        tunnel_path (list): List of (x, y) tuples representing tunnel centerline
        tunnel_width (float): Width of the tunnel
        window_width (float): Width of the window in meters
        window_height (float): Height of the window in meters
        grid_resolution (int): Resolution of the grid for the heatmap
        save_path (str): Path to save the heatmap
        title (str): Title for the heatmap
    """
    # Create coordinate arrays
    x_coords = np.linspace(0, window_width, grid_resolution)
    y_coords = np.linspace(0, window_height, grid_resolution)
    X, Y = np.meshgrid(x_coords, y_coords)
    
    # Initialize grids for positive and negative acceleration
    acceleration_grid = np.zeros((grid_resolution, grid_resolution))
    deceleration_grid = np.zeros((grid_resolution, grid_resolution))
    
    # Process each participant's data
    for trajectory, accelerations in zip(all_trajectories, all_accelerations):
        if not trajectory or not accelerations:
            continue
            
        trajectory = np.array(trajectory)
        accelerations = np.array(accelerations)
        
        # Ensure same length
        min_len = min(len(trajectory), len(accelerations))
        trajectory = trajectory[:min_len]
        accelerations = accelerations[:min_len]
        
        # For each trajectory point, add to the appropriate grid
        for point, acc in zip(trajectory, accelerations):
            point_x, point_y = point
            
            # Find the closest grid point
            x_idx = np.argmin(np.abs(x_coords - point_x))
            y_idx = np.argmin(np.abs(y_coords - point_y))
            
            # Check if point is within tunnel boundaries
            if is_point_in_tunnel(point_x, point_y, tunnel_path, tunnel_width):
                if acc > 0:
                    acceleration_grid[y_idx, x_idx] += acc
                elif acc < 0:
                    deceleration_grid[y_idx, x_idx] += abs(acc)
    
    # Smooth the grids
    acceleration_grid = gaussian_filter(acceleration_grid, sigma=1.0)
    deceleration_grid = gaussian_filter(deceleration_grid, sigma=1.0)
    
    # Combine grids (positive for acceleration, negative for deceleration)
    combined_grid = acceleration_grid - deceleration_grid
    
    # Set reasonable boundaries for consistent visualization
    max_acceleration_value = 20.0
    combined_grid = np.clip(combined_grid, -max_acceleration_value, max_acceleration_value)
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    
    # Plot the heatmap
    im = ax.imshow(combined_grid, extent=[0, window_width, 0, window_height], 
                   origin='lower', cmap='RdBu_r', 
                   vmin=-max_acceleration_value, vmax=max_acceleration_value, alpha=0.8)
    
    # Draw tunnel boundaries
    xs, ys = zip(*tunnel_path)
    half_width = tunnel_width / 2.0
    upper_boundary = np.array(ys) + half_width
    lower_boundary = np.array(ys) - half_width
    
    ax.plot(xs, upper_boundary, color='black', linestyle='-', linewidth=2, label="Tunnel Boundary")
    ax.plot(xs, lower_boundary, color='black', linestyle='-', linewidth=2)
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Acceleration/Deceleration Magnitude (m/s²)', rotation=270, labelpad=20)
    
    # Add custom tick labels
    cbar.set_ticks([-max_acceleration_value, 0, max_acceleration_value])
    cbar.set_ticklabels([f'-{max_acceleration_value} m/s²', '0 m/s²', f'+{max_acceleration_value} m/s²'])
    
    # Set limits and labels
    ax.set_xlim(0, window_width)
    ax.set_ylim(0, window_height)
    ax.set_xlabel("X position (m)")
    ax.set_ylabel("Y position (m)")
    ax.set_title(title)
    ax.legend()
    
    # Add participant count
    num_participants = len(all_trajectories)
    ax.text(0.02, 0.98, f'Participants: {num_participants}', transform=ax.transAxes, 
            fontsize=12, verticalalignment='top', horizontalalignment='left',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9, edgecolor='black'))
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Acceleration/Deceleration magnitude heatmap saved to {save_path}")


def process_trial_data_for_heatmaps(trial_data_list, trial_id):
    """Process trial data from multiple participants for heatmap generation.
    
    Args:
        trial_data_list (list): List of trial data from all participants
        trial_id (int): Trial ID to process
        
    Returns:
        tuple: (all_trajectories, all_accelerations, condition) or (None, None, None) if no data
    """
    all_trajectories = []
    all_accelerations = []
    condition = None
    
    for participant_data in trial_data_list:
        # Find the specific trial
        trial_data = None
        for trial in participant_data.get('trialData', []):
            if trial.get('trialId') == trial_id:
                trial_data = trial
                break
        
        if not trial_data:
            continue
            
        # Extract trajectory
        trajectory = trial_data.get('trajectory', [])
        if not trajectory:
            continue
            
        # Convert trajectory format
        if isinstance(trajectory[0], dict):
            trajectory = [(point['x'], point['y']) for point in trajectory]
        
        all_trajectories.append(trajectory)
        
        # Calculate tangential accelerations
        timestamps = trial_data.get('timestamps', [])
        if timestamps and len(timestamps) == len(trajectory):
            accelerations = calculate_tangential_acceleration(trajectory, timestamps)
        else:
            # Fallback: calculate from trajectory only
            accelerations = []
            for i in range(2, len(trajectory)):
                p1 = np.array(trajectory[i-2])
                p2 = np.array(trajectory[i-1])
                p3 = np.array(trajectory[i])
                
                # Calculate speed changes as approximation of tangential acceleration
                speed1 = np.linalg.norm(p2 - p1)
                speed2 = np.linalg.norm(p3 - p2)
                acc = speed2 - speed1  # Signed tangential acceleration
                accelerations.append(acc)
            accelerations = [0, 0] + accelerations  # Pad to match trajectory length
        
        all_accelerations.append(accelerations)
        
        # Store condition (should be the same for all participants)
        if condition is None:
            condition = trial_data.get('condition', {})
    
    if not all_trajectories:
        return None, None, None
        
    return all_trajectories, all_accelerations, condition


def analyze_trial_heatmaps(trial_data_list, output_dir, trial_id):
    """Generate heatmaps for a specific trial across all participants.
    
    Args:
        trial_data_list (list): List of participant data
        output_dir (str): Directory to save heatmaps
        trial_id (int): Trial ID to analyze
    """
    # Process trial data
    all_trajectories, all_accelerations, condition = process_trial_data_for_heatmaps(trial_data_list, trial_id)
    
    if all_trajectories is None:
        print(f"No data found for trial {trial_id}")
        return
    
    print(f"Processing trial {trial_id} with {len(all_trajectories)} participants")
    
    # Generate tunnel path
    tunnel_type = condition.get('tunnelType', 'curved')
    tunnel_path = None
    tunnel_width = None
    
    if tunnel_type == 'sequential':
        tunnel_path, segment_widths = generate_sequential_tunnel_path(condition)
        tunnel_width = np.mean(segment_widths)  # Use average width
    else:
        tunnel_curvature = condition.get('curvature', 0.01)
        tunnel_width = condition.get('tunnelWidth', 0.015)
        tunnel_path = generate_tunnel_path(tunnel_curvature)
    
    # Create output directory for this trial
    trial_output_dir = Path(output_dir) / f"trial_{trial_id}"
    trial_output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate trajectory heatmap
    trajectory_heatmap_path = trial_output_dir / f"trajectory_heatmap_trial_{trial_id}.png"
    trajectory_title = f"Trial {trial_id}: {condition.get('description', 'Unknown condition')} - Trajectory Overlap"
    
    create_trajectory_heatmap(
        all_trajectories=all_trajectories,
        tunnel_path=tunnel_path,
        tunnel_width=tunnel_width,
        save_path=str(trajectory_heatmap_path),
        title=trajectory_title
    )
    
    # Generate acceleration frequency heatmap
    acceleration_freq_heatmap_path = trial_output_dir / f"acceleration_frequency_heatmap_trial_{trial_id}.png"
    acceleration_freq_title = f"Trial {trial_id}: {condition.get('description', 'Unknown condition')} - Acceleration/Deceleration Frequency"
    
    create_acceleration_frequency_heatmap(
        all_trajectories=all_trajectories,
        all_accelerations=all_accelerations,
        tunnel_path=tunnel_path,
        tunnel_width=tunnel_width,
        num_segments=20,
        save_path=str(acceleration_freq_heatmap_path),
        title=acceleration_freq_title
    )
    
    # Generate acceleration magnitude heatmap
    acceleration_mag_heatmap_path = trial_output_dir / f"acceleration_magnitude_heatmap_trial_{trial_id}.png"
    acceleration_mag_title = f"Trial {trial_id}: {condition.get('description', 'Unknown condition')} - Acceleration/Deceleration Magnitude"
    
    create_acceleration_magnitude_heatmap(
        all_trajectories=all_trajectories,
        all_accelerations=all_accelerations,
        tunnel_path=tunnel_path,
        tunnel_width=tunnel_width,
        grid_resolution=50,
        save_path=str(acceleration_mag_heatmap_path),
        title=acceleration_mag_title
    )
    
    print(f"Heatmaps for trial {trial_id} saved to {trial_output_dir}")


def process_participant_data_for_heatmaps(input_dir, output_dir):
    """Process all participant data files and generate heatmaps for each trial.
    
    Args:
        input_dir (str): Directory containing participant JSON files
        output_dir (str): Directory to store heatmap results
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        print(f"Error: Input directory not found: {input_dir}")
        return
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Find all JSON files in the input directory
    json_files = list(input_path.glob("*.json"))
    
    if not json_files:
        print(f"No JSON files found in {input_dir}")
        return
    
    print(f"Found {len(json_files)} JSON files to process")
    print(f"Output directory: {output_path}")
    print("-" * 50)
    
    # Load all participant data
    all_participant_data = []
    for json_file in json_files:
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            # Handle both individual participant files and combined experiment files
            if isinstance(data, list):
                # Combined experiment file - add each experiment as a separate participant
                for experiment in data:
                    all_participant_data.append(experiment)
                    participant_id = experiment.get('participantId', 'unknown')
                    print(f"Loaded data for participant: {participant_id}")
            else:
                # Individual participant file
                all_participant_data.append(data)
                participant_id = data.get('participantId', json_file.stem)
                print(f"Loaded data for participant: {participant_id}")
        except Exception as e:
            print(f"Error loading {json_file.name}: {e}")
            continue
    
    if not all_participant_data:
        print("No valid participant data found")
        return
    
    # Find all unique trial IDs across all participants
    all_trial_ids = set()
    for participant_data in all_participant_data:
        for trial in participant_data.get('trialData', []):
            trial_id = trial.get('trialId')
            if trial_id is not None:
                all_trial_ids.add(trial_id)
    
    print(f"Found {len(all_trial_ids)} unique trials: {sorted(all_trial_ids)}")
    
    # Generate heatmaps for each trial
    for trial_id in sorted(all_trial_ids):
        try:
            analyze_trial_heatmaps(all_participant_data, output_path, trial_id)
        except Exception as e:
            print(f"Error processing trial {trial_id}: {e}")
            continue
    
    print("\n" + "=" * 50)
    print("Heatmap analysis complete!")
    print(f"Results saved in: {output_path}")


def main():
    """Main function to run heatmap analysis from command line."""
    parser = argparse.ArgumentParser(description='Generate trajectory and acceleration heatmaps for steering experiment')
    parser.add_argument('input_dir', help='Directory containing participant JSON data files')
    parser.add_argument('output_dir', help='Directory to store heatmap results')
    
    args = parser.parse_args()
    
    try:
        process_participant_data_for_heatmaps(args.input_dir, args.output_dir)
    except Exception as e:
        print(f"Error processing data: {e}")
        raise


if __name__ == "__main__":
    main()
