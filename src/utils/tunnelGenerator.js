import { TUNNEL_STEP } from '../constants/experimentConstants.js';

/**
 * Generate a tunnel path using a sine wave curve.
 * 
 * @param {number} width - Tunnel width (narrow=0.02 or wide=0.05) relative to screen size.
 * @param {number} curvature - Curvature amplitude (gentle=0.025 or sharp=0.05).
 * @param {number} startX - Starting x-coordinate of tunnel. Default 0.0.
 * @param {number} endX - Ending x-coordinate of tunnel. Default 0.46.
 * @param {number} yBase - Base y-coordinate for tunnel centerline. Default 0.13.
 * @param {number} wavelength - Wavelength for sine wave. Default 0.15.
 * @param {number} stepSize - Step size along x-axis. Default 0.002.
 * @returns {Array} Array containing [tunnel_path, width] where tunnel_path is an array of {x, y} objects.
 */
export const generateTunnelPath = (
  width,
  curvature,
  startX = 0.0,
  endX = 0.46,
  yBase = 0.13,
  wavelength = 0.15,
  stepSize = 0.002
) => {
  // Generate x coordinates
  const path = [];
  for (let x = startX; x < endX; x += stepSize) {
    // Generate y coordinates using sine wave
    // amplitude = curvature parameter
    const amplitude = curvature;
    const y = yBase + amplitude * Math.sin(2 * Math.PI * x / wavelength);
    path.push({ x, y });
  }
  
  // Return tunnel path and width (consistent with Python implementation)
  return [path, width];
};

// Generate sequential tunnel segments (2 segments)
export const generateSequentialTunnelPath = (condition) => {
  const tunnelStartX = 0.0;
  const tunnelEndX = 0.46;
  const tunnelYBase = 0.13;
  const segmentLength = (tunnelEndX - tunnelStartX) / 2; // 2 segments instead of 3
  
  const path = [];
  for (let x = tunnelStartX; x < tunnelEndX; x += TUNNEL_STEP) {
    let y = tunnelYBase; // Default horizontal line
    
    // Apply curvature for straight-to-curved segments
    if (condition.segmentType === 'curvature') {
      if (x < tunnelStartX + segmentLength) {
        // First segment: straight (curvature = 0)
        y = tunnelYBase;
      } else {
        // Second segment: curved with single peak
        const segmentX = x - (tunnelStartX + segmentLength);
        const amplitude = condition.segment2Curvature;
        const segmentWidth = segmentLength;
        // Create a single peak curve using a quadratic function
        const normalizedX = segmentX / segmentWidth; // 0 to 1
        y = tunnelYBase + amplitude * (1 - Math.pow(2 * normalizedX - 1, 2));
      }
    }
    
    path.push({ x, y });
  }
  return path;
};

/**
 * Generate a tunnel path with 90-degree corners.
 * 
 * Creates a path that alternates between horizontal and vertical segments,
 * forming a path with sharp 90-degree turns. Each segment (horizontal + vertical)
 * has equal total length.
 * 
 * @param {number} width - Tunnel width (consistent throughout).
 * @param {number} startX - Starting x-coordinate of tunnel. Default 0.0.
 * @param {number} endX - Ending x-coordinate of tunnel. Default 0.46.
 * @param {number} yBase - Base y-coordinate for tunnel centerline. Default 0.13.
 * @param {number} numCorners - Number of 90-degree corners. Default 3.
 * @param {number} cornerOffset - Vertical offset for each corner segment. Default 0.05.
 * @param {number} stepSize - Step size along path segments. Default 0.002.
 * @returns {Array} Array containing [tunnel_path, width] where tunnel_path is an array of {x, y} objects.
 */
export const generateCornerPath = (
  width,
  startX = 0.0,
  endX = 0.46,
  yBase = 0.13,
  numCorners = 3,
  cornerOffset = 0.05,
  stepSize = 0.002
) => {
  const tunnelPath = [];
  
  // Calculate total horizontal distance we need to cover
  const totalXDistance = endX - startX;
  
  // Make all horizontal segments have equal length
  // We have: numCorners horizontal segments (before corners) + 1 final horizontal segment
  // Total: (numCorners + 1) horizontal segments, each with equal length
  const horizontalLengthPerSegment = totalXDistance / (numCorners + 1);
  
  let currentX = startX;
  let currentY = yBase;
  
  // Generate combined segments (horizontal + vertical)
  for (let cornerIdx = 0; cornerIdx < numCorners; cornerIdx++) {
    // Horizontal segment before corner - same length for all horizontal segments
    const xEnd = currentX + horizontalLengthPerSegment;
    // Generate x coordinates similar to np.arange(currentX, xEnd + stepSize * 0.5, stepSize)
    let x = currentX;
    while (x < xEnd + stepSize * 0.5) {
      if (x <= xEnd) {
        tunnelPath.push({ x, y: currentY });
      }
      x += stepSize;
    }
    // Ensure exact endpoint
    if (tunnelPath.length === 0 || Math.abs(tunnelPath[tunnelPath.length - 1].x - xEnd) > 1e-6) {
      tunnelPath.push({ x: xEnd, y: currentY });
    } else {
      tunnelPath[tunnelPath.length - 1] = { x: xEnd, y: currentY };
    }
    currentX = xEnd;
    
    // Vertical segment (corner) - exactly cornerOffset length
    const direction = cornerIdx % 2 === 0 ? 1.0 : -1.0;
    const currentYStart = currentY;
    const currentYEnd = currentY + direction * cornerOffset;
    
    // Generate vertical segment with exact cornerOffset length
    // Similar to np.arange for vertical movement
    if (direction > 0) {
      // Moving up: np.arange(currentYStart + stepSize, currentYEnd + stepSize * 0.5, stepSize)
      let y = currentYStart + stepSize;
      while (y < currentYEnd + stepSize * 0.5) {
        tunnelPath.push({ x: currentX, y });
        y += stepSize;
      }
    } else {
      // Moving down: np.arange(currentYStart - stepSize, currentYEnd - stepSize * 0.5, -stepSize)
      let y = currentYStart - stepSize;
      while (y > currentYEnd - stepSize * 0.5) {
        tunnelPath.push({ x: currentX, y });
        y -= stepSize;
      }
    }
    
    // Ensure we include the end point
    if (tunnelPath.length === 0 || Math.abs(tunnelPath[tunnelPath.length - 1].y - currentYEnd) > stepSize * 0.5) {
      tunnelPath.push({ x: currentX, y: currentYEnd });
    }
    
    currentY = currentYEnd;
  }
  
  // Final horizontal segment - same length as all other horizontal segments
  let finalXEnd = currentX + horizontalLengthPerSegment;
  // But we must end at endX, so clip if necessary
  finalXEnd = Math.min(finalXEnd, endX);
  
  // Generate final horizontal segment: np.arange(currentX + stepSize, finalXEnd + stepSize * 0.5, stepSize)
  let x = currentX + stepSize;
  while (x < finalXEnd + stepSize * 0.5) {
    if (x <= finalXEnd) {
      tunnelPath.push({ x, y: currentY });
    }
    x += stepSize;
  }
  
  // Ensure we end exactly at endX
  if (tunnelPath.length === 0 || Math.abs(tunnelPath[tunnelPath.length - 1].x - endX) > 1e-6) {
    tunnelPath.push({ x: endX, y: currentY });
  } else {
    tunnelPath[tunnelPath.length - 1] = { x: endX, y: currentY };
  }
  
  return [tunnelPath, width];
};

/**
 * Generate a lasso selection path that loops around target squares in a grid.
 * 
 * Creates a clockwise path around all target squares ('X') in the grid layout,
 * forming a closed loop that traces the outer boundary of the target cluster.
 * 
 * @param {Object} condition - Trial condition with lasso parameters:
 *   - grid_layout: Array of strings defining the grid (e.g., ["X X .", ". X X"])
 *   - icon_radius: Half the size of each square (default: 0.01)
 *   - icon_spacing: Distance between icon centers (default: 0.05)
 *   - grid_origin: [x, y] origin of grid (default: [0.1, 0.1])
 *   - margin_size: Gap between icons (computed as icon_spacing - 2 * icon_radius)
 * @param {number} stepSize - Step size along path. Default 0.002.
 * @returns {Array} Array containing [tunnel_path, width, startPos, endPos] where:
 *   - tunnel_path is an array of {x, y} objects
 *   - width is the effective tunnel width (margin)
 *   - startPos is {x, y} start position computed from grid top-left corner
 *   - endPos is {x, y} end position computed from grid top-left corner
 */
export const generateLassoPath = (condition, stepSize = 0.002) => {
  const {
    grid_layout,
    icon_radius = 0.01,
    icon_spacing = 0.05,
    grid_origin = [0.1, 0.1],
    margin_size = null
  } = condition;

  // Compute margin if not provided
  const margin = margin_size !== null ? margin_size : icon_spacing - 2 * icon_radius;

  // Parse grid layout to find target positions
  const targets = [];
  const rows = grid_layout.length;

  for (let row = 0; row < rows; row++) {
    const cells = grid_layout[row].split(/\s+/).filter(c => c.length > 0);
    for (let col = 0; col < cells.length; col++) {
      if (cells[col] === 'X') {
        // Grid cell positioning: x = origin_x + col_idx * icon_spacing
        const x = grid_origin[0] + col * icon_spacing;
        const y = grid_origin[1] + row * icon_spacing;
        targets.push({ x, y, row, col });
      }
    }
  }

  if (targets.length === 0) {
    // Fallback: return a simple square path
    const size = 0.1;
    const fallbackPath = [
      { x: grid_origin[0], y: grid_origin[1] },
      { x: grid_origin[0] + size, y: grid_origin[1] },
      { x: grid_origin[0] + size, y: grid_origin[1] + size },
      { x: grid_origin[0], y: grid_origin[1] + size },
      { x: grid_origin[0], y: grid_origin[1] }
    ];
    const fallbackStart = fallbackPath[0];
    const fallbackEnd = fallbackPath[fallbackPath.length - 1];
    return [fallbackPath, margin, fallbackStart, fallbackEnd];
  }

  // Compute start and end positions based on top-left corner of target cluster
  // Find top-left target: min_y (topmost), then min_x among topmost (leftmost)
  const topmostY = Math.min(...targets.map(t => t.y));
  const topmostTargets = targets.filter(t => Math.abs(t.y - topmostY) < 1e-6);
  const leftmostX = Math.min(...topmostTargets.map(t => t.x));
  const topLeftTarget = { x: leftmostX, y: topmostY };

  // Compute gap intersection (corner between icons)
  const gapOffset = icon_spacing * 0.5;
  const cornerX = topLeftTarget.x - gapOffset;  // Left of leftmost icon
  const cornerY = topLeftTarget.y - gapOffset; // Above topmost icon

  // Start position: left of corner by margin_size
  const startPos = {
    x: cornerX - margin,
    y: cornerY
  };

  // End position: same x as corner, slightly below
  const endPos = {
    x: cornerX,
    y: cornerY + gapOffset * 0.5
  };

  // Find bounding box of targets with margin
  const minX = Math.min(...targets.map(t => t.x)) - icon_radius - margin;
  const maxX = Math.max(...targets.map(t => t.x)) + icon_radius + margin;
  const minY = Math.min(...targets.map(t => t.y)) - icon_radius - margin;
  const maxY = Math.max(...targets.map(t => t.y)) + icon_radius + margin;

  // Generate clockwise path around the bounding box
  // The path forms a closed loop that starts and ends at the same point
  // Start/end positions will be at path[0] and path[path.length - 1] (like other tunnel types)
  const path = [];
  
  // Start at top-left corner of bounding box
  path.push({ x: minX, y: minY });
  
  // Top edge (left to right)
  for (let x = minX + stepSize; x <= maxX; x += stepSize) {
    path.push({ x, y: minY });
  }
  
  // Right edge (top to bottom)
  for (let y = minY + stepSize; y <= maxY; y += stepSize) {
    path.push({ x: maxX, y });
  }
  
  // Bottom edge (right to left)
  for (let x = maxX - stepSize; x >= minX; x -= stepSize) {
    path.push({ x, y: maxY });
  }
  
  // Left edge (bottom to top, back to top-left corner)
  for (let y = maxY - stepSize; y >= minY; y -= stepSize) {
    path.push({ x: minX, y });
  }
  
  // Close the loop by returning to start position
  path.push({ x: minX, y: minY });

  // Return path, effective tunnel width (margin), and computed start/end positions
  return [path, margin, startPos, endPos];
};

