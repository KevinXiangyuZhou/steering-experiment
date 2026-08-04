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

// Extra right-side margin so the end target (radius up to 0.5 * tunnelWidth, max 0.025) never
// clips at the canvas edge. Scaling targetWidthCm and normalizedWidth by the same factor keeps
// `scale` (and therefore every existing calibrated cm-scale distance) unchanged — the margin is
// pure blank canvas space added to the right of the original 0.46-unit tunnel/path coordinate space.
const RIGHT_MARGIN_FRACTION = 0.065; // ~0.03 normalized units, comfortably exceeds max target radius (0.025)

// The actual normalized coordinate space of the rendered/interactive canvas (post-widening) —
// this is the real extent the cursor can reach, and is the single source of truth for anything
// that needs to know the canvas's true bounds (excursion checks, "available area" rendering),
// not the original pre-widening 0.46/0.26 tunnel/path coordinate space.
export const NORMALIZED_WIDTH = 0.46 * (1 + RIGHT_MARGIN_FRACTION);
export const NORMALIZED_HEIGHT = 0.26;

// Calculate canvas dimensions
export const calculateCanvasDimensions = () => {
  const targetWidthCm = 46 * (1 + RIGHT_MARGIN_FRACTION); // ~49cm
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
  
  const scale = canvasWidth / NORMALIZED_WIDTH;
  
  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    scale: scale // Scale to convert normalized coords to pixels
  };
};

