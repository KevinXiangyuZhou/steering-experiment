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

/**
 * Check for collisions in lasso selection tasks:
 * 1. Cursor cannot move within 2/3 radius of gray (distractor) icons
 * 2. Cursor cannot move within 2/3 radius of yellow (target) icons
 * @param {number} x - Cursor x position
 * @param {number} y - Cursor y position
 * @param {Object} lassoConfig - Lasso configuration with grid_layout, icon_radius, icon_spacing, grid_origin
 * @returns {Object} Object with isExcursion boolean indicating if cursor violates constraints
 */
export const checkLassoGrayIconCollision = (x, y, lassoConfig) => {
  if (!lassoConfig || !lassoConfig.grid_layout) {
    return { isExcursion: false };
  }

  const { grid_layout, icon_radius, icon_spacing, grid_origin } = lassoConfig;
  const [originX, originY] = grid_origin;
  
  // Threshold for both gray and yellow icons: cursor must stay outside 2/3 of the icon radius
  const thresholdDistance = icon_radius * (2 / 3);

  // Check each grid cell
  for (let row = 0; row < grid_layout.length; row++) {
    const cells = grid_layout[row].split(/\s+/).filter(c => c.length > 0);
    for (let col = 0; col < cells.length; col++) {
      const cellType = cells[col];
      const cellX = originX + col * icon_spacing;
      const cellY = originY + row * icon_spacing;
      
      // Check distance from cursor to icon center
      const dx = x - cellX;
      const dy = y - cellY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check 1: Cannot move too close to gray (distractor) icons
      if (cellType === '.' || cellType === ' ') {
        // Check if cursor is too close (within 2/3 of icon radius)
        if (distance <= thresholdDistance) {
          // Calculate the boundary point (at threshold distance from icon center)
          const angle = Math.atan2(dy, dx);
          const boundaryX = cellX + Math.cos(angle) * thresholdDistance;
          const boundaryY = cellY + Math.sin(angle) * thresholdDistance;
          
          return {
            isExcursion: true,
            boundaryPoint: { x: boundaryX, y: boundaryY },
            distanceOutside: thresholdDistance - distance // How far inside the threshold
          };
        }
      }
      
      // Check 2: Cannot move too close to yellow (target) icons
      if (cellType === 'X') {
        // Check if cursor is too close (within 2/3 of icon radius)
        if (distance <= thresholdDistance) {
          // Calculate the boundary point (at threshold distance from icon center)
          const angle = Math.atan2(dy, dx);
          const boundaryX = cellX + Math.cos(angle) * thresholdDistance;
          const boundaryY = cellY + Math.sin(angle) * thresholdDistance;
          
          return {
            isExcursion: true,
            boundaryPoint: { x: boundaryX, y: boundaryY },
            distanceOutside: thresholdDistance - distance // How far inside the threshold
          };
        }
      }
    }
  }

  return { isExcursion: false };
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {Array} polygon - Array of {x, y} points defining the polygon
 * @returns {boolean} True if point is inside polygon
 */
const pointInPolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Check if two points are Manhattan adjacent (share same row or same column)
 * @param {Object} a - First point {x, y}
 * @param {Object} b - Second point {x, y}
 * @returns {boolean} True if points share same row or same column
 */
const isManhattanAdjacent = (a, b) => {
  const sameRow = Math.abs(a.y - b.y) < 1e-6;
  const sameCol = Math.abs(a.x - b.x) < 1e-6;
  return sameRow || sameCol;
};

/**
 * Sort all target centers by clockwise perimeter traversal:
 * 1. Top row (left → right)
 * 2. Right column (top → bottom)
 * 3. Bottom row (right → left)
 * 4. Left column (bottom → top)
 * Constraint: Consecutive waypoints must share same row or column (Manhattan adjacency)
 * @param {Array} targets - Array of target positions with {x, y, row, col}
 * @returns {Array} Array of all target positions sorted in perimeter traversal order
 */
export const sortTargetsClockwise = (targets) => {
  if (targets.length === 0) return [];
  if (targets.length === 1) return targets;
  
  const minX = Math.min(...targets.map(t => t.x));
  const maxX = Math.max(...targets.map(t => t.x));
  const minY = Math.min(...targets.map(t => t.y));
  const maxY = Math.max(...targets.map(t => t.y));
  
  const ordered = [];
  const seen = new Set();
  
  // 1. Top row: left → right
  const topRowTargets = targets.filter(t => Math.abs(t.y - minY) < 1e-6)
    .sort((a, b) => a.x - b.x);
  for (const target of topRowTargets) {
    const key = `${target.x},${target.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(target);
    }
  }
  
  // 2. Right column: top → bottom (excluding topmost already added)
  const rightColTargets = targets.filter(t => 
    Math.abs(t.x - maxX) < 1e-6 && Math.abs(t.y - minY) > 1e-6
  ).sort((a, b) => a.y - b.y);
  for (const target of rightColTargets) {
    const key = `${target.x},${target.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(target);
    }
  }
  
  // 3. Bottom row: right → left (excluding rightmost already added)
  const bottomRowTargets = targets.filter(t => 
    Math.abs(t.y - maxY) < 1e-6 && Math.abs(t.x - maxX) > 1e-6
  ).sort((a, b) => b.x - a.x);
  for (const target of bottomRowTargets) {
    const key = `${target.x},${target.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(target);
    }
  }
  
  // 4. Left column: bottom → top (excluding bottommost and topmost already added)
  const leftColTargets = targets.filter(t => 
    Math.abs(t.x - minX) < 1e-6 && 
    Math.abs(t.y - minY) > 1e-6 && 
    Math.abs(t.y - maxY) > 1e-6
  ).sort((a, b) => b.y - a.y);
  for (const target of leftColTargets) {
    const key = `${target.x},${target.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(target);
    }
  }
  
  // 5. Add any remaining inner targets (not on perimeter)
  // Insert them ensuring Manhattan adjacency with previous point
  const remainingTargets = targets.filter(t => {
    const key = `${t.x},${t.y}`;
    return !seen.has(key);
  });
  
  // Sort remaining by column then row for consistent insertion
  remainingTargets.sort((a, b) => {
    if (Math.abs(a.x - b.x) > 1e-6) return a.x - b.x;
    return a.y - b.y;
  });
  
  // Insert inner targets ensuring Manhattan adjacency
  for (const target of remainingTargets) {
    let bestInsertIndex = -1;
    let bestScore = Infinity;
    
    // Try inserting at each position and check Manhattan adjacency
    for (let i = 0; i <= ordered.length; i++) {
      const prev = i > 0 ? ordered[i - 1] : null;
      const next = i < ordered.length ? ordered[i] : null;
      
      // Check if insertion maintains Manhattan adjacency
      let valid = true;
      if (prev && !isManhattanAdjacent(prev, target)) {
        valid = false;
      }
      if (next && !isManhattanAdjacent(target, next)) {
        valid = false;
      }
      
      if (valid) {
        // Prefer positions that maintain grid structure
        // Score: prefer same column/row as neighbors
        let score = 0;
        if (prev) {
          if (Math.abs(prev.x - target.x) < 1e-6) score -= 10; // Same column
          if (Math.abs(prev.y - target.y) < 1e-6) score -= 10; // Same row
        }
        if (next) {
          if (Math.abs(next.x - target.x) < 1e-6) score -= 10; // Same column
          if (Math.abs(next.y - target.y) < 1e-6) score -= 10; // Same row
        }
        
        if (score < bestScore) {
          bestScore = score;
          bestInsertIndex = i;
        }
      }
    }
    
    // If no valid position found that maintains adjacency, find closest Manhattan-adjacent position
    if (bestInsertIndex === -1) {
      for (let i = 0; i <= ordered.length; i++) {
        const prev = i > 0 ? ordered[i - 1] : null;
        const next = i < ordered.length ? ordered[i] : null;
        
        // Check Manhattan adjacency with at least one neighbor
        const adjToPrev = prev && isManhattanAdjacent(prev, target);
        const adjToNext = next && isManhattanAdjacent(target, next);
        
        if (adjToPrev || adjToNext) {
          bestInsertIndex = i;
          break;
        }
      }
    }
    
    // Fallback: insert at end if no valid position found
    if (bestInsertIndex === -1) {
      bestInsertIndex = ordered.length;
    }
    
    ordered.splice(bestInsertIndex, 0, target);
  }
  
  // Final validation: ensure all consecutive pairs are Manhattan adjacent
  // If not, try to fix by reordering
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    
    if (!isManhattanAdjacent(prev, curr)) {
      // Find the next Manhattan-adjacent point
      let found = false;
      for (let j = i + 1; j < ordered.length; j++) {
        if (isManhattanAdjacent(prev, ordered[j])) {
          // Swap current with found point
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
          found = true;
          break;
        }
      }
      
      // If no swap found, try to find a point that's adjacent to both
      if (!found) {
        for (let j = i + 1; j < ordered.length; j++) {
          const candidate = ordered[j];
          if (isManhattanAdjacent(prev, candidate) && 
              (j === ordered.length - 1 || isManhattanAdjacent(candidate, ordered[j + 1]))) {
            // Insert candidate at position i
            ordered.splice(j, 1);
            ordered.splice(i, 0, candidate);
            found = true;
            break;
          }
        }
      }
    }
  }
  
  return ordered;
};

/**
 * Check for lasso selection shortcuts/cheating:
 * 1. Prevent cursor from moving into the region formed by connecting all target centers clockwise
 * 2. Prevent direct path from start to end using a horizontal bar region
 * @param {number} x - Cursor x position
 * @param {number} y - Cursor y position
 * @param {Object} lassoConfig - Lasso configuration with grid_layout, icon_radius, icon_spacing, grid_origin
 * @param {Object} startPos - Start position {x, y}
 * @param {Object} endPos - End position {x, y}
 * @returns {Object} Object with isExcursion boolean indicating if cursor violates constraints
 */
export const checkLassoShortcut = (x, y, lassoConfig, startPos, endPos) => {
  if (!lassoConfig || !lassoConfig.grid_layout || !startPos || !endPos) {
    return { isExcursion: false };
  }

  const { grid_layout, icon_radius, icon_spacing, grid_origin } = lassoConfig;
  const [originX, originY] = grid_origin;
  
  // Parse grid layout to find target positions
  const targets = [];
  for (let row = 0; row < grid_layout.length; row++) {
    const cells = grid_layout[row].split(/\s+/).filter(c => c.length > 0);
    for (let col = 0; col < cells.length; col++) {
      if (cells[col] === 'X') {
        const targetX = originX + col * icon_spacing;
        const targetY = originY + row * icon_spacing;
        targets.push({ x: targetX, y: targetY, row, col });
      }
    }
  }
  
  if (targets.length === 0) {
    return { isExcursion: false };
  }
  
  // Check 1: Prevent cursor from moving into the region formed by connecting all target centers clockwise
  const sortedTargets = sortTargetsClockwise(targets);
  if (sortedTargets.length >= 3) {
    // Create polygon from all target centers in clockwise order
    const polygon = sortedTargets.map(t => ({ x: t.x, y: t.y }));
    
    // Check if cursor is inside the polygon (cheating - going through the middle)
    if (pointInPolygon(x, y, polygon)) {
      // Find closest point on polygon boundary
      let minDist = Infinity;
      let closestPoint = { x, y };
      
      for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        // Project point onto line segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len2 = dx * dx + dy * dy;
        
        if (len2 > 0) {
          const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / len2));
          const projX = p1.x + t * dx;
          const projY = p1.y + t * dy;
          const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
          
          if (dist < minDist) {
            minDist = dist;
            closestPoint = { x: projX, y: projY };
          }
        }
      }
      
      return {
        isExcursion: true,
        boundaryPoint: closestPoint,
        distanceOutside: minDist
      };
    }
  }
  
  // Check 2: Prevent direct path from start to end using a horizontal bar region
  // Create a thin horizontal bar (parallel to x-axis) centered between start and end positions on y-axis
  const barHeight = 0.001; // Thinner bar height (vertical extent) - reduced from 0.01
  
  // Find the x-range between start and end
  const minX = Math.min(startPos.x - icon_radius, endPos.x - icon_radius);
  const maxX = Math.max(startPos.x, endPos.x + icon_radius);
  
  // Center of the bar is exactly in the middle of start and end on y-axis
  const centerY = (startPos.y + endPos.y) / 2;
  const barTop = centerY - barHeight / 2;
  const barBottom = centerY + barHeight / 2;
  
  // Check if cursor is within the horizontal bar region
  if (x >= minX && x <= maxX && y >= barTop && y <= barBottom) {
    // Cursor is in the forbidden horizontal bar - calculate closest boundary point
    let closestX = x;
    let closestY = y;
    let minDist = Infinity;
    
    // Check distance to each edge of the bar
    const distToTop = Math.abs(y - barTop);
    const distToBottom = Math.abs(y - barBottom);
    const distToLeft = Math.abs(x - minX);
    const distToRight = Math.abs(x - maxX);
    
    if (distToTop < minDist) {
      minDist = distToTop;
      closestY = barTop;
    }
    if (distToBottom < minDist) {
      minDist = distToBottom;
      closestY = barBottom;
    }
    if (distToLeft < minDist) {
      minDist = distToLeft;
      closestX = minX;
      closestY = y;
    }
    if (distToRight < minDist) {
      minDist = distToRight;
      closestX = maxX;
      closestY = y;
    }
    
    // Calculate distance from cursor to boundary
    const distanceOutside = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
    
    return {
      isExcursion: true,
      boundaryPoint: { x: closestX, y: closestY },
      distanceOutside: distanceOutside
    };
  }
  
  return { isExcursion: false };
};

/**
 * Check if cursor is outside the cascading menu windows.
 * Cursor must stay within either the main menu window or the submenu window (when visible).
 * @param {number} x - Cursor x position
 * @param {number} y - Cursor y position
 * @param {Object} menuConfig - Menu configuration with window sizes and positions
 * @param {boolean} shouldShowSubmenu - Whether submenu is currently visible
 * @returns {Object} Object with isExcursion boolean indicating if cursor is outside windows
 */
export const checkCascadingMenuExcursion = (x, y, menuConfig, shouldShowSubmenu) => {
  if (!menuConfig) {
    return { isExcursion: false };
  }

  const {
    mainMenuSize,
    targetMainMenuIndex,
    mainMenuWindowSize = [0.08, 0.15],
    subMenuWindowSize = [0.08, 0.12],
    mainMenuOrigin = [0.1, 0.1]
  } = menuConfig;

  const [mainMenuX, mainMenuY] = mainMenuOrigin;
  const [mainMenuWidth, mainMenuHeight] = mainMenuWindowSize;
  const [subMenuWidth, subMenuHeight] = subMenuWindowSize;

  // Calculate item dimensions from window size
  const mainMenuItemHeight = mainMenuHeight / mainMenuSize;

  // Main menu window bounds
  const mainMenuLeft = mainMenuX;
  const mainMenuTop = mainMenuY;
  const mainMenuRight = mainMenuLeft + mainMenuWidth;
  const mainMenuBottom = mainMenuTop + mainMenuHeight;

  // Check if cursor is within main menu window
  const isInMainMenu = x >= mainMenuLeft && x <= mainMenuRight &&
                       y >= mainMenuTop && y <= mainMenuBottom;

  // If cursor is in main menu, no excursion
  if (isInMainMenu) {
    return { isExcursion: false };
  }

  // If submenu is visible, check if cursor is within submenu window
  if (shouldShowSubmenu) {
    const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
    const subMenuLeft = mainMenuRight; // Adjacent to main menu
    const subMenuTop = targetItemTop; // Aligned with target item
    const subMenuRight = subMenuLeft + subMenuWidth;
    const subMenuBottom = subMenuTop + subMenuHeight;

    const isInSubMenu = x >= subMenuLeft && x <= subMenuRight &&
                        y >= subMenuTop && y <= subMenuBottom;

    if (isInSubMenu) {
      return { isExcursion: false };
    }
  }

  // Cursor is outside both windows - this is an excursion
  // Calculate the closest point on the window boundary
  let closestX, closestY;
  
  if (shouldShowSubmenu) {
    const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
    const subMenuLeft = mainMenuRight;
    const subMenuTop = targetItemTop;
    const subMenuRight = subMenuLeft + subMenuWidth;
    const subMenuBottom = subMenuTop + subMenuHeight;

    // Find closest point on either main menu or submenu boundary
    // Calculate distance to main menu boundaries
    let mainDistX = Math.min(Math.abs(x - mainMenuLeft), Math.abs(x - mainMenuRight));
    let mainDistY = Math.min(Math.abs(y - mainMenuTop), Math.abs(y - mainMenuBottom));
    let mainDist = Math.min(mainDistX, mainDistY);
    
    // Calculate distance to submenu boundaries
    let subDistX = Math.min(Math.abs(x - subMenuLeft), Math.abs(x - subMenuRight));
    let subDistY = Math.min(Math.abs(y - subMenuTop), Math.abs(y - subMenuBottom));
    let subDist = Math.min(subDistX, subDistY);

    if (mainDist < subDist) {
      // Closer to main menu
      if (x < mainMenuLeft) closestX = mainMenuLeft;
      else if (x > mainMenuRight) closestX = mainMenuRight;
      else closestX = x;
      
      if (y < mainMenuTop) closestY = mainMenuTop;
      else if (y > mainMenuBottom) closestY = mainMenuBottom;
      else closestY = y;
    } else {
      // Closer to submenu
      if (x < subMenuLeft) closestX = subMenuLeft;
      else if (x > subMenuRight) closestX = subMenuRight;
      else closestX = x;
      
      if (y < subMenuTop) closestY = subMenuTop;
      else if (y > subMenuBottom) closestY = subMenuBottom;
      else closestY = y;
    }
  } else {
    // Only main menu exists
    if (x < mainMenuLeft) closestX = mainMenuLeft;
    else if (x > mainMenuRight) closestX = mainMenuRight;
    else closestX = x;
    
    if (y < mainMenuTop) closestY = mainMenuTop;
    else if (y > mainMenuBottom) closestY = mainMenuBottom;
    else closestY = y;
  }

  const distanceOutside = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);

  return {
    isExcursion: true,
    boundaryPoint: { x: closestX, y: closestY },
    distanceOutside: distanceOutside
  };
};
