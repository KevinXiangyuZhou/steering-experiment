import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  SCALE, 
  START_BUTTON_RADIUS, 
  TARGET_RADIUS 
} from '../../constants/experimentConstants.js';

export const drawTunnel = (ctx, tunnelPath, tunnelType, tunnelWidth, segmentWidths) => {
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  
  if (tunnelType === 'sequential') {
    // Draw sequential tunnel segments with different widths (2 segments)
    const segmentLength = tunnelPath.length / 2;
    
    for (let segment = 0; segment < 2; segment++) {
      const startIndex = Math.floor(segment * segmentLength);
      const endIndex = Math.floor((segment + 1) * segmentLength);
      const halfWidth = segmentWidths[segment] / 2;
      
      // Draw upper boundary
      ctx.beginPath();
      for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
        const point = tunnelPath[i];
        const x = point.x * SCALE;
        const upperY = (point.y - halfWidth) * SCALE;
        if (i === startIndex) ctx.moveTo(x, upperY);
        else ctx.lineTo(x, upperY);
      }
      ctx.stroke();
      
      // Draw lower boundary
      ctx.beginPath();
      for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
        const point = tunnelPath[i];
        const x = point.x * SCALE;
        const lowerY = (point.y + halfWidth) * SCALE;
        if (i === startIndex) ctx.moveTo(x, lowerY);
        else ctx.lineTo(x, lowerY);
      }
      ctx.stroke();
    }
    
    // Draw vertical connecting line between the 2 segments
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    
    const transitionIndex = Math.floor(segmentLength);
    if (transitionIndex < tunnelPath.length) {
      const transitionPoint = tunnelPath[transitionIndex];
      const x = transitionPoint.x * SCALE;
      const prevHalfWidth = segmentWidths[0] / 2;
      const currHalfWidth = segmentWidths[1] / 2;
      
      // Draw vertical line connecting upper boundaries
      ctx.beginPath();
      ctx.moveTo(x, (transitionPoint.y - prevHalfWidth) * SCALE);
      ctx.lineTo(x, (transitionPoint.y - currHalfWidth) * SCALE);
      ctx.stroke();
      
      // Draw vertical line connecting lower boundaries
      ctx.beginPath();
      ctx.moveTo(x, (transitionPoint.y + prevHalfWidth) * SCALE);
      ctx.lineTo(x, (transitionPoint.y + currHalfWidth) * SCALE);
      ctx.stroke();
    }
  } else {
    // Draw curved tunnel with uniform width
    const halfWidth = tunnelWidth / 2;
    
    ctx.beginPath();
    tunnelPath.forEach((point, i) => {
      const x = point.x * SCALE;
      const upperY = (point.y - halfWidth) * SCALE;
      if (i === 0) ctx.moveTo(x, upperY);
      else ctx.lineTo(x, upperY);
    });
    ctx.stroke();
    
    ctx.beginPath();
    tunnelPath.forEach((point, i) => {
      const x = point.x * SCALE;
      const lowerY = (point.y + halfWidth) * SCALE;
      if (i === 0) ctx.moveTo(x, lowerY);
      else ctx.lineTo(x, lowerY);
    });
    ctx.stroke();
  }
};

export const drawExcursionMarkers = (ctx, excursionMarkers) => {
  excursionMarkers.forEach(marker => {
    ctx.fillStyle = '#FF6B6B';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    
    // Draw a small X mark at the excursion boundary point
    const x = marker.x * SCALE;
    const y = marker.y * SCALE;
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

export const drawCursor = (ctx, cursorPos) => {
  ctx.fillStyle = '#0000FF';
  ctx.beginPath();
  ctx.arc(cursorPos.x * SCALE, cursorPos.y * SCALE, 3, 0, 2 * Math.PI);
  ctx.fill();
};

export const drawStartButton = (ctx, startButtonPos) => {
  const x = startButtonPos.x * SCALE;
  const y = startButtonPos.y * SCALE;
  const radius = START_BUTTON_RADIUS * SCALE;
  
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

export const drawTarget = (ctx, targetPos) => {
  const x = targetPos.x * SCALE;
  const y = targetPos.y * SCALE;
  const radius = TARGET_RADIUS * SCALE;
  
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
  targetPos
) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw tunnel
  if (tunnelPath.length > 0) {
    drawTunnel(ctx, tunnelPath, tunnelType, tunnelWidth, segmentWidths);
  }
  
  // Draw excursion markers (in phases where boundaries are marked)
  if (shouldMarkBoundaries && excursionMarkers.length > 0) {
    drawExcursionMarkers(ctx, excursionMarkers);
  }
  
  // Draw cursor
  drawCursor(ctx, cursorPos);
  
  // Draw start button
  if (trialState === 'waiting_for_start') {
    drawStartButton(ctx, startButtonPos);
  }
  
  // Draw target
  drawTarget(ctx, targetPos);
};

