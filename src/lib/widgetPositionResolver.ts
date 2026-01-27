import { WidgetPosition } from "@/types/widget";
import { LayoutOptions, DEFAULT_LAYOUT_OPTIONS, getWidgetElementId, WIDGET_DOM_PREFIX } from "@/lib/widgetConfig";

export interface WidgetSize {
    width: number;
    height: number;
}

export interface WidgetRect {
    x: number; // X position of the top-left corner
    y: number; // Y position of the top-left corner
    width: number; // Width of the widget
    height: number; // Height of the widget
    right: number; // x + width → right edge of the widget
    bottom: number; // y + height → bottom edge of the widget
}

/**
 * Resolver provides access to already-computed default positions and sizes
 * of other widgets during the position calculation phase.
 */
export interface PositionResolver {
    /** Get the computed default rect (position + size) of another widget */
    getWidgetRect: (id: string) => WidgetRect | null;
    /** Get the CURRENT rect from DOM (actual position), fallback to computed rect */
    getWidgetCurrentRect: (id: string) => WidgetRect | null;
    /** Get just the size of a widget from DOM */
    getWidgetSize: (id: string) => WidgetSize;
    /** Get the scale of a widget */
    getWidgetScale?: (id: string) => number;
    /** Get screen dimensions */
    screen: { width: number; height: number };
    /** Check if a widget is disabled by server */
    isWidgetDisabled?: (id: string) => boolean;
    /** Whether the HUD has signaled ready (all widgets are properly rendered) */
    hasSignaledReady: boolean;
    /** Layout options from the HUD state - use for conditional positioning */
    options: LayoutOptions;
    /** Get all visible widget IDs from the DOM (dynamically) */
    getAllWidgetIds: () => string[];
    /** Find widgets within proximity of a given rect */
    findNearbyWidgets: (
        referenceRect: WidgetRect,
        maxDistance: number,
        excludeIds?: string[],
    ) => Array<{ id: string; rect: WidgetRect; distance: number }>;
}

/**
 * Get all visible widget elements from the DOM.
 * Dynamically discovers widgets by their DOM prefix.
 */
export function getAllWidgetElements(): Array<{ id: string; element: HTMLElement }> {
    const results: Array<{ id: string; element: HTMLElement }> = [];
    const allElements = document.querySelectorAll(`[id^="${WIDGET_DOM_PREFIX}"]`);

    for (const element of allElements) {
        const htmlElement = element as HTMLElement;
        const id = htmlElement.id.replace(WIDGET_DOM_PREFIX, "");

        // Include all widget elements with size (no filtering by opacity/visibility/display)
        const rect = htmlElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            results.push({ id, element: htmlElement });
        }
    }

    return results;
}

/**
 * Calculate the minimum distance between two rects.
 * Returns 0 if they overlap.
 */
export function getRectsDistance(rectA: WidgetRect, rectB: WidgetRect): number {
    // Horizontal gap
    const gapX = Math.max(0, Math.max(rectA.x - rectB.right, rectB.x - rectA.right));
    // Vertical gap
    const gapY = Math.max(0, Math.max(rectA.y - rectB.bottom, rectB.y - rectA.bottom));

    // If no gap in either direction, they overlap or touch
    if (gapX === 0 && gapY === 0) return 0;

    // Return Euclidean distance between closest edges
    return Math.sqrt(gapX * gapX + gapY * gapY);
}

/**
 * Computes default positions and sizes for all widgets in order.
 *
 * @param {Array<{id: string, scale?: number, position: (id: string, element: HTMLElement | null, resolver: PositionResolver) => WidgetPosition}>} widgetConfigs
 *   - Array of widget configurations, each with a position function.
 * @param {(id: string) => boolean} [isWidgetDisabled] - Optional callback to check if a widget is disabled.
 * @param {boolean} [hasSignaledReady] - Whether the HUD has signaled that widgets are fully rendered;
 *                                      affects whether current DOM positions are used.
 * @param {LayoutOptions} [layoutOptions=DEFAULT_LAYOUT_OPTIONS] - Optional layout options to use during calculation.
 * @returns {Map<string, WidgetRect>} - Map of widget ID to its computed rect (position + size).
 *
 * @description
 * Calculates positions and sizes for all widgets in the provided order.
 * - Widgets earlier in the array are resolved first, so dependent widgets can query their positions.
 * - Uses a PositionResolver to provide:
 *   - Already computed rects (`getWidgetRect`)
 *   - Current DOM rects (`getWidgetCurrentRect`)
 *   - Widget sizes (`getWidgetSize`) and scales (`getWidgetScale`)
 *   - Screen dimensions
 *   - Layout options and disabled status
 * - If `hasSignaledReady` is true, actual DOM positions and sizes are used when available.
 * - Returns a map of all widget positions and sizes for further processing.
 */
export function resolveDefaultPositions(
    widgetConfigs: Array<{
        id: string;
        scale?: number;
        position: (id: string, element: HTMLElement | null, resolver: PositionResolver) => WidgetPosition;
    }>,
    isWidgetDisabled: (id: string) => boolean,
    hasSignaledReady: boolean,
    layoutOptions: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): Map<string, WidgetRect> {
    const resolvedRects = new Map<string, WidgetRect>();

    const screen = {
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
    };

    const widgetScales = new Map<string, number>();
    for (const config of widgetConfigs) {
        widgetScales.set(config.id, config.scale ?? 1);
    }

    const getWidgetSize = (id: string): WidgetSize => {
        const element = document.getElementById(getWidgetElementId(id));
        const scale = widgetScales.get(id) ?? 1;

        if (hasSignaledReady && element) {
            const rect = element.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height,
            };
        }

        return {
            width: (element?.offsetWidth ?? 0) * scale,
            height: (element?.offsetHeight ?? 0) * scale,
        };
    };

    // Get current rect from DOM (actual position after user dragging)
    // Returns computed rect if HUD hasn't signaled ready yet (widgets still positioning)
    const getWidgetCurrentRect = (id: string): WidgetRect | null => {
        if (!hasSignaledReady) {
            return resolvedRects.get(id) ?? null;
        }

        const element = document.getElementById(getWidgetElementId(id));
        if (!element) return resolvedRects.get(id) ?? null;

        // getBoundingClientRect already returns the scaled size (after CSS transform)
        // so we should NOT multiply by scale again
        const rect = element.getBoundingClientRect();

        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height,
        };
    };

    // Get all visible widget IDs from DOM
    const getAllWidgetIds = (): string[] => {
        if (!hasSignaledReady) {
            // Before ready, return already-resolved widget IDs
            return Array.from(resolvedRects.keys());
        }
        return getAllWidgetElements().map((w) => w.id);
    };

    // Find widgets within proximity of a reference rect
    const findNearbyWidgets = (
        referenceRect: WidgetRect,
        maxDistance: number,
        excludeIds: string[] = [],
    ): Array<{ id: string; rect: WidgetRect; distance: number }> => {
        const excludeSet = new Set(excludeIds);
        const results: Array<{ id: string; rect: WidgetRect; distance: number }> = [];

        const widgetIds = getAllWidgetIds();

        for (const widgetId of widgetIds) {
            if (excludeSet.has(widgetId)) continue;
            if (isWidgetDisabled?.(widgetId)) continue;

            const rect = getWidgetCurrentRect(widgetId);
            if (!rect) continue;

            const distance = getRectsDistance(referenceRect, rect);
            if (distance <= maxDistance) {
                results.push({ id: widgetId, rect, distance });
            }
        }

        // Sort by y-position (highest first = lowest y value)
        return results;
    };

    const resolver: PositionResolver = {
        getWidgetRect: (id: string) => resolvedRects.get(id) ?? null,
        getWidgetCurrentRect,
        getWidgetSize,
        getWidgetScale: (id: string) => widgetScales.get(id) ?? 1,
        screen,
        isWidgetDisabled,
        hasSignaledReady,
        options: layoutOptions,
        getAllWidgetIds,
        findNearbyWidgets,
    };

    // Process widgets in order - earlier widgets are resolved first
    for (const config of widgetConfigs) {
        const element = document.getElementById(getWidgetElementId(config.id));

        // Use rendered size when possible (so scale is respected), otherwise fallback to offset size * config scale
        const size = getWidgetSize(config.id);

        // Compute position using resolver (which has access to previously computed rects
        // and can fetch current DOM positions via getWidgetCurrentRect)
        const pos = config.position(config.id, element, resolver);

        // Store the full rect for this widget
        const rect: WidgetRect = {
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
            right: pos.x + size.width,
            bottom: pos.y + size.height,
        };

        resolvedRects.set(config.id, rect);
    }

    return resolvedRects;
}
