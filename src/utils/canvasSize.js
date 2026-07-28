export const cmToPixels = (cm, dpi = 96) => (cm / 2.54) * dpi;

export const getScreenDPI = () => window.devicePixelRatio * 96;

export const calculateCanvasDimensions = () => {
  // Width grown from 46cm to 50cm. The tunnel coordinate system itself still
  // spans 0–0.46 normalized units (unchanged), so the extra 0.04 units of
  // canvas width give the end target room to render fully instead of having
  // its center sit exactly on the canvas edge.
  const targetWidthCm = 50;
  const targetHeightCm = 26; // unchanged — the clipping issue was horizontal

  const dpi = getScreenDPI();
  const targetWidthPx = cmToPixels(targetWidthCm, dpi);
  const targetHeightPx = cmToPixels(targetHeightCm, dpi);

  const padding = 40; // 20px each side
  const maxWidth = window.innerWidth - padding;
  const maxHeight = window.innerHeight - padding - 200; // reserve space for UI elements

  let canvasWidth = targetWidthPx;
  let canvasHeight = targetHeightPx;

  if (targetWidthPx > maxWidth || targetHeightPx > maxHeight) {
    const widthRatio = maxWidth / targetWidthPx;
    const heightRatio = maxHeight / targetHeightPx;
    const scale = Math.min(widthRatio, heightRatio);

    canvasWidth = targetWidthPx * scale;
    canvasHeight = targetHeightPx * scale;
  }

  canvasWidth = Math.max(canvasWidth, 300);
  canvasHeight = Math.max(canvasHeight, 200);

  // Normalized coordinate space: width grown to 0.50 to match the extra
  // physical margin; height stays 0.26, matching the tunnel generator's
  // existing y-range so nothing downstream needs to change.
  const normalizedWidth = 0.50;
  const normalizedHeight = 0.26;

  const scale = canvasWidth / normalizedWidth;

  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    scale
  };
};