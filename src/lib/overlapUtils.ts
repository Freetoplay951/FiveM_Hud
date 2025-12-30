import { WidgetConfig, WidgetPosition } from "@/types/widget";

interface WidgetBounds {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
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
const getWidgetBounds = (widget: WidgetConfig, viewportWidth: number, viewportHeight: number): WidgetBounds => {
    const baseSize = WIDGET_BASE_SIZES[widget.type] || { width: 50, height: 50 };
    const scale = widget.scale ?? 1;
    const scaledWidth = baseSize.width * scale;
    const scaledHeight = baseSize.height * scale;

    // Position is center-based
    const centerX = (widget.position.xPercent / 100) * viewportWidth;
    const centerY = (widget.position.yPercent / 100) * viewportHeight;

    return {
        id: widget.id,
        left: centerX - scaledWidth / 2,
        top: centerY - scaledHeight / 2,
        right: centerX + scaledWidth / 2,
        bottom: centerY + scaledHeight / 2,
        centerX,
        centerY,
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
 * Resolve overlaps for status widgets (health, armor, hunger, thirst, stamina, stress, oxygen)
 * by repositioning them horizontally
 */
export const resolveStatusWidgetOverlaps = (widgets: WidgetConfig[]): WidgetConfig[] => {
    const statusTypes = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

    // Separate status widgets from others - include ALL status widgets, not just visible ones
    // This ensures positions are calculated correctly even for hidden widgets
    const statusWidgets = widgets.filter((w) => statusTypes.includes(w.type));
    const otherWidgets = widgets.filter((w) => !statusTypes.includes(w.type));

    if (statusWidgets.length <= 1) {
        return widgets; // No overlaps possible with 0-1 widgets
    }

    // Sort status widgets by their current x position
    const sortedStatus = [...statusWidgets].sort((a, b) => a.position.xPercent - b.position.xPercent);

    // Calculate bounds for each
    const bounds = sortedStatus.map((w) => getWidgetBounds(w, viewportWidth, viewportHeight));

    // Check for overlaps and adjust positions
    let hasOverlap = false;
    const adjustedWidgets: WidgetConfig[] = [...sortedStatus];

    for (let i = 1; i < bounds.length; i++) {
        const prev = bounds[i - 1];
        const curr = bounds[i];

        if (boundsOverlap(prev, curr)) {
            hasOverlap = true;
            // Move this widget to the right of the previous one
            const newCenterX = prev.right + (curr.right - curr.left) / 2 + 8; // 8px gap
            const newXPercent = (newCenterX / viewportWidth) * 100;

            adjustedWidgets[i] = {
                ...adjustedWidgets[i],
                position: {
                    ...adjustedWidgets[i].position,
                    xPercent: Math.min(100, newXPercent), // Clamp to viewport
                },
            };

            // Update bounds for next iteration
            bounds[i] = getWidgetBounds(adjustedWidgets[i], viewportWidth, viewportHeight);
        }
    }

    if (!hasOverlap) {
        return widgets;
    }

    // Merge adjusted widgets back
    const widgetMap = new Map<string, WidgetConfig>();
    otherWidgets.forEach((w) => widgetMap.set(w.id, w));
    adjustedWidgets.forEach((w) => widgetMap.set(w.id, w));

    // Maintain original order
    return widgets.map((w) => widgetMap.get(w.id) || w);
};

/**
 * Check if any widgets overlap and return the IDs of overlapping pairs
 */
export const findOverlappingWidgets = (widgets: WidgetConfig[]): Array<[string, string]> => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

    const visibleWidgets = widgets.filter((w) => w.visible);
    const overlaps: Array<[string, string]> = [];

    for (let i = 0; i < visibleWidgets.length; i++) {
        for (let j = i + 1; j < visibleWidgets.length; j++) {
            const boundsA = getWidgetBounds(visibleWidgets[i], viewportWidth, viewportHeight);
            const boundsB = getWidgetBounds(visibleWidgets[j], viewportWidth, viewportHeight);

            if (boundsOverlap(boundsA, boundsB)) {
                overlaps.push([visibleWidgets[i].id, visibleWidgets[j].id]);
            }
        }
    }

    return overlaps;
};
