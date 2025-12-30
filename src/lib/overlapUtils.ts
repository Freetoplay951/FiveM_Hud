import { WidgetConfig } from "@/types/widget";

interface WidgetBounds {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
}

// Estimated base sizes for widgets (before scaling)
const WIDGET_BASE_SIZES: Record<string, { width: number; height: number }> = {
    health: { width: 48, height: 48 },
    armor: { width: 48, height: 48 },
    hunger: { width: 48, height: 48 },
    thirst: { width: 48, height: 48 },
    stamina: { width: 48, height: 48 },
    stress: { width: 48, height: 48 },
    oxygen: { width: 48, height: 48 },
    money: { width: 180, height: 80 },
    clock: { width: 100, height: 40 },
    compass: { width: 80, height: 80 },
    voice: { width: 120, height: 50 },
    minimap: { width: 200, height: 200 },
    notifications: { width: 280, height: 150 },
    speedometer: { width: 200, height: 200 },
};

/**
 * Calculate the bounding box of a widget in pixels
 */
const getWidgetBounds = (widget: WidgetConfig): WidgetBounds => {
    const baseSize = WIDGET_BASE_SIZES[widget.type] || { width: 50, height: 50 };
    const scale = widget.scale ?? 1;
    const scaledWidth = baseSize.width * scale;
    const scaledHeight = baseSize.height * scale;

    return {
        id: widget.id,
        left: widget.position.x,
        top: widget.position.y,
        right: widget.position.x + scaledWidth,
        bottom: widget.position.y + scaledHeight,
    };
};

/**
 * Check if two bounding boxes overlap
 */
const boundsOverlap = (a: WidgetBounds, b: WidgetBounds, padding: number = 4): boolean => {
    return !(
        a.right + padding < b.left ||
        a.left - padding > b.right ||
        a.bottom + padding < b.top ||
        a.top - padding > b.bottom
    );
};

/**
 * Check if any widgets overlap and return the IDs of overlapping pairs
 */
export const findOverlappingWidgets = (widgets: WidgetConfig[]): Array<[string, string]> => {
    const visibleWidgets = widgets.filter((w) => w.visible);
    const overlaps: Array<[string, string]> = [];

    for (let i = 0; i < visibleWidgets.length; i++) {
        for (let j = i + 1; j < visibleWidgets.length; j++) {
            const boundsA = getWidgetBounds(visibleWidgets[i]);
            const boundsB = getWidgetBounds(visibleWidgets[j]);

            if (boundsOverlap(boundsA, boundsB)) {
                overlaps.push([visibleWidgets[i].id, visibleWidgets[j].id]);
            }
        }
    }

    return overlaps;
};
