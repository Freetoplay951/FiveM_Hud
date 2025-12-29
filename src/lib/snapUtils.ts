import { WidgetPosition } from '@/types/widget';

/**
 * Snaps a percentage-based position to the grid
 * @param position - Position in percentages (0-100)
 * @param gridSize - Grid size in pixels
 * @returns Snapped position in percentages
 */
export const snapPositionToGrid = (
  position: WidgetPosition,
  gridSize: number
): WidgetPosition => {
  // Convert percent to pixels, snap, then back to percent
  const pixelX = (position.xPercent / 100) * window.innerWidth;
  const pixelY = (position.yPercent / 100) * window.innerHeight;
  
  const snappedX = Math.round(pixelX / gridSize) * gridSize;
  const snappedY = Math.round(pixelY / gridSize) * gridSize;
  
  return {
    xPercent: (snappedX / window.innerWidth) * 100,
    yPercent: (snappedY / window.innerHeight) * 100,
  };
};
