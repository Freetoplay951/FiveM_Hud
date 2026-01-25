import { WidgetPosition } from "@/types/widget";
import { getWidgetElement } from "./widgetUtils";
import { WIDGET_GAP } from "./widgetConfig";

/** Snap threshold in pixels */
export const SNAP_THRESHOLD = 8;

/** Snap edge types */
export type SnapEdge = "left" | "right" | "centerX" | "top" | "bottom" | "centerY";

/** Snap line type - direct (edge-to-edge) or gap (with WIDGET_GAP spacing) */
export type SnapLineType = "direct" | "gap";

/** Snap line information */
export interface SnapLine {
    type: "horizontal" | "vertical";
    position: number; // X for vertical, Y for horizontal
    edge: SnapEdge;
    sourceWidgetId: string;
    snapType: SnapLineType; // direct or gap
    /** The widget ID that is the snap target (for highlighting) */
    targetWidgetId: string;
}

/** Widget edges for snapping */
export interface WidgetEdges {
    left: number;
    right: number;
    centerX: number;
    top: number;
    bottom: number;
    centerY: number;
}

/** Get all snap edges from a widget element */
export const getWidgetEdges = (id: string, position?: WidgetPosition): WidgetEdges | null => {
    const el = getWidgetElement(id);
    if (!el) return null;

    const rect = el.getBoundingClientRect();

    // Use provided position or current element position
    const x = position?.x ?? rect.left;
    const y = position?.y ?? rect.top;
    const width = rect.width;
    const height = rect.height;

    return {
        left: x,
        right: x + width,
        centerX: x + width / 2,
        top: y,
        bottom: y + height,
        centerY: y + height / 2,
    };
};

/** Check if two widgets are in proximity (for gap snaps) */
const areWidgetsInProximity = (
    draggingEdges: WidgetEdges,
    targetEdges: WidgetEdges,
    proximityThreshold: number = 100,
): boolean => {
    // Check horizontal overlap/proximity
    const horizontalOverlap =
        draggingEdges.right + proximityThreshold >= targetEdges.left &&
        draggingEdges.left - proximityThreshold <= targetEdges.right;

    // Check vertical overlap/proximity
    const verticalOverlap =
        draggingEdges.bottom + proximityThreshold >= targetEdges.top &&
        draggingEdges.top - proximityThreshold <= targetEdges.bottom;

    return horizontalOverlap && verticalOverlap;
};

/** Options for findSnapLines */
export interface FindSnapLinesOptions {
    /** IDs of widgets in the current selection (to exclude from snap targets) */
    excludeWidgetIds?: string[];
}

/** Find all snap lines from other widgets */
export const findSnapLines = (
    draggingId: string,
    dragPosition: WidgetPosition,
    allWidgetIds: string[],
    threshold: number = SNAP_THRESHOLD,
    options?: FindSnapLinesOptions,
): { snapLines: SnapLine[]; snappedPosition: WidgetPosition } => {
    const draggingEdges = getWidgetEdges(draggingId, dragPosition);
    if (!draggingEdges) return { snapLines: [], snappedPosition: dragPosition };

    const excludeSet = new Set(options?.excludeWidgetIds ?? []);
    const snapLines: SnapLine[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;
    let snapDeltaX = threshold + 1;
    let snapDeltaY = threshold + 1;

    // Check against all other widgets
    for (const widgetId of allWidgetIds) {
        if (widgetId === draggingId) continue;
        if (excludeSet.has(widgetId)) continue;

        const targetEdges = getWidgetEdges(widgetId);
        if (!targetEdges) continue;

        const inProximity = areWidgetsInProximity(draggingEdges, targetEdges);

        // Vertical snaps (X-axis alignment)
        const verticalChecks: {
            dragEdge: SnapEdge;
            targetEdge: SnapEdge;
            dragVal: number;
            targetVal: number;
            snapType: SnapLineType;
        }[] = [
            // Direct snaps (edge-to-edge)
            {
                dragEdge: "left",
                targetEdge: "left",
                dragVal: draggingEdges.left,
                targetVal: targetEdges.left,
                snapType: "direct",
            },
            {
                dragEdge: "left",
                targetEdge: "right",
                dragVal: draggingEdges.left,
                targetVal: targetEdges.right,
                snapType: "direct",
            },
            {
                dragEdge: "right",
                targetEdge: "left",
                dragVal: draggingEdges.right,
                targetVal: targetEdges.left,
                snapType: "direct",
            },
            {
                dragEdge: "right",
                targetEdge: "right",
                dragVal: draggingEdges.right,
                targetVal: targetEdges.right,
                snapType: "direct",
            },
            {
                dragEdge: "centerX",
                targetEdge: "centerX",
                dragVal: draggingEdges.centerX,
                targetVal: targetEdges.centerX,
                snapType: "direct",
            },
        ];

        // Gap snaps - only when in proximity
        if (inProximity) {
            verticalChecks.push(
                // Left edge of dragging widget with gap to right edge of target
                {
                    dragEdge: "left",
                    targetEdge: "right",
                    dragVal: draggingEdges.left,
                    targetVal: targetEdges.right + WIDGET_GAP,
                    snapType: "gap",
                },
                // Right edge of dragging widget with gap to left edge of target
                {
                    dragEdge: "right",
                    targetEdge: "left",
                    dragVal: draggingEdges.right,
                    targetVal: targetEdges.left - WIDGET_GAP,
                    snapType: "gap",
                },
            );
        }

        for (const check of verticalChecks) {
            const delta = Math.abs(check.dragVal - check.targetVal);
            if (delta < threshold && delta < snapDeltaX) {
                snapDeltaX = delta;
                // Calculate the offset needed to snap the dragging widget
                const offset = check.targetVal - check.dragVal;
                snapX = dragPosition.x + offset;

                snapLines.push({
                    type: "vertical",
                    position: check.targetVal,
                    edge: check.targetEdge,
                    sourceWidgetId: widgetId,
                    snapType: check.snapType,
                    targetWidgetId: widgetId,
                });
            }
        }

        // Horizontal snaps (Y-axis alignment)
        const horizontalChecks: {
            dragEdge: SnapEdge;
            targetEdge: SnapEdge;
            dragVal: number;
            targetVal: number;
            snapType: SnapLineType;
        }[] = [
            // Direct snaps (edge-to-edge)
            {
                dragEdge: "top",
                targetEdge: "top",
                dragVal: draggingEdges.top,
                targetVal: targetEdges.top,
                snapType: "direct",
            },
            {
                dragEdge: "top",
                targetEdge: "bottom",
                dragVal: draggingEdges.top,
                targetVal: targetEdges.bottom,
                snapType: "direct",
            },
            {
                dragEdge: "bottom",
                targetEdge: "top",
                dragVal: draggingEdges.bottom,
                targetVal: targetEdges.top,
                snapType: "direct",
            },
            {
                dragEdge: "bottom",
                targetEdge: "bottom",
                dragVal: draggingEdges.bottom,
                targetVal: targetEdges.bottom,
                snapType: "direct",
            },
            {
                dragEdge: "centerY",
                targetEdge: "centerY",
                dragVal: draggingEdges.centerY,
                targetVal: targetEdges.centerY,
                snapType: "direct",
            },
        ];

        // Gap snaps - only when in proximity
        if (inProximity) {
            horizontalChecks.push(
                // Top edge of dragging widget with gap to bottom edge of target
                {
                    dragEdge: "top",
                    targetEdge: "bottom",
                    dragVal: draggingEdges.top,
                    targetVal: targetEdges.bottom + WIDGET_GAP,
                    snapType: "gap",
                },
                // Bottom edge of dragging widget with gap to top edge of target
                {
                    dragEdge: "bottom",
                    targetEdge: "top",
                    dragVal: draggingEdges.bottom,
                    targetVal: targetEdges.top - WIDGET_GAP,
                    snapType: "gap",
                },
            );
        }

        for (const check of horizontalChecks) {
            const delta = Math.abs(check.dragVal - check.targetVal);
            if (delta < threshold && delta < snapDeltaY) {
                snapDeltaY = delta;
                const offset = check.targetVal - check.dragVal;
                snapY = dragPosition.y + offset;

                snapLines.push({
                    type: "horizontal",
                    position: check.targetVal,
                    edge: check.targetEdge,
                    sourceWidgetId: widgetId,
                    snapType: check.snapType,
                    targetWidgetId: widgetId,
                });
            }
        }
    }

    return {
        snapLines,
        snappedPosition: {
            x: snapX ?? dragPosition.x,
            y: snapY ?? dragPosition.y,
        },
    };
};

/** Get all visible widget IDs from the DOM */
export const getVisibleWidgetIds = (): string[] => {
    const widgets = document.querySelectorAll('[id^="hud-widget-"]');
    return Array.from(widgets)
        .map((el) => el.id.replace("hud-widget-", ""))
        .filter((id) => {
            const el = document.getElementById(`hud-widget-${id}`);
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.visibility !== "hidden" && style.opacity !== "0";
        });
};

/** Direction for snap search */
export type SnapDirection = "up" | "down" | "left" | "right";

/** Maximum distance to search for next snap position */
export const MAX_SNAP_SEARCH_DISTANCE = 100;

/** Result of finding next snap position */
export interface NextSnapResult {
    found: boolean;
    position?: WidgetPosition;
    snapLine?: SnapLine;
}

/**
 * Find the next snap position in a given direction from the current widget position.
 * Searches within MAX_SNAP_SEARCH_DISTANCE pixels.
 */
export const findNextSnapPosition = (
    widgetId: string,
    currentPosition: WidgetPosition,
    direction: SnapDirection,
    allWidgetIds: string[],
    excludeWidgetIds: string[] = [],
): NextSnapResult => {
    const widgetEdges = getWidgetEdges(widgetId, currentPosition);
    if (!widgetEdges) return { found: false };

    const excludeSet = new Set([widgetId, ...excludeWidgetIds]);
    
    // Collect all potential snap positions in the given direction
    const candidates: { distance: number; newPosition: WidgetPosition; snapLine: SnapLine }[] = [];

    for (const targetId of allWidgetIds) {
        if (excludeSet.has(targetId)) continue;

        const targetEdges = getWidgetEdges(targetId);
        if (!targetEdges) continue;

        // Based on direction, find valid snap points
        if (direction === "left" || direction === "right") {
            // Horizontal movement - check vertical alignment snap points
            const isMovingRight = direction === "right";
            
            // Check snap points based on widget edges
            const snapChecks = [
                // Dragging widget left edge → target left edge
                { dragEdge: "left" as SnapEdge, targetPos: targetEdges.left, getNewX: () => targetEdges.left },
                // Dragging widget left edge → target right edge
                { dragEdge: "left" as SnapEdge, targetPos: targetEdges.right, getNewX: () => targetEdges.right },
                // Dragging widget left edge → target right edge + gap
                { dragEdge: "left" as SnapEdge, targetPos: targetEdges.right + WIDGET_GAP, getNewX: () => targetEdges.right + WIDGET_GAP },
                // Dragging widget right edge → target left edge
                { dragEdge: "right" as SnapEdge, targetPos: targetEdges.left, getNewX: () => targetEdges.left - (widgetEdges.right - widgetEdges.left) },
                // Dragging widget right edge → target right edge
                { dragEdge: "right" as SnapEdge, targetPos: targetEdges.right, getNewX: () => targetEdges.right - (widgetEdges.right - widgetEdges.left) },
                // Dragging widget right edge → target left edge - gap
                { dragEdge: "right" as SnapEdge, targetPos: targetEdges.left - WIDGET_GAP, getNewX: () => targetEdges.left - WIDGET_GAP - (widgetEdges.right - widgetEdges.left) },
                // Center alignment
                { dragEdge: "centerX" as SnapEdge, targetPos: targetEdges.centerX, getNewX: () => targetEdges.centerX - (widgetEdges.right - widgetEdges.left) / 2 },
            ];

            for (const check of snapChecks) {
                const newX = check.getNewX();
                const distance = newX - currentPosition.x;
                
                // Check if movement is in the correct direction and within range
                const isValidDirection = isMovingRight ? distance > 1 : distance < -1;
                const absDistance = Math.abs(distance);
                
                if (isValidDirection && absDistance <= MAX_SNAP_SEARCH_DISTANCE) {
                    candidates.push({
                        distance: absDistance,
                        newPosition: { x: newX, y: currentPosition.y },
                        snapLine: {
                            type: "vertical",
                            position: check.targetPos,
                            edge: check.dragEdge,
                            sourceWidgetId: targetId,
                            snapType: check.targetPos === targetEdges.right + WIDGET_GAP || check.targetPos === targetEdges.left - WIDGET_GAP ? "gap" : "direct",
                            targetWidgetId: targetId,
                        },
                    });
                }
            }
        } else {
            // Vertical movement - check horizontal alignment snap points
            const isMovingDown = direction === "down";
            
            const snapChecks = [
                // Dragging widget top edge → target top edge
                { dragEdge: "top" as SnapEdge, targetPos: targetEdges.top, getNewY: () => targetEdges.top },
                // Dragging widget top edge → target bottom edge
                { dragEdge: "top" as SnapEdge, targetPos: targetEdges.bottom, getNewY: () => targetEdges.bottom },
                // Dragging widget top edge → target bottom edge + gap
                { dragEdge: "top" as SnapEdge, targetPos: targetEdges.bottom + WIDGET_GAP, getNewY: () => targetEdges.bottom + WIDGET_GAP },
                // Dragging widget bottom edge → target top edge
                { dragEdge: "bottom" as SnapEdge, targetPos: targetEdges.top, getNewY: () => targetEdges.top - (widgetEdges.bottom - widgetEdges.top) },
                // Dragging widget bottom edge → target bottom edge
                { dragEdge: "bottom" as SnapEdge, targetPos: targetEdges.bottom, getNewY: () => targetEdges.bottom - (widgetEdges.bottom - widgetEdges.top) },
                // Dragging widget bottom edge → target top edge - gap
                { dragEdge: "bottom" as SnapEdge, targetPos: targetEdges.top - WIDGET_GAP, getNewY: () => targetEdges.top - WIDGET_GAP - (widgetEdges.bottom - widgetEdges.top) },
                // Center alignment
                { dragEdge: "centerY" as SnapEdge, targetPos: targetEdges.centerY, getNewY: () => targetEdges.centerY - (widgetEdges.bottom - widgetEdges.top) / 2 },
            ];

            for (const check of snapChecks) {
                const newY = check.getNewY();
                const distance = newY - currentPosition.y;
                
                const isValidDirection = isMovingDown ? distance > 1 : distance < -1;
                const absDistance = Math.abs(distance);
                
                if (isValidDirection && absDistance <= MAX_SNAP_SEARCH_DISTANCE) {
                    candidates.push({
                        distance: absDistance,
                        newPosition: { x: currentPosition.x, y: newY },
                        snapLine: {
                            type: "horizontal",
                            position: check.targetPos,
                            edge: check.dragEdge,
                            sourceWidgetId: targetId,
                            snapType: check.targetPos === targetEdges.bottom + WIDGET_GAP || check.targetPos === targetEdges.top - WIDGET_GAP ? "gap" : "direct",
                            targetWidgetId: targetId,
                        },
                    });
                }
            }
        }
    }

    // Sort by distance and return the closest one
    if (candidates.length === 0) {
        return { found: false };
    }

    candidates.sort((a, b) => a.distance - b.distance);
    const closest = candidates[0];
    
    return {
        found: true,
        position: closest.newPosition,
        snapLine: closest.snapLine,
    };
};
