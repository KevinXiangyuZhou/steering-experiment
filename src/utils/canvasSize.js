// Convert cm to pixels based on screen DPI
// Standard DPI is 96, but we'll detect actual DPI
export const cmToPixels = (cm, dpi = 96) => {
  // 1 inch = 2.54 cm
  // pixels = (cm / 2.54) * dpi
  return (cm / 2.54) * dpi;
};

// Get screen DPI
export const getScreenDPI = () => {
  // Try to get actual DPI from devicePixelRatio
  // devicePixelRatio * 96 gives approximate DPI
  const dpi = window.devicePixelRatio * 96;
  return dpi;
};

// Calculate canvas dimensions
export const calculateCanvasDimensions = () => {
  const targetWidthCm = 46; // 46cm
  const targetHeightCm = 26; // 26cm
  
  const dpi = getScreenDPI();
  const targetWidthPx = cmToPixels(targetWidthCm, dpi);
  const targetHeightPx = cmToPixels(targetHeightCm, dpi);
  
  // Get available screen space (accounting for padding)
  const padding = 40; // 20px on each side
  const maxWidth = window.innerWidth - padding;
  const maxHeight = window.innerHeight - padding - 200; // Reserve space for UI elements
  
  // If screen is smaller than target, use full available space
  let canvasWidth = targetWidthPx;
  let canvasHeight = targetHeightPx;
  
  if (targetWidthPx > maxWidth || targetHeightPx > maxHeight) {
    // Scale to fit while maintaining aspect ratio
    const widthRatio = maxWidth / targetWidthPx;
    const heightRatio = maxHeight / targetHeightPx;
    const scale = Math.min(widthRatio, heightRatio);
    
    canvasWidth = targetWidthPx * scale;
    canvasHeight = targetHeightPx * scale;
  }
  
  // Ensure minimum size
  canvasWidth = Math.max(canvasWidth, 300);
  canvasHeight = Math.max(canvasHeight, 200);
  
  // Original normalized coordinates: width 0.46, height 0.26
  // Scale converts normalized coordinates to pixels
  const normalizedWidth = 0.46;
  const normalizedHeight = 0.26;
  
  const scale = canvasWidth / normalizedWidth;
  
  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    scale: scale // Scale to convert normalized coords to pixels
  };
};

