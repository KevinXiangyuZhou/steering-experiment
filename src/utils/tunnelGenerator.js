import { TUNNEL_STEP } from '../constants/experimentConstants.js';

// Generate tunnel path
export const generateTunnelPath = (curvature) => {
  const tunnelStartX = 0.0;
  const tunnelEndX = 0.46;
  const tunnelYBase = 0.13;
  const amplitude = curvature;
  const wavelength = 0.15;
  
  const path = [];
  for (let x = tunnelStartX; x < tunnelEndX; x += TUNNEL_STEP) {
    const y = tunnelYBase + amplitude * Math.sin(2 * Math.PI * x / wavelength);
    path.push({ x, y });
  }
  return path;
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

