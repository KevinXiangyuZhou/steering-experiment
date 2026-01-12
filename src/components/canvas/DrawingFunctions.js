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

export const drawStartButton = (ctx, startButtonPos, scale) => {
  const x = startButtonPos.x * scale;
  const y = startButtonPos.y * scale;
  const radius = START_BUTTON_RADIUS * scale;
  
  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.strokeStyle = '#009900';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
};

export const drawTarget = (ctx, targetPos, scale) => {
  const x = targetPos.x * scale;
  const y = targetPos.y * scale;
  const radius = TARGET_RADIUS * scale;
  
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.strokeStyle = '#990000';
  ctx.lineWidth = 2;
  ctx.stroke();
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
  scale
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Draw tunnel
  if (tunnelPath.length > 0) {
    drawTunnel(ctx, tunnelPath, tunnelType, tunnelWidth, segmentWidths, scale);
  }
  
  // Draw excursion markers (in phases where boundaries are marked)
  if (shouldMarkBoundaries && excursionMarkers.length > 0) {
    drawExcursionMarkers(ctx, excursionMarkers, scale);
  }
  
  // Draw cursor
  drawCursor(ctx, cursorPos, scale);
  
  // Draw start button
  if (trialState === 'waiting_for_start') {
    drawStartButton(ctx, startButtonPos, scale);
  }
  
  // Draw target
  drawTarget(ctx, targetPos, scale);
};

