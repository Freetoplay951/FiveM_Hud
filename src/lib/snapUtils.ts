import { WidgetPosition } from "@/types/widget";

/**
 * Snaps a pixel-based position to the grid
 */
export const snapPositionToGrid = (position: WidgetPosition, gridSize: number): WidgetPosition => {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
    };
};
