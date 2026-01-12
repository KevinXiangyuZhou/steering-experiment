// Check for tunnel boundary excursions
export const checkTunnelExcursions = (x, y, tunnelPath, tunnelType, tunnelWidth, segmentWidths) => {
  if (!tunnelPath.length) return { isExcursion: false };
  
  // Find closest point on tunnel path and compute perpendicular distance
  let closestDistance = Infinity;
  let closestPoint = null;
  let closestIndex = -1;
  let perpendicularDistance = Infinity;
  
  tunnelPath.forEach((point, index) => {
    // Compute tangent at this point using central differences
    let tangentX, tangentY;
    if (index === 0) {
      const next = tunnelPath[index + 1];
      tangentX = next.x - point.x;
      tangentY = next.y - point.y;
    } else if (index === tunnelPath.length - 1) {
      const prev = tunnelPath[index - 1];
      tangentX = point.x - prev.x;
      tangentY = point.y - prev.y;
    } else {
      const prev = tunnelPath[index - 1];
      const next = tunnelPath[index + 1];
      tangentX = next.x - prev.x;
      tangentY = next.y - prev.y;
    }
    
    // Normalize tangent
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLength > 0) {
      tangentX /= tangentLength;
      tangentY /= tangentLength;
    }
    
    // Compute normal (perpendicular to tangent)
    const normalX = -tangentY;
    const normalY = tangentX;
    
    // Vector from path point to cursor
    const dx = x - point.x;
    const dy = y - point.y;
    
    // Project onto normal to get perpendicular distance
    const perpDist = Math.abs(dx * normalX + dy * normalY);
    
    // Also compute Euclidean distance for closest point selection
    const euclideanDist = Math.sqrt(dx * dx + dy * dy);
    
    if (euclideanDist < closestDistance) {
      closestDistance = euclideanDist;
      closestPoint = point;
      closestIndex = index;
      perpendicularDistance = perpDist;
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
  
  // Use perpendicular distance for excursion check (ensures equal width)
  if (perpendicularDistance > halfWidth) {
    // Compute tangent and normal at closest point for boundary calculation
    let tangentX, tangentY;
    if (closestIndex === 0) {
      const next = tunnelPath[closestIndex + 1];
      tangentX = next.x - closestPoint.x;
      tangentY = next.y - closestPoint.y;
    } else if (closestIndex === tunnelPath.length - 1) {
      const prev = tunnelPath[closestIndex - 1];
      tangentX = closestPoint.x - prev.x;
      tangentY = closestPoint.y - prev.y;
    } else {
      const prev = tunnelPath[closestIndex - 1];
      const next = tunnelPath[closestIndex + 1];
      tangentX = next.x - prev.x;
      tangentY = next.y - prev.y;
    }
    
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLength > 0) {
      tangentX /= tangentLength;
      tangentY /= tangentLength;
    }
    
    const normalX = -tangentY;
    const normalY = tangentX;
    
    // Calculate the point on the boundary where excursion occurred
    // Use the normal direction (perpendicular to path) to ensure equal width
    // Determine which side of the path the cursor is on
    const dx = x - closestPoint.x;
    const dy = y - closestPoint.y;
    const dotProduct = dx * normalX + dy * normalY;
    const sign = dotProduct >= 0 ? 1 : -1; // Which side of the path
    
    const boundaryPoint = {
      x: closestPoint.x + normalX * halfWidth * sign,
      y: closestPoint.y + normalY * halfWidth * sign
    };
    
    return { 
      isExcursion: true, 
      boundaryPoint: boundaryPoint,
      distanceOutside: perpendicularDistance - halfWidth
    };
  }
  
  return { isExcursion: false };
};

