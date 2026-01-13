import { 
  START_BUTTON_RADIUS, 
  TARGET_RADIUS 
} from '../../constants/experimentConstants.js';

export const drawTunnel = (ctx, tunnelPath, tunnelType, tunnelWidth, segmentWidths, scale) => {
  // Draw original walls first (gray), then gray rectangles on top, then black outer edges
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  
  if (tunnelType === 'sequential') {
    // Draw sequential tunnel segments with different widths (2 segments)
    const segmentLength = tunnelPath.length / 2;
    
    // Build closed path for filling
    const fillPath = [];
    
    // Build upper boundary path (forward)
    for (let segment = 0; segment < 2; segment++) {
      const startIndex = Math.floor(segment * segmentLength);
      const endIndex = Math.floor((segment + 1) * segmentLength);
      const halfWidth = segmentWidths[segment] / 2;
      
      for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
        const point = tunnelPath[i];
        const x = point.x * scale;
        const upperY = (point.y - halfWidth) * scale;
        fillPath.push({ x, y: upperY });
      }
      
      // Add transition point if not last segment
      if (segment < 1 && endIndex < tunnelPath.length) {
        const transitionPoint = tunnelPath[endIndex];
        const x = transitionPoint.x * scale;
        const currHalfWidth = segmentWidths[segment] / 2;
        const nextHalfWidth = segmentWidths[segment + 1] / 2;
        // Add transition point at upper boundary
        fillPath.push({ x, y: (transitionPoint.y - currHalfWidth) * scale });
        fillPath.push({ x, y: (transitionPoint.y - nextHalfWidth) * scale });
      }
    }
    
    // Build lower boundary path (reverse)
    for (let segment = 1; segment >= 0; segment--) {
      const startIndex = Math.floor(segment * segmentLength);
      const endIndex = Math.floor((segment + 1) * segmentLength);
      const halfWidth = segmentWidths[segment] / 2;
      
      for (let i = endIndex - 1; i >= startIndex && i >= 0; i--) {
        const point = tunnelPath[i];
        const x = point.x * scale;
        const lowerY = (point.y + halfWidth) * scale;
        fillPath.push({ x, y: lowerY });
      }
      
      // Add transition point if not first segment
      if (segment > 0 && startIndex > 0) {
        const transitionPoint = tunnelPath[startIndex];
        const x = transitionPoint.x * scale;
        const prevHalfWidth = segmentWidths[segment - 1] / 2;
        const currHalfWidth = segmentWidths[segment] / 2;
        // Add transition point at lower boundary
        fillPath.push({ x, y: (transitionPoint.y + prevHalfWidth) * scale });
        fillPath.push({ x, y: (transitionPoint.y + currHalfWidth) * scale });
      }
    }
    
    // Draw original walls first (gray)
    for (let segment = 0; segment < 2; segment++) {
      const startIndex = Math.floor(segment * segmentLength);
      const endIndex = Math.floor((segment + 1) * segmentLength);
      const halfWidth = segmentWidths[segment] / 2;
      
      // Draw upper boundary
      ctx.beginPath();
      for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
        const point = tunnelPath[i];
        const x = point.x * scale;
        const upperY = (point.y - halfWidth) * scale;
        if (i === startIndex) ctx.moveTo(x, upperY);
        else ctx.lineTo(x, upperY);
      }
      ctx.stroke();
      
      // Draw lower boundary
      ctx.beginPath();
      for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
        const point = tunnelPath[i];
        const x = point.x * scale;
        const lowerY = (point.y + halfWidth) * scale;
        if (i === startIndex) ctx.moveTo(x, lowerY);
        else ctx.lineTo(x, lowerY);
      }
      ctx.stroke();
    }
    
    // Draw vertical connecting lines between segments
    const transitionIndex = Math.floor(segmentLength);
    if (transitionIndex < tunnelPath.length) {
      const transitionPoint = tunnelPath[transitionIndex];
      const x = transitionPoint.x * scale;
      const prevHalfWidth = segmentWidths[0] / 2;
      const currHalfWidth = segmentWidths[1] / 2;
      
      // Draw vertical line connecting upper boundaries
      ctx.beginPath();
      ctx.moveTo(x, (transitionPoint.y - prevHalfWidth) * scale);
      ctx.lineTo(x, (transitionPoint.y - currHalfWidth) * scale);
      ctx.stroke();
      
      // Draw vertical line connecting lower boundaries
      ctx.beginPath();
      ctx.moveTo(x, (transitionPoint.y + prevHalfWidth) * scale);
      ctx.lineTo(x, (transitionPoint.y + currHalfWidth) * scale);
      ctx.stroke();
    }
    
    // Draw gray rectangles on top (higher layer)
    ctx.fillStyle = '#CCCCCC';
    if (fillPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(fillPath[0].x, fillPath[0].y);
      for (let i = 1; i < fillPath.length; i++) {
        ctx.lineTo(fillPath[i].x, fillPath[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    
  } else if (tunnelType === 'corner') {
    // Draw axis-aligned corridor with hard 90° corners (no chamfers, fillets, or diagonal edges)
    const halfWidth = tunnelWidth / 2;
    
    // Identify segments: each segment is either purely horizontal or purely vertical
    const segments = [];
    let currentSegment = { type: null, start: null, end: null };
    
    for (let i = 0; i < tunnelPath.length; i++) {
      const point = tunnelPath[i];
      let segmentType = null;
      
      if (i < tunnelPath.length - 1) {
        const next = tunnelPath[i + 1];
        const dx = Math.abs(next.x - point.x);
        const dy = Math.abs(next.y - point.y);
        segmentType = dx > dy ? 'horizontal' : 'vertical';
      } else if (i > 0) {
        segmentType = currentSegment.type;
      }
      
      if (segmentType !== currentSegment.type && currentSegment.start !== null) {
        currentSegment.end = tunnelPath[i - 1];
        segments.push(currentSegment);
        currentSegment = { type: segmentType, start: tunnelPath[i - 1], end: null };
      } else if (currentSegment.start === null) {
        currentSegment.start = point;
        currentSegment.type = segmentType;
      }
    }
    if (currentSegment.start !== null) {
      currentSegment.end = tunnelPath[tunnelPath.length - 1];
      segments.push(currentSegment);
    }
    
    // Build closed path for tunnel area (upper boundary + lower boundary reversed)
    const upperBoundaryPath = [];
    const lowerBoundaryPath = [];
    
    // Build upper boundary path
    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      const segment = segments[segIdx];
      const start = segment.start;
      const end = segment.end;
      
      if (segment.type === 'horizontal') {
        const startX = start.x * scale;
        const startY = (start.y - halfWidth) * scale;
        const endX = end.x * scale;
        const endY = (end.y - halfWidth) * scale;
        
        if (segIdx === 0) {
          upperBoundaryPath.push({ x: startX, y: startY });
        }
        upperBoundaryPath.push({ x: endX, y: endY });
        
        if (segIdx < segments.length - 1 && segments[segIdx + 1].type === 'vertical') {
          const cornerPoint = end;
          const nextSegment = segments[segIdx + 1];
          const nextMovingUp = nextSegment.end.y < nextSegment.start.y;
          const nextOffset = nextMovingUp ? -halfWidth : halfWidth;
          const cornerVertexX = (cornerPoint.x + nextOffset) * scale;
          const cornerVertexY = (cornerPoint.y - halfWidth) * scale;
          upperBoundaryPath.push({ x: cornerVertexX, y: cornerVertexY });
        }
      } else {
        const movingUp = end.y < start.y;
        const offset = movingUp ? -halfWidth : halfWidth;
        const endX = (end.x + offset) * scale;
        const endY = (end.y - halfWidth) * scale;
        upperBoundaryPath.push({ x: endX, y: endY });
        
        if (segIdx < segments.length - 1 && segments[segIdx + 1].type === 'horizontal') {
          const cornerPoint = end;
          const nextX = cornerPoint.x * scale;
          const nextY = (cornerPoint.y - halfWidth) * scale;
          upperBoundaryPath.push({ x: nextX, y: nextY });
        }
      }
    }
    
    // Build lower boundary path (reversed)
    for (let segIdx = segments.length - 1; segIdx >= 0; segIdx--) {
      const segment = segments[segIdx];
      const start = segment.start;
      const end = segment.end;
      
      if (segment.type === 'horizontal') {
        const startX = start.x * scale;
        const startY = (start.y + halfWidth) * scale;
        const endX = end.x * scale;
        const endY = (end.y + halfWidth) * scale;
        
        if (segIdx === segments.length - 1) {
          lowerBoundaryPath.push({ x: endX, y: endY });
        }
        lowerBoundaryPath.push({ x: startX, y: startY });
        
        if (segIdx > 0 && segments[segIdx - 1].type === 'vertical') {
          const cornerPoint = start;
          const prevSegment = segments[segIdx - 1];
          const prevMovingUp = prevSegment.end.y < prevSegment.start.y;
          const prevOffset = prevMovingUp ? halfWidth : -halfWidth;
          const cornerVertexX = (cornerPoint.x + prevOffset) * scale;
          const cornerVertexY = (cornerPoint.y + halfWidth) * scale;
          lowerBoundaryPath.push({ x: cornerVertexX, y: cornerVertexY });
        }
      } else {
        const movingUp = end.y < start.y;
        const offset = movingUp ? halfWidth : -halfWidth;
        const startX = (start.x + offset) * scale;
        const startY = (start.y + halfWidth) * scale;
        lowerBoundaryPath.push({ x: startX, y: startY });
        
        if (segIdx > 0 && segments[segIdx - 1].type === 'horizontal') {
          const cornerPoint = start;
          const cornerVertexX = cornerPoint.x * scale;
          const cornerVertexY = (cornerPoint.y + halfWidth) * scale;
          lowerBoundaryPath.push({ x: cornerVertexX, y: cornerVertexY });
        }
      }
    }
    
    // Draw original walls first (gray)
    // Build wall paths for drawing
    const upperWallPath = [];
    const lowerWallPath = [];
    
    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      const segment = segments[segIdx];
      const start = segment.start;
      const end = segment.end;
      
      if (segment.type === 'horizontal') {
        const startX = start.x * scale;
        const startY = (start.y - halfWidth) * scale;
        const endX = end.x * scale;
        const endY = (end.y - halfWidth) * scale;
        if (segIdx === 0) upperWallPath.push({ x: startX, y: startY });
        upperWallPath.push({ x: endX, y: endY });
        
        const startXLower = start.x * scale;
        const startYLower = (start.y + halfWidth) * scale;
        const endXLower = end.x * scale;
        const endYLower = (end.y + halfWidth) * scale;
        if (segIdx === 0) lowerWallPath.push({ x: endXLower, y: endYLower });
        lowerWallPath.push({ x: startXLower, y: startYLower });
        
        if (segIdx < segments.length - 1 && segments[segIdx + 1].type === 'vertical') {
          const cornerPoint = end;
          const nextSegment = segments[segIdx + 1];
          const nextMovingUp = nextSegment.end.y < nextSegment.start.y;
          const nextOffset = nextMovingUp ? -halfWidth : halfWidth;
          const cornerVertexX = (cornerPoint.x + nextOffset) * scale;
          const cornerVertexY = (cornerPoint.y - halfWidth) * scale;
          upperWallPath.push({ x: cornerVertexX, y: cornerVertexY });
          
          const cornerVertexXLower = (cornerPoint.x + nextOffset) * scale;
          const cornerVertexYLower = (cornerPoint.y + halfWidth) * scale;
          lowerWallPath.push({ x: cornerVertexXLower, y: cornerVertexYLower });
        }
      } else {
        const movingUp = end.y < start.y;
        const offset = movingUp ? -halfWidth : halfWidth;
        const endX = (end.x + offset) * scale;
        const endY = (end.y - halfWidth) * scale;
        upperWallPath.push({ x: endX, y: endY });
        
        const offsetLower = movingUp ? halfWidth : -halfWidth;
        const startXLower = (start.x + offsetLower) * scale;
        const startYLower = (start.y + halfWidth) * scale;
        lowerWallPath.push({ x: startXLower, y: startYLower });
        
        if (segIdx < segments.length - 1 && segments[segIdx + 1].type === 'horizontal') {
          const cornerPoint = end;
          const nextX = cornerPoint.x * scale;
          const nextY = (cornerPoint.y - halfWidth) * scale;
          upperWallPath.push({ x: nextX, y: nextY });
          
          const nextXLower = cornerPoint.x * scale;
          const nextYLower = (cornerPoint.y + halfWidth) * scale;
          lowerWallPath.push({ x: nextXLower, y: nextYLower });
        }
      }
    }
    
    // Draw original walls (gray)
    ctx.beginPath();
    if (upperWallPath.length > 0) {
      ctx.moveTo(upperWallPath[0].x, upperWallPath[0].y);
      for (let i = 1; i < upperWallPath.length; i++) {
        ctx.lineTo(upperWallPath[i].x, upperWallPath[i].y);
      }
    }
    ctx.stroke();
    
    ctx.beginPath();
    if (lowerWallPath.length > 0) {
      ctx.moveTo(lowerWallPath[0].x, lowerWallPath[0].y);
      for (let i = 1; i < lowerWallPath.length; i++) {
        ctx.lineTo(lowerWallPath[i].x, lowerWallPath[i].y);
      }
    }
    ctx.stroke();
    
    // Draw gray rectangles on top (higher layer)
    ctx.fillStyle = '#CCCCCC';
    ctx.beginPath();
    if (upperBoundaryPath.length > 0) {
      ctx.moveTo(upperBoundaryPath[0].x, upperBoundaryPath[0].y);
      for (let i = 1; i < upperBoundaryPath.length; i++) {
        ctx.lineTo(upperBoundaryPath[i].x, upperBoundaryPath[i].y);
      }
      for (let i = 0; i < lowerBoundaryPath.length; i++) {
        ctx.lineTo(lowerBoundaryPath[i].x, lowerBoundaryPath[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    
  } else {
    // Draw curved tunnel with uniform width (perpendicular to path)
    const halfWidth = tunnelWidth / 2;
    
    // Compute boundaries with equal width perpendicular to the path
    const upperBoundary = [];
    const lowerBoundary = [];
    
    for (let i = 0; i < tunnelPath.length; i++) {
      const point = tunnelPath[i];
      let tangentX, tangentY;
      
      // Compute tangent using central differences
      if (i === 0) {
        // First point: use forward difference
        const next = tunnelPath[i + 1];
        tangentX = next.x - point.x;
        tangentY = next.y - point.y;
      } else if (i === tunnelPath.length - 1) {
        // Last point: use backward difference
        const prev = tunnelPath[i - 1];
        tangentX = point.x - prev.x;
        tangentY = point.y - prev.y;
      } else {
        // Middle points: use central difference
        const prev = tunnelPath[i - 1];
        const next = tunnelPath[i + 1];
        tangentX = next.x - prev.x;
        tangentY = next.y - prev.y;
      }
      
      // Normalize tangent
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      if (tangentLength > 0) {
        tangentX /= tangentLength;
        tangentY /= tangentLength;
      }
      
      // Compute normal (perpendicular to tangent, pointing "up" relative to path direction)
      // Rotate tangent 90 degrees counterclockwise: (x, y) -> (-y, x)
      const normalX = -tangentY;
      const normalY = tangentX;
      
      // Offset centerline by halfWidth along normal
      upperBoundary.push({
        x: point.x + normalX * halfWidth,
        y: point.y + normalY * halfWidth
      });
      lowerBoundary.push({
        x: point.x - normalX * halfWidth,
        y: point.y - normalY * halfWidth
      });
    }
    
    // Draw original walls first (gray)
    ctx.beginPath();
    upperBoundary.forEach((point, i) => {
      const x = point.x * scale;
      const y = point.y * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.beginPath();
    lowerBoundary.forEach((point, i) => {
      const x = point.x * scale;
      const y = point.y * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw gray rectangles on top (higher layer)
    ctx.fillStyle = '#CCCCCC';
    ctx.beginPath();
    upperBoundary.forEach((point, i) => {
      const x = point.x * scale;
      const y = point.y * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    // Add lower boundary in reverse to close the path
    for (let i = lowerBoundary.length - 1; i >= 0; i--) {
      const point = lowerBoundary[i];
      const x = point.x * scale;
      const y = point.y * scale;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
  }
};

export const drawExcursionMarkers = (ctx, excursionMarkers, scale) => {
  excursionMarkers.forEach(marker => {
    ctx.fillStyle = '#FF6B6B';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    
    // Draw a small X mark at the excursion boundary point
    const x = marker.x * scale;
    const y = marker.y * scale;
    const size = 4;
    
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x - size, y + size);
    ctx.lineTo(x + size, y - size);
    ctx.stroke();
    
    // Draw a small circle around the X
    ctx.beginPath();
    ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
    ctx.stroke();
  });
};

export const drawCursor = (ctx, cursorPos, scale) => {
  ctx.fillStyle = '#0000FF';
  ctx.beginPath();
  ctx.arc(cursorPos.x * scale, cursorPos.y * scale, 3, 0, 2 * Math.PI);
  ctx.fill();
};

export const drawStartButton = (ctx, startButtonPos, scale, customRadius = null) => {
  const x = startButtonPos.x * scale;
  const y = startButtonPos.y * scale;
  const radius = (customRadius !== null ? customRadius : START_BUTTON_RADIUS) * scale;
  
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.strokeStyle = '#009900';
  ctx.lineWidth = Math.max(1, radius / 3); // Scale line width with radius
  ctx.stroke();
  
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
};

export const drawTarget = (ctx, targetPos, scale, customRadius = null) => {
  const x = targetPos.x * scale;
  const y = targetPos.y * scale;
  const radius = (customRadius !== null ? customRadius : TARGET_RADIUS) * scale;
  
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.strokeStyle = '#990000';
  ctx.lineWidth = Math.max(1, radius / 5); // Scale line width with radius
  ctx.stroke();
};

/**
 * Draw cascading menu with main menu and submenu (macOS style)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} menuConfig - Configuration object with:
 *   - mainMenuSize: Number of items in main menu
 *   - subMenuSize: Number of items in submenu
 *   - targetMainMenuIndex: Index of target item in main menu (0-indexed)
 *   - targetSubMenuIndex: Index of target item in submenu (0-indexed)
 *   - menuItemSize: Size of each menu item (radius)
 *   - menuItemSpacing: Spacing between menu items
 *   - mainMenuOrigin: [x, y] origin of main menu (top-left)
 *   - subMenuOffset: [x, y] offset of submenu relative to main menu item
 * @param {Object} cursorPos - Current cursor position {x, y}
 * @param {number} scale - Scale factor for rendering
 */
export const drawCascadingMenu = (ctx, menuConfig, cursorPos, scale, menuHasHoveredRef = null) => {
  if (!menuConfig) return;

  const {
    mainMenuSize,
    subMenuSize,
    targetMainMenuIndex,
    targetSubMenuIndex,
    mainMenuWindowSize = [0.08, 0.15],
    subMenuWindowSize = [0.08, 0.12],
    mainMenuOrigin = [0.1, 0.1]
  } = menuConfig;

  const [mainMenuX, mainMenuY] = mainMenuOrigin;
  const [mainMenuWidth, mainMenuHeight] = mainMenuWindowSize;
  const [subMenuWidth, subMenuHeight] = subMenuWindowSize;

  // Calculate item dimensions from window size (no gaps between items)
  const mainMenuItemHeight = mainMenuHeight / mainMenuSize; // Each item takes equal height
  const subMenuItemHeight = subMenuHeight / subMenuSize; // Each item takes equal height

  // Calculate main menu bounds (rectangular window)
  const mainMenuLeft = mainMenuX;
  const mainMenuTop = mainMenuY;
  const mainMenuRight = mainMenuLeft + mainMenuWidth;
  const mainMenuBottom = mainMenuTop + mainMenuHeight;

  // Calculate target main menu item position and bounds (no gaps, items fill window)
  const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
  const targetItemBottom = targetItemTop + mainMenuItemHeight;
  const targetItemLeft = mainMenuLeft;
  const targetItemRight = mainMenuRight;
  const targetMainMenuY = targetItemTop + mainMenuItemHeight / 2; // Center of target item

  // Check if cursor is hovering over target main menu item (within rectangular bounds)
  const isHoveringTarget = cursorPos.x >= targetItemLeft && cursorPos.x <= targetItemRight &&
                           cursorPos.y >= targetItemTop && cursorPos.y <= targetItemBottom;
  
  // Track if we've ever hovered over target (to keep submenu visible)
  if (menuHasHoveredRef) {
    if (isHoveringTarget) {
      menuHasHoveredRef.current = true;
    }
  }
  const shouldShowSubmenu = menuHasHoveredRef ? menuHasHoveredRef.current : isHoveringTarget;

  // Draw main menu background (rectangular window - always visible)
  ctx.save();
  
  // Draw shadow (subtle)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(
    (mainMenuLeft + 3) * scale,
    (mainMenuTop + 3) * scale,
    mainMenuWidth * scale,
    mainMenuHeight * scale
  );
  
  // Draw menu background (rectangular, no rounded corners)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(mainMenuLeft * scale, mainMenuTop * scale, mainMenuWidth * scale, mainMenuHeight * scale);
  
  // Draw border (all four sides)
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 1;
  ctx.strokeRect(mainMenuLeft * scale, mainMenuTop * scale, mainMenuWidth * scale, mainMenuHeight * scale);

  // Draw main menu items (no gaps, items fill window)
  for (let i = 0; i < mainMenuSize; i++) {
    const itemTop = mainMenuTop + i * mainMenuItemHeight;
    const itemBottom = itemTop + mainMenuItemHeight;
    const itemLeft = mainMenuLeft;
    const itemRight = mainMenuRight;
    const itemY = itemTop + mainMenuItemHeight / 2; // Center of item

    // Determine if this is the target item
    const isTarget = i === targetMainMenuIndex;
    
    // Check if cursor is hovering over this item
    const isHovering = cursorPos.x >= itemLeft && cursorPos.x <= itemRight &&
                       cursorPos.y >= itemTop && cursorPos.y <= itemBottom;

    // Draw menu item background (light red for selected, light grey for hover)
    if (isTarget || isHovering) {
      if (isTarget) {
        // Light red for target item
        ctx.fillStyle = '#FF6B6B'; // Light red
      } else {
        // Light grey for hover
        ctx.fillStyle = '#E5E5E5';
      }
      ctx.fillRect(itemLeft * scale, itemTop * scale, (itemRight - itemLeft) * scale, (itemBottom - itemTop) * scale);
    }

    // Draw menu item text label
    const textPadding = mainMenuWidth * 0.1;
    const textX = itemLeft + textPadding;
    
    ctx.fillStyle = (isTarget || isHovering) ? '#FFFFFF' : '#000000'; // White text on red, black otherwise
    ctx.font = `bold ${8 * scale / 1000}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Item ${i + 1}`, textX * scale, itemY * scale);

    // Draw arrow indicator if this is the target item (indicating submenu)
    if (isTarget) {
      ctx.fillStyle = (isTarget || isHovering) ? '#FFFFFF' : '#666666';
      ctx.beginPath();
      const arrowX = itemRight - textPadding;
      const arrowSize = 5;
      ctx.moveTo(arrowX * scale, (itemY - arrowSize) * scale);
      ctx.lineTo((arrowX + arrowSize) * scale, itemY * scale);
      ctx.lineTo(arrowX * scale, (itemY + arrowSize) * scale);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw submenu if we've hovered over target main menu item (persistent)
  if (shouldShowSubmenu) {
    // Position submenu directly adjacent to main menu (no gap - start exactly at right edge)
    const subMenuLeft = mainMenuRight; // Start exactly at main menu right edge (no gap)
    // Align submenu so first item aligns with target main menu item
    const subMenuTop = targetItemTop; // Align top with target item
    const subMenuRight = subMenuLeft + subMenuWidth;
    const subMenuBottom = subMenuTop + subMenuHeight;

    // Draw submenu shadow (subtle, adjacent to main menu)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(
      (subMenuLeft + 3) * scale,
      (subMenuTop + 3) * scale,
      subMenuWidth * scale,
      subMenuHeight * scale
    );

    // Draw submenu background (rectangular, no rounded corners)
    // Start exactly at mainMenuRight with no gap
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(subMenuLeft * scale, subMenuTop * scale, subMenuWidth * scale, subMenuHeight * scale);
    
    // Draw border (all sides - submenu border will be drawn, main menu right border is already drawn)
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 1;
    ctx.strokeRect(subMenuLeft * scale, subMenuTop * scale, subMenuWidth * scale, subMenuHeight * scale);
    
    // Redraw main menu right border on top to ensure it's visible (covers submenu left border where they meet)
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mainMenuRight * scale, mainMenuTop * scale);
    ctx.lineTo(mainMenuRight * scale, mainMenuBottom * scale);
    ctx.stroke();

    // Draw submenu items (no gaps, items fill window)
    for (let i = 0; i < subMenuSize; i++) {
      const itemTop = subMenuTop + i * subMenuItemHeight;
      const itemBottom = itemTop + subMenuItemHeight;
      const itemLeft = subMenuLeft;
      const itemRight = subMenuRight;
      const itemY = itemTop + subMenuItemHeight / 2; // Center of item

      // Determine if this is the target item
      const isTarget = i === targetSubMenuIndex;
      
      // Check if cursor is hovering over this item
      const isHovering = cursorPos.x >= itemLeft && cursorPos.x <= itemRight &&
                         cursorPos.y >= itemTop && cursorPos.y <= itemBottom;

      // Draw menu item background (light red for selected, light grey for hover)
      if (isTarget || isHovering) {
        if (isTarget) {
          // Light red for target item
          ctx.fillStyle = '#FF6B6B'; // Light red
        } else {
          // Light grey for hover
          ctx.fillStyle = '#E5E5E5';
        }
        ctx.fillRect(itemLeft * scale, itemTop * scale, (itemRight - itemLeft) * scale, (itemBottom - itemTop) * scale);
      }

      // Draw menu item text label
      const textPadding = subMenuWidth * 0.1;
      const textX = itemLeft + textPadding;
      
      ctx.fillStyle = (isTarget || isHovering) ? '#FFFFFF' : '#000000'; // White text on red, black otherwise
      ctx.font = `bold ${8 * scale / 1000}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Sub ${i + 1}`, textX * scale, itemY * scale);
    }
  }

  ctx.restore();
};

/**
 * Draw lasso selection grid with target squares
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} lassoConfig - Configuration object with:
 *   - grid_layout: Array of strings defining the grid
 *   - icon_radius: Half the size of each square (full size = icon_radius * 2)
 *   - icon_spacing: Distance between icon centers
 *   - grid_origin: [x, y] origin of grid (top-left corner)
 * @param {number} scale - Scale factor for rendering
 */
export const drawLassoGrid = (ctx, lassoConfig, scale) => {
  if (!lassoConfig) return;
  
  const { grid_layout, icon_radius, icon_spacing, grid_origin } = lassoConfig;
  const [originX, originY] = grid_origin;
  
  // Draw grid squares
  for (let row = 0; row < grid_layout.length; row++) {
    const cells = grid_layout[row].split(/\s+/).filter(c => c.length > 0);
    for (let col = 0; col < cells.length; col++) {
      const cellType = cells[col];
      const x = originX + col * icon_spacing;
      const y = originY + row * icon_spacing;
      
      const screenX = x * scale;
      const screenY = y * scale;
      const size = icon_radius * 2 * scale;
      
      if (cellType === 'X') {
        // Draw target square (yellow)
        ctx.fillStyle = '#FFD700'; // Yellow
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
        ctx.strokeStyle = '#CCAA00';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
      } else if (cellType === '.' || cellType === ' ') {
        // Draw empty/distractor cell (light grey)
        ctx.fillStyle = '#E0E0E0'; // Light grey
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);
      }
      // 'O' cells are invisible, so we don't draw them
    }
  }
};

export const drawCanvas = (
  ctx,
  tunnelPath,
  tunnelType,
  tunnelWidth,
  segmentWidths,
  excursionMarkers,
  shouldMarkBoundaries,
  cursorPos,
  trialState,
  startButtonPos,
  targetPos,
  canvasWidth,
  canvasHeight,
  scale,
  lassoConfig = null,
  menuConfig = null,
  menuHasHoveredRef = null
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw tunnel first (skip for lasso and cascading menu trials)
  // Draw tunnel BEFORE menu/grid/buttons so they appear on top
  if (tunnelPath.length > 0 && tunnelType !== 'lasso' && tunnelType !== 'cascading_menu') {
    drawTunnel(ctx, tunnelPath, tunnelType, tunnelWidth, segmentWidths, scale);
  }
  
  // Draw lasso grid (if lasso tunnel type)
  if (tunnelType === 'lasso' && lassoConfig) {
    drawLassoGrid(ctx, lassoConfig, scale);
  }
  
  // Draw cascading menu (if cascading menu tunnel type)
  // Draw menu without tunnel path - menu is the main visual element
  if (tunnelType === 'cascading_menu' && menuConfig) {
    drawCascadingMenu(ctx, menuConfig, cursorPos, scale, menuHasHoveredRef);
  }
  
  // Draw excursion markers
  // For lasso trials: show markers when hitting gray icons
  // For other trials: show markers when hitting tunnel boundaries
  if (excursionMarkers.length > 0 && (tunnelType === 'lasso' || shouldMarkBoundaries)) {
    drawExcursionMarkers(ctx, excursionMarkers, scale);
  }
  
  // Draw start button and target AFTER tunnel so they appear on top
  if (tunnelType === 'lasso' && lassoConfig) {
    // Use much smaller icons for lasso trials (0.003 radius = 6mm diameter vs 20-30mm grid squares)
    const lassoIconRadius = 0.003;
    
    // Draw start button
    if (trialState === 'waiting_for_start') {
      drawStartButton(ctx, startButtonPos, scale, lassoIconRadius);
    }
    
    // Draw target
    drawTarget(ctx, targetPos, scale, lassoIconRadius);
  } else if (tunnelType === 'cascading_menu') {
    // For cascading menu trials, only draw start button
    // Target is the red menu item, which is already drawn in the menu
    if (trialState === 'waiting_for_start') {
      drawStartButton(ctx, startButtonPos, scale);
    }
    // Don't draw target circle - target is the red menu item
  } else {
    // Draw start button (normal size for non-lasso, non-menu trials)
    if (trialState === 'waiting_for_start') {
      drawStartButton(ctx, startButtonPos, scale);
    }
    
    // Draw target (normal size for non-lasso, non-menu trials)
    drawTarget(ctx, targetPos, scale);
  }
  
  // Draw cursor last so it appears on top of everything
  drawCursor(ctx, cursorPos, scale);
};

