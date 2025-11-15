// Check for tunnel boundary excursions
export const checkTunnelExcursions = (x, y, tunnelPath, tunnelType, tunnelWidth, segmentWidths) => {
  if (!tunnelPath.length) return { isExcursion: false };
  
  // Find closest point on tunnel path
  let closestDistance = Infinity;
  let closestPoint = null;
  let closestIndex = -1;
  
  tunnelPath.forEach((point, index) => {
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPoint = point;
      closestIndex = index;
    }
  });
  
  // Determine tunnel width based on tunnel type and position
  let halfWidth;
  if (tunnelType === 'sequential') {
    // Calculate which segment the point is in (2 segments)
    const segmentLength = tunnelPath.length / 2;
    const segmentIndex = Math.floor(closestIndex / segmentLength);
    const currentSegmentWidth = segmentWidths[Math.min(segmentIndex, segmentWidths.length - 1)];
    halfWidth = currentSegmentWidth / 2;
  } else {
    halfWidth = tunnelWidth / 2;
  }
  
  if (closestDistance > halfWidth) {
    // Calculate the point on the boundary where excursion occurred
    const directionX = (x - closestPoint.x) / closestDistance;
    const directionY = (y - closestPoint.y) / closestDistance;
    const boundaryPoint = {
      x: closestPoint.x + directionX * halfWidth,
      y: closestPoint.y + directionY * halfWidth
    };
    
    return { 
      isExcursion: true, 
      boundaryPoint: boundaryPoint,
      distanceOutside: closestDistance - halfWidth
    };
  }
  
  return { isExcursion: false };
};

