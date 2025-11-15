"""
Data Analysis Script for React Steering Experiment
Generates trajectory and speed plots from JSON data files for multiple participants
Example usage:
python data_analysis.py ./participant_data/ ./results/
"""

import json
import os
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.patches import Circle
import argparse
from pathlib import Path
import glob
from scipy.signal import find_peaks, savgol_filter, butter, filtfilt
from scipy.ndimage import gaussian_filter1d


def apply_noise_filtering(speeds, filter_type='savgol', **kwargs):
    """Apply various noise filtering techniques to speed data.
    
    Args:
        speeds (np.ndarray): Raw speed data
        filter_type (str): Type of filter to apply
        **kwargs: Additional parameters for specific filters
        
    Returns:
        np.ndarray: Filtered speed data
    """
    if len(speeds) < 3:
        return speeds
    
    speeds_array = np.array(speeds)
    
    if filter_type == 'savgol':
        # Savitzky-Golay filter - preserves peaks while smoothing
        window_length = kwargs.get('window_length', min(11, len(speeds_array) // 3 * 2 + 1))
        if window_length % 2 == 0:
            window_length += 1  # Must be odd
        # Ensure window length doesn't exceed data length
        window_length = min(window_length, len(speeds_array))
        if window_length < 3:
            return speeds_array  # Too short for filtering
        polyorder = kwargs.get('polyorder', min(3, window_length - 1))
        return savgol_filter(speeds_array, window_length, polyorder)
    
    elif filter_type == 'gaussian':
        # Gaussian filter - smooth but may blur sharp features
        sigma = kwargs.get('sigma', 1.0)
        return gaussian_filter1d(speeds_array, sigma)
    
    elif filter_type == 'butterworth':
        # Butterworth low-pass filter - good frequency domain filtering
        cutoff = kwargs.get('cutoff', 0.1)  # Normalized frequency
        order = kwargs.get('order', 3)
        b, a = butter(order, cutoff, btype='low', analog=False)
        return filtfilt(b, a, speeds_array)
    
    elif filter_type == 'moving_average':
        # Simple moving average
        window_size = kwargs.get('window_size', 5)
        return np.convolve(speeds_array, np.ones(window_size)/window_size, mode='same')
    
    elif filter_type == 'median':
        # Median filter - good for removing outliers
        kernel_size = kwargs.get('kernel_size', 5)
        from scipy.ndimage import median_filter
        return median_filter(speeds_array, size=kernel_size)
    
    elif filter_type == 'adaptive':
        # Adaptive filtering - combines multiple methods
        # First apply median to remove outliers
        from scipy.ndimage import median_filter
        cleaned = median_filter(speeds_array, size=3)
        # Then apply Savitzky-Golay for smoothing
        window_length = min(11, len(cleaned) // 3 * 2 + 1)
        if window_length % 2 == 0:
            window_length += 1
        return savgol_filter(cleaned, window_length, 3)
    
    else:
        return speeds_array


def parse_filter_params(param_string):
    """Parse filter parameters from command line string.
    
    Args:
        param_string (str): Comma-separated key=value pairs
        
    Returns:
        dict: Parsed parameters
    """
    if not param_string:
        return {}
    
    params = {}
    for pair in param_string.split(','):
        if '=' in pair:
            key, value = pair.strip().split('=', 1)
            # Try to convert to appropriate type
            try:
                if '.' in value:
                    params[key] = float(value)
                else:
                    params[key] = int(value)
            except ValueError:
                params[key] = value
    return params


def detect_speed_drops(speeds, min_drop_ratio=0.3, min_drop_duration=3, debug=False):
    """Detect significant speed drops in the speed profile.
    
    Simple approach: For each peak, find the very next local minimum that follows it.
    The time between peak and valley is the duration, and the proportional difference is the ratio.
    
    Args:
        speeds (list or np.ndarray): Speed values over time
        min_drop_ratio (float): Minimum ratio of speed drop to be considered significant (0-1)
        min_drop_duration (int): Minimum duration of drop in time steps
        debug (bool): Whether to print debug information
        
    Returns:
        tuple: (drop_indices, peak_indices) - Indices where significant speed drops occur and their corresponding peaks
    """
    if len(speeds) < 3:
        return [], []
    
    speeds_array = np.array(speeds)
    
    if debug:
        print(f"Debug: Analyzing {len(speeds_array)} speed points")
        print(f"Debug: Min drop ratio: {min_drop_ratio}, Min duration: {min_drop_duration}")
    
    # Step 1: Find all local peaks
    peaks, peak_properties = find_peaks(speeds_array, distance=min_drop_duration, prominence=0.001)
    
    if debug:
        print(f"Debug: Found {len(peaks)} potential peaks at indices: {peaks}")
    
    significant_drops = []
    corresponding_peaks = []
    
    # Step 2: For each peak, find the very next local minimum
    for peak_idx in peaks:
        if peak_idx >= len(speeds_array) - 1:
            if debug:
                print(f"Debug: Skipping peak {peak_idx} (at or near end)")
            continue
        
        peak_speed = speeds_array[peak_idx]
        
        # Find the next local minimum after this peak
        # Look from peak+1 to the end of the array
        search_start = peak_idx + 1
        search_end = len(speeds_array)
        
        if search_start >= search_end:
            if debug:
                print(f"Debug: Skipping peak {peak_idx} (no data after peak)")
            continue
        
        # Find local minima in the region after the peak
        after_peak = speeds_array[search_start:search_end]
        valleys_after, _ = find_peaks(-after_peak, prominence=0.001)
        
        if len(valleys_after) == 0:
            if debug:
                print(f"Debug: No valleys found after peak {peak_idx}")
            continue
        
        # Take the first (closest) valley after the peak
        first_valley_offset = valleys_after[0]
        valley_idx = search_start + first_valley_offset
        valley_speed = speeds_array[valley_idx]
        
        # Calculate duration (time steps between peak and valley)
        duration = valley_idx - peak_idx
        
        # Calculate drop ratio
        if peak_speed > 0:
            drop_ratio = (peak_speed - valley_speed) / peak_speed
        else:
            drop_ratio = 0
        
        if debug:
            print(f"Debug: Peak {peak_idx} -> Valley {valley_idx}: duration={duration}, ratio={drop_ratio:.3f}")
        
        # Check if this peak-valley pair meets our criteria
        if duration >= min_drop_duration and drop_ratio >= min_drop_ratio:
            significant_drops.append(valley_idx)
            corresponding_peaks.append(peak_idx)
            if debug:
                print(f"Debug: VALID DROP: peak={peak_speed:.3f}, valley={valley_speed:.3f}, duration={duration}, ratio={drop_ratio:.3f}")
        else:
            if debug:
                print(f"Debug: REJECTED DROP: duration={duration} (min={min_drop_duration}), ratio={drop_ratio:.3f} (min={min_drop_ratio})")
    
    if debug:
        print(f"Debug: Final significant drops: {significant_drops}")
        print(f"Debug: Corresponding peaks: {corresponding_peaks}")
    
    return significant_drops, corresponding_peaks


def draw_speed_profile(speeds, save_path="speed_profile.png", title="Speed Profile", 
                      show_connections=False, speed_drop_indices=None, speed_peak_indices=None,
                      filter_type='none', filter_params=None):
    """Draws a speed profile plot from a list of speeds.

    Args:
        speeds (_type_): List or array of speed values (e.g., cursor speeds).
        save_path (str, optional): _description_. Defaults to "speed_profile.png".
        title (str, optional): _description_. Defaults to "Speed Profile".
        show_connections (bool, optional): Whether to highlight speed drops. Defaults to False.
        speed_drop_indices (list, optional): Indices of speed drops to highlight. Defaults to None.
        filter_type (str, optional): Type of noise filtering to apply. Defaults to 'none'.
        filter_params (dict, optional): Parameters for the filter. Defaults to None.
    """
    # Filter out zero values to remove noise
    speeds_array = np.array(speeds)
    non_zero_mask = speeds_array > 0
    filtered_speeds = speeds_array[non_zero_mask]
    filtered_indices = np.where(non_zero_mask)[0]
    
    # Apply noise filtering if requested
    if filter_type != 'none' and len(filtered_speeds) > 3:
        filter_params = filter_params or {}
        filtered_speeds = apply_noise_filtering(filtered_speeds, filter_type, **filter_params)
    
    fig, ax = plt.subplots(figsize=(8, 4.5))
    
    if len(filtered_speeds) > 0:
        # Plot raw data if filtering is applied
        if filter_type != 'none':
            raw_speeds = speeds_array[non_zero_mask]
            ax.plot(filtered_indices, raw_speeds, label="Raw Speed", linewidth=0.5, color='lightgray', alpha=0.7)
            ax.plot(filtered_indices, filtered_speeds, label="Filtered Speed", linewidth=2, color='black')
        else:
            ax.plot(filtered_indices, filtered_speeds, label="Speed", linewidth=1, color='black')
        
        ax.scatter(filtered_indices, filtered_speeds, color='black', s=10, label="Time Steps", zorder=5)
        
        # Highlight speed drops if requested
        if show_connections and speed_drop_indices is not None:
            # Find which filtered indices correspond to speed drops
            drop_indices_in_filtered = []
            for drop_idx in speed_drop_indices:
                if drop_idx in filtered_indices:
                    drop_indices_in_filtered.append(np.where(filtered_indices == drop_idx)[0][0])
            
            if drop_indices_in_filtered:
                drop_speeds = filtered_speeds[drop_indices_in_filtered]
                drop_time_steps = filtered_indices[drop_indices_in_filtered]
                ax.scatter(drop_time_steps, drop_speeds, color='blue', s=50, 
                          label="Speed Drops", zorder=10, marker='X', alpha=0.6)
                
                # Add annotations for each speed drop
                for i, (ts, sp) in enumerate(zip(drop_time_steps, drop_speeds)):
                    ax.annotate(f'Drop {i+1}', (ts, sp), xytext=(5, 5), 
                              textcoords='offset points', fontsize=8, color='blue')
        
        # Highlight speed peaks (start of slowdowns) if requested
        if show_connections and speed_peak_indices is not None:
            # Find which filtered indices correspond to speed peaks
            peak_indices_in_filtered = []
            for peak_idx in speed_peak_indices:
                if peak_idx in filtered_indices:
                    peak_indices_in_filtered.append(np.where(filtered_indices == peak_idx)[0][0])
            
            if peak_indices_in_filtered:
                peak_speeds = filtered_speeds[peak_indices_in_filtered]
                peak_time_steps = filtered_indices[peak_indices_in_filtered]
                ax.scatter(peak_time_steps, peak_speeds, color='red', s=50, 
                          label="Speed Peaks", zorder=10, marker='X', alpha=0.6)
                
                # Add annotations for each speed peak
                for i, (ts, sp) in enumerate(zip(peak_time_steps, peak_speeds)):
                    ax.annotate(f'Peak {i+1}', (ts, sp), xytext=(5, -15), 
                              textcoords='offset points', fontsize=8, color='red')
    else:
        # If all speeds are zero, plot empty data
        ax.plot([], [], label="Speed", linewidth=1, color='black')
        ax.scatter([], [], color='black', s=10, label="Time Steps", zorder=5)
    
    ax.set_title(title)
    ax.set_xlabel("Time Step")
    ax.set_ylabel("Speed (m/s)")
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(True)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Speed profile saved to {save_path}")
    

def draw_trajectory(cursor_x, cursor_y, target_pos, radius,
                    window_width, window_height,
                    tunnel_path=None, tunnel_width=None, segment_widths=None, 
                    pause_coordinates=None, save_path="trajectory.png", title="Cursor Trajectory",
                    show_connections=False, speed_drop_indices=None, speed_peak_indices=None):
    """
    Draws the cursor trajectory, target, and tunnel boundaries.

    Args:
        cursor_x (list or np.ndarray): Cursor X trajectory.
        cursor_y (list or np.ndarray): Cursor Y trajectory.
        target_pos (tuple): (x, y) position of the target.
        radius (float): Target radius (same units as positions).
        window_width (float): Width of the environment (m).
        window_height (float): Height of the environment (m).
        tunnel_path (list of (x, y)): Center points of the tunnel path.
        tunnel_width (float): Width of the tunnel (same units as positions).
        pause_coordinates (list): Coordinates where pauses occurred.
        save_path (str): Path to save image file.
        title (str): Title of the plot.
        show_connections (bool, optional): Whether to highlight speed drop positions. Defaults to False.
        speed_drop_indices (list, optional): Indices of speed drops to highlight. Defaults to None.
    """
    cursor_x = np.array(cursor_x)
    cursor_y = np.array(cursor_y)
    target_x, target_y = target_pos

    fig, ax = plt.subplots(figsize=(8, 4.5))

    # Plot cursor trajectory
    ax.plot(cursor_x, cursor_y, label="Cursor Trajectory", linewidth=0.5, color='black')
    ax.scatter(cursor_x[0], cursor_y[0], color='green', label="Start", zorder=5)
    ax.scatter(cursor_x[-1], cursor_y[-1], color='blue', label="End", zorder=5)
    
    # Highlight speed drop positions if requested
    if show_connections and speed_drop_indices is not None:
        for i, drop_idx in enumerate(speed_drop_indices):
            if 0 <= drop_idx < len(cursor_x):
                ax.scatter(cursor_x[drop_idx], cursor_y[drop_idx], 
                          color='blue', s=100, marker='X', zorder=10, 
                          alpha=0.6, label="Speed Drop" if i == 0 else "")
                # Add annotation
                ax.annotate(f'Drop {i+1}', (cursor_x[drop_idx], cursor_y[drop_idx]), 
                          xytext=(10, 10), textcoords='offset points', 
                          fontsize=8, color='blue', bbox=dict(boxstyle="round,pad=0.3", 
                          facecolor='white', alpha=0.7))
    
    # Highlight speed peak positions (start of slowdowns) if requested
    if show_connections and speed_peak_indices is not None:
        for i, peak_idx in enumerate(speed_peak_indices):
            if 0 <= peak_idx < len(cursor_x):
                ax.scatter(cursor_x[peak_idx], cursor_y[peak_idx], 
                          color='red', s=100, marker='X', zorder=10, 
                          alpha=0.6, label="Speed Peak" if i == 0 else "")
                # Add annotation
                ax.annotate(f'Peak {i+1}', (cursor_x[peak_idx], cursor_y[peak_idx]), 
                          xytext=(10, -15), textcoords='offset points', 
                          fontsize=8, color='red', bbox=dict(boxstyle="round,pad=0.3", 
                          facecolor='white', alpha=0.7))

    # Draw target
    target_circle = plt.Circle((target_x, target_y), radius, color='red', alpha=0.5, label="Target")
    ax.add_patch(target_circle)
    ax.scatter([target_x], [target_y], color='red', edgecolor='black', zorder=5)

    # Draw tunnel boundaries if provided
    if tunnel_path is not None:
        tunnel_path = np.array(tunnel_path)
        xs, ys = tunnel_path[:, 0], tunnel_path[:, 1]
        
        if segment_widths is not None:
            # Sequential tunnel with varying widths
            segment_widths = np.array(segment_widths)
            half_widths = segment_widths / 2.0
            
            upper_boundary = ys + half_widths
            lower_boundary = ys - half_widths
            
            # Draw boundaries with varying widths
            ax.plot(xs, upper_boundary, color='gray', linestyle='--', linewidth=0.7, label="Tunnel Boundary")
            ax.plot(xs, lower_boundary, color='gray', linestyle='--', linewidth=0.7)
            
            # Fill tunnel area with varying widths
            ax.fill_between(xs, lower_boundary, upper_boundary, color='lightgray', alpha=0.3)
            
            # Draw vertical line at segment transition (2 segments)
            segment_length = (xs[-1] - xs[0]) / 2
            transition_x = xs[0] + segment_length
            # Find closest point to transition
            closest_idx = np.argmin(np.abs(xs - transition_x))
            if closest_idx < len(xs) and closest_idx > 0:
                y_center = ys[closest_idx]
                prev_half_width = segment_widths[closest_idx-1] / 2.0
                curr_half_width = segment_widths[closest_idx] / 2.0
                
                # Only draw if there's actually a width change
                if abs(prev_half_width - curr_half_width) > 0.001:
                    # Draw vertical connecting lines
                    ax.plot([transition_x, transition_x], 
                           [y_center - prev_half_width, y_center - curr_half_width], 
                           color='gray', linestyle='-', linewidth=1.0)
                    ax.plot([transition_x, transition_x], 
                           [y_center + prev_half_width, y_center + curr_half_width], 
                           color='gray', linestyle='-', linewidth=1.0)
        
        elif tunnel_width is not None:
            # Uniform width tunnel (curved)
            half_width = tunnel_width / 2.0
            upper_boundary = ys + half_width
            lower_boundary = ys - half_width

            ax.plot(xs, upper_boundary, color='gray', linestyle='--', linewidth=0.7, label="Tunnel Boundary")
            ax.plot(xs, lower_boundary, color='gray', linestyle='--', linewidth=0.7)

            # Fill tunnel area
            ax.fill_between(xs, lower_boundary, upper_boundary, color='lightgray', alpha=0.3)

    # --- Pause markers (excursion points) ---
    if pause_coordinates is not None:
        # Draw hollow circles around pause points
        pause_radius = 0.008 * max(window_width, window_height)
        pause_edgecolor = "orange"
        pause_linewidth = 1.0
        for x, y in pause_coordinates:
            circ = Circle((x, y), pause_radius, fill=False,
                          edgecolor=pause_edgecolor, linewidth=pause_linewidth, zorder=7)
            ax.add_patch(circ)

    # Set environment limits
    ax.set_xlim(0, window_width)
    ax.set_ylim(0, window_height)
    ax.set_aspect('equal')

    ax.set_title(title)
    ax.set_xlabel("X position (m)")
    ax.set_ylabel("Y position (m)")
    ax.invert_yaxis()  # Flip the trajectory plot upside down
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(False)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Trajectory saved to {save_path}")


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


def extract_excursion_positions(excursions):
    """Extract position coordinates from excursion events.
    
    Args:
        excursions (list): List of excursion event dictionaries
        
    Returns:
        list: List of (x, y) position tuples
    """
    positions = []
    for excursion in excursions:
        if 'position' in excursion:
            pos = excursion['position']
            if isinstance(pos, dict):
                positions.append((pos['x'], pos['y']))
            elif isinstance(pos, (list, tuple)) and len(pos) >= 2:
                positions.append((pos[0], pos[1]))
    return positions


def analyze_json_data(json_file_path, participant_output_dir, show_connections=False,
                     drop_ratio=0.3, drop_duration=3, filter_type='none', 
                     filter_params=None, debug_drops=False):
    """Analyze JSON data from React steering experiment and generate plots.
    
    Args:
        json_file_path (str): Path to JSON data file
        participant_output_dir (str): Directory to save plots for this participant
        show_connections (bool): Whether to show speed drop connections
        drop_ratio (float): Minimum speed drop ratio for detection
        drop_duration (int): Minimum speed drop duration
        filter_type (str): Type of noise filtering to apply
        filter_params (dict): Parameters for the filter
    """
    # Load JSON data
    with open(json_file_path, 'r') as f:
        data = json.load(f)
    
    # Set up output directory for this participant
    participant_output_dir = Path(participant_output_dir)
    participant_output_dir.mkdir(parents=True, exist_ok=True)
    
    participant_id = data.get('participantId', 'unknown')
    trial_data_list = data.get('trialData', [])
    
    print(f"Processing data for participant: {participant_id}")
    print(f"Number of trials: {len(trial_data_list)}")
    print(f"Output directory: {participant_output_dir}")
    
    # Environment constants (from React code)
    WINDOW_WIDTH = 0.4608  # From CANVAS_WIDTH / SCALE
    WINDOW_HEIGHT = 0.2592  # From CANVAS_HEIGHT / SCALE  
    TARGET_RADIUS = 0.01
    
    # Process each trial
    for i, trial_data in enumerate(trial_data_list):
        trial_id = trial_data.get('trialId', i+1)
        condition = trial_data.get('condition', {})
        
        print(f"Processing Trial {trial_id}: {condition.get('description', 'No description')}")
        
        # Extract trajectory data
        trajectory = trial_data.get('trajectory', [])
        if not trajectory:
            print(f"Warning: No trajectory data for trial {trial_id}")
            continue
            
        # Convert trajectory format
        if isinstance(trajectory[0], dict):
            # React format: [{x: 0.1, y: 0.2}, ...]
            cursor_x = [point['x'] for point in trajectory]
            cursor_y = [point['y'] for point in trajectory]
        else:
            # Python format: [(0.1, 0.2), ...]
            cursor_x = [point[0] for point in trajectory]
            cursor_y = [point[1] for point in trajectory]
        
        # Extract speed data
        speeds = trial_data.get('speeds', [])
        if not speeds:
            print(f"Warning: No speed data for trial {trial_id}")
            # Calculate speeds from trajectory if missing
            speeds = []
            timestamps = trial_data.get('timestamps', [])
            if len(cursor_x) > 1 and len(timestamps) > 1:
                for j in range(1, len(cursor_x)):
                    dx = cursor_x[j] - cursor_x[j-1]
                    dy = cursor_y[j] - cursor_y[j-1]
                    dt = (timestamps[j] - timestamps[j-1]) / 1000.0  # Convert ms to s
                    if dt > 0:
                        speed = np.sqrt(dx**2 + dy**2) / dt
                        speeds.append(speed)
                speeds.insert(0, 0.0)  # Initial speed is 0
        
        # Generate tunnel path from condition
        tunnel_type = condition.get('tunnelType', 'curved')
        tunnel_path = None
        tunnel_width = None
        segment_widths = None
        
        if tunnel_type == 'sequential':
            # Sequential tunnel with 2 segments
            tunnel_path, segment_widths = generate_sequential_tunnel_path(condition)
        else:
            # Curved tunnel with uniform width
            tunnel_curvature = condition.get('curvature', 0.01)
            tunnel_width = condition.get('tunnelWidth', 0.015)
            tunnel_path = generate_tunnel_path(tunnel_curvature)
        
        # Target position is at the end of tunnel
        target_pos = tunnel_path[-1]
        
        # Extract excursion positions
        excursions = trial_data.get('excursions', [])
        excursion_positions = extract_excursion_positions(excursions)
        
        # Generate file names
        trial_prefix = f"trial_{trial_id}_{participant_id}"
        trajectory_file = participant_output_dir / f"trajectory_{trial_prefix}.png"
        speed_file = participant_output_dir / f"speed_{trial_prefix}.png"
        
        # Detect speed drops if connections are enabled
        speed_drop_indices = []
        speed_peak_indices = []
        if show_connections and speeds:
            # Filter out zero speeds for consistent drop detection
            speeds_array = np.array(speeds)
            non_zero_mask = speeds_array > 0
            filtered_speeds = speeds_array[non_zero_mask]
            filtered_indices = np.where(non_zero_mask)[0]
            
            if len(filtered_speeds) > 0:
                # Apply noise filtering if requested
                if filter_type != 'none' and len(filtered_speeds) > 3:
                    filter_params = filter_params or {}
                    noise_reduced_speeds = apply_noise_filtering(filtered_speeds, filter_type, **filter_params)
                else:
                    noise_reduced_speeds = filtered_speeds
                
                # Detect drops and peaks on noise-reduced data
                filtered_drop_indices, filtered_peak_indices = detect_speed_drops(noise_reduced_speeds, drop_ratio, drop_duration, debug_drops)
                # Convert back to original indices
                speed_drop_indices = [filtered_indices[i] for i in filtered_drop_indices]
                speed_peak_indices = [filtered_indices[i] for i in filtered_peak_indices]
        
        # Create trajectory plot
        trajectory_title = f"Trial {trial_id}: {condition.get('description', 'Unknown condition')}"
        draw_trajectory(
            cursor_x=cursor_x,
            cursor_y=cursor_y,
            target_pos=target_pos,
            radius=TARGET_RADIUS,
            window_width=WINDOW_WIDTH,
            window_height=WINDOW_HEIGHT,
            tunnel_path=tunnel_path,
            tunnel_width=tunnel_width,
            segment_widths=segment_widths,
            pause_coordinates=excursion_positions,
            save_path=str(trajectory_file),
            title=trajectory_title,
            show_connections=show_connections,
            speed_drop_indices=speed_drop_indices,
            speed_peak_indices=speed_peak_indices
        )
        
        # Create speed profile plot
        if speeds:
            speed_title = f"Speed Profile - Trial {trial_id}"
            draw_speed_profile(
                speeds=speeds,
                save_path=str(speed_file),
                title=speed_title,
                show_connections=show_connections,
                speed_drop_indices=speed_drop_indices,
                speed_peak_indices=speed_peak_indices,
                filter_type=filter_type,
                filter_params=filter_params
            )
        
        # Print trial summary
        completion_time = trial_data.get('completionTime', 0)
        
        print(f"  - Completion time: {completion_time:.2f}s")
        print(f"  - Excursions: {len(excursion_positions)}")
        print()
    
    print(f"Analysis complete! Plots saved to: {participant_output_dir}")
    
    # Generate summary statistics
    generate_summary_stats(trial_data_list, participant_output_dir, participant_id)


def generate_summary_stats(trial_data_list, participant_output_dir, participant_id):
    """Generate summary statistics and save to text file.
    
    Args:
        trial_data_list (list): List of trial data dictionaries
        participant_output_dir (Path): Output directory for this participant
        participant_id (str): Participant ID
    """
    summary_file = participant_output_dir / f"summary_stats_{participant_id}.txt"
    
    # Separate trials by type
    basic_trials = [t for t in trial_data_list if t.get('condition', {}).get('timeLimit') is None]
    time_trials = [t for t in trial_data_list if t.get('condition', {}).get('timeLimit') is not None]
    
    # Further separate by tunnel type
    curved_trials = [t for t in trial_data_list if t.get('condition', {}).get('tunnelType', 'curved') == 'curved']
    sequential_trials = [t for t in trial_data_list if t.get('condition', {}).get('tunnelType') == 'sequential']
    
    # Separate basic trials by tunnel type
    basic_curved = [t for t in basic_trials if t.get('condition', {}).get('tunnelType', 'curved') == 'curved']
    basic_sequential = [t for t in basic_trials if t.get('condition', {}).get('tunnelType') == 'sequential']
    
    # Separate time trials by tunnel type
    time_curved = [t for t in time_trials if t.get('condition', {}).get('tunnelType', 'curved') == 'curved']
    time_sequential = [t for t in time_trials if t.get('condition', {}).get('tunnelType') == 'sequential']
    
    with open(summary_file, 'w') as f:
        f.write(f"Steering Experiment Analysis Summary\n")
        f.write(f"Participant: {participant_id}\n")
        f.write(f"Analysis Date: {np.datetime64('now')}\n")
        f.write("=" * 50 + "\n\n")
        
        f.write(f"Total Trials: {len(trial_data_list)}\n")
        f.write(f"Basic Trials: {len(basic_trials)}\n")
        f.write(f"  - Curved Tunnels: {len(basic_curved)}\n")
        f.write(f"  - Sequential Tunnels: {len(basic_sequential)}\n")
        f.write(f"Time-Constrained Trials: {len(time_trials)}\n")
        f.write(f"  - Curved Tunnels: {len(time_curved)}\n")
        f.write(f"  - Sequential Tunnels: {len(time_sequential)}\n\n")
        
        # Overall statistics
        if trial_data_list:
            completion_times = [t.get('completionTime', 0) for t in trial_data_list]
            
            f.write("Overall Statistics:\n")
            f.write(f"  Average completion time: {np.mean(completion_times):.2f}s\n\n")
        
        # Basic trials statistics
        if basic_trials:
            basic_times = [t.get('completionTime', 0) for t in basic_trials]
            
            f.write("Basic Trials Statistics:\n")
            f.write(f"  Average completion time: {np.mean(basic_times):.2f}s\n\n")
        
        # Time-constrained trials statistics
        if time_trials:
            time_times = [t.get('completionTime', 0) for t in time_trials]
            timeout_failures = sum(1 for t in time_trials if t.get('failedDueToTimeout', False))
            
            f.write("Time-Constrained Trials Statistics:\n")
            f.write(f"  Average completion time: {np.mean(time_times):.2f}s\n")
            f.write(f"  Timeout failures: {timeout_failures}\n\n")
        
        # Curved tunnel statistics
        if curved_trials:
            curved_times = [t.get('completionTime', 0) for t in curved_trials]
            
            f.write("Curved Tunnel Statistics:\n")
            f.write(f"  Average completion time: {np.mean(curved_times):.2f}s\n\n")
        
        # Sequential tunnel statistics
        if sequential_trials:
            sequential_times = [t.get('completionTime', 0) for t in sequential_trials]
            
            f.write("Sequential Tunnel Statistics:\n")
            f.write(f"  Average completion time: {np.mean(sequential_times):.2f}s\n\n")
        
        # Individual trial details
        f.write("Individual Trial Details:\n")
        f.write("-" * 30 + "\n")
        for trial in trial_data_list:
            trial_id = trial.get('trialId', 'Unknown')
            condition = trial.get('condition', {})
            completion_time = trial.get('completionTime', 0)
            
            f.write(f"Trial {trial_id}: {condition.get('description', 'No description')}\n")
            f.write(f"  Time: {completion_time:.2f}s\n")
    
    print(f"Summary statistics saved to: {summary_file}")


def process_participant_data(input_dir, output_dir, show_connections=False, 
                           drop_ratio=0.3, drop_duration=3, filter_type='none', 
                           filter_params=None, debug_drops=False):
    """Process all participant data files in the input directory.
    
    Args:
        input_dir (str): Directory containing participant JSON files
        output_dir (str): Directory to store analysis results
        show_connections (bool): Whether to show speed drop connections
        drop_ratio (float): Minimum speed drop ratio for detection
        drop_duration (int): Minimum speed drop duration
        filter_type (str): Type of noise filtering to apply
        filter_params (dict): Parameters for the filter
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
    
    # Process each participant file
    for json_file in json_files:
        try:
            # Extract participant ID from filename or load from JSON
            with open(json_file, 'r') as f:
                data = json.load(f)
            participant_id = data.get('participantId', json_file.stem)
            
            # Create participant-specific output directory
            participant_output_dir = output_path / f"participant_{participant_id}"
            
            print(f"\nProcessing: {json_file.name}")
            print(f"Participant ID: {participant_id}")
            
            # Analyze this participant's data
            analyze_json_data(json_file, participant_output_dir, 
                            show_connections, drop_ratio, drop_duration,
                            filter_type, filter_params, debug_drops)
            
        except Exception as e:
            print(f"Error processing {json_file.name}: {e}")
            continue
    
    print("\n" + "=" * 50)
    print("All participants processed!")
    print(f"Results saved in: {output_path}")


def main():
    """Main function to run data analysis from command line."""
    parser = argparse.ArgumentParser(description='Analyze React steering experiment data for multiple participants')
    parser.add_argument('input_dir', help='Directory containing participant JSON data files')
    parser.add_argument('output_dir', help='Directory to store analysis results')
    parser.add_argument('--show-connections', action='store_true', 
                       help='Show connections between speed drops and trajectory positions')
    parser.add_argument('--drop-ratio', type=float, default=0.3,
                       help='Minimum speed drop ratio to be considered significant (0-1, default: 0.3)')
    parser.add_argument('--drop-duration', type=int, default=3,
                       help='Minimum duration of speed drop in time steps (default: 3)')
    parser.add_argument('--filter-type', type=str, default='none',
                       choices=['none', 'savgol', 'gaussian', 'butterworth', 'moving_average', 'median', 'adaptive'],
                       help='Type of noise filtering to apply (default: none)')
    parser.add_argument('--filter-params', type=str, default='',
                       help='Filter parameters as key=value pairs separated by commas (e.g., "window_length=15,sigma=2.0")')
    parser.add_argument('--debug-drops', action='store_true',
                       help='Enable debug output for speed drop detection')
    
    args = parser.parse_args()
    
    try:
        filter_params = parse_filter_params(args.filter_params)
        process_participant_data(args.input_dir, args.output_dir, 
                               show_connections=args.show_connections,
                               drop_ratio=args.drop_ratio,
                               drop_duration=args.drop_duration,
                               filter_type=args.filter_type,
                               filter_params=filter_params,
                               debug_drops=args.debug_drops)
    except Exception as e:
        print(f"Error processing data: {e}")
        raise


if __name__ == "__main__":
    main()