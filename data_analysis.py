"""
Data Analysis Script for React Steering Experiment
Generates trajectory and speed plots from JSON data files
"""

import json
import os
import numpy as np
from matplotlib import pyplot as plt
from matplotlib.patches import Circle
import argparse
from pathlib import Path


def draw_speed_profile(speeds, save_path="speed_profile.png", title="Speed Profile"):
    """Draws a speed profile plot from a list of speeds.

    Args:
        speeds (_type_): List or array of speed values (e.g., cursor speeds).
        save_path (str, optional): _description_. Defaults to "speed_profile.png".
        title (str, optional): _description_. Defaults to "Speed Profile".
    """
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.plot(speeds, label="Speed", linewidth=1, color='black')
    ax.scatter(range(len(speeds)), speeds, color='black', s=10, label="Time Steps", zorder=5)
    ax.set_title(title)
    ax.set_xlabel("Time Step")
    ax.set_ylabel("Speed (m/s)")
    ax.legend()
    ax.grid(True)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"Speed profile saved to {save_path}")
    

def draw_trajectory(cursor_x, cursor_y, target_pos, radius,
                    window_width, window_height,
                    tunnel_path=None, tunnel_width=None, segment_widths=None, 
                    pause_coordinates=None, save_path="trajectory.png", title="Cursor Trajectory"):
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
        save_path (str): Path to save image file.
        title (str): Title of the plot.
    """
    cursor_x = np.array(cursor_x)
    cursor_y = np.array(cursor_y)
    target_x, target_y = target_pos

    fig, ax = plt.subplots(figsize=(8, 4.5))

    # Plot cursor trajectory
    ax.plot(cursor_x, cursor_y, label="Cursor Trajectory", linewidth=0.5, color='black')
    ax.scatter(cursor_x[0], cursor_y[0], color='green', label="Start", zorder=5)
    ax.scatter(cursor_x[-1], cursor_y[-1], color='blue', label="End", zorder=5)

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
    ax.legend()
    ax.grid(False)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
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


def analyze_json_data(json_file_path, output_dir=None):
    """Analyze JSON data from React steering experiment and generate plots.
    
    Args:
        json_file_path (str): Path to JSON data file
        output_dir (str, optional): Directory to save plots. If None, saves next to JSON file.
    """
    # Load JSON data
    with open(json_file_path, 'r') as f:
        data = json.load(f)
    
    # Set up output directory
    if output_dir is None:
        output_dir = Path(json_file_path).parent / "plots"
    else:
        output_dir = Path(output_dir)
    
    output_dir.mkdir(exist_ok=True)
    
    participant_id = data.get('participantId', 'unknown')
    trial_data_list = data.get('trialData', [])
    
    print(f"Processing data for participant: {participant_id}")
    print(f"Number of trials: {len(trial_data_list)}")
    
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
        trajectory_file = output_dir / f"trajectory_{trial_prefix}.png"
        speed_file = output_dir / f"speed_{trial_prefix}.png"
        
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
            title=trajectory_title
        )
        
        # Create speed profile plot
        if speeds:
            speed_title = f"Speed Profile - Trial {trial_id}"
            draw_speed_profile(
                speeds=speeds,
                save_path=str(speed_file),
                title=speed_title
            )
        
        # Print trial summary
        completion_time = trial_data.get('completionTime', 0)
        
        print(f"  - Completion time: {completion_time:.2f}s")
        print(f"  - Excursions: {len(excursion_positions)}")
        print()
    
    print(f"Analysis complete! Plots saved to: {output_dir}")
    
    # Generate summary statistics
    generate_summary_stats(trial_data_list, output_dir, participant_id)


def generate_summary_stats(trial_data_list, output_dir, participant_id):
    """Generate summary statistics and save to text file.
    
    Args:
        trial_data_list (list): List of trial data dictionaries
        output_dir (Path): Output directory
        participant_id (str): Participant ID
    """
    summary_file = output_dir / f"summary_stats_{participant_id}.txt"
    
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


def main():
    """Main function to run data analysis from command line."""
    parser = argparse.ArgumentParser(description='Analyze React steering experiment data')
    parser.add_argument('json_file', help='Path to JSON data file')
    parser.add_argument('--output-dir', '-o', help='Output directory for plots (default: next to JSON file)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.json_file):
        print(f"Error: JSON file not found: {args.json_file}")
        return
    
    try:
        analyze_json_data(args.json_file, args.output_dir)
    except Exception as e:
        print(f"Error analyzing data: {e}")
        raise


if __name__ == "__main__":
    main()