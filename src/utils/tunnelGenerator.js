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

