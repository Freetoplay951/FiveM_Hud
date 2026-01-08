import { WidgetPosition } from "@/types/widget";

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
    /** Get screen dimensions */
    screen: { width: number; height: number };
    /** Check if a widget is disabled by server */
    isWidgetDisabled?: (id: string) => boolean;
    /** Whether the HUD has signaled ready (all widgets are properly rendered) */
    hasSignaledReady: boolean;
}

const getWidgetSizeFromDOM = (id: string, scale: number = 1): WidgetSize => {
    const element = document.getElementById(`hud-widget-${id}`);
    return {
        width: (element?.offsetWidth ?? 0) * scale,
        height: (element?.offsetHeight ?? 0) * scale,
    };
};

/**
 * Computes all default widget positions in order, building up a cache
 * so dependent widgets can query the resolved positions of their dependencies.
 *
 * Position functions can use getWidgetCurrentRect() to get actual DOM positions
 * of anchor widgets (like heli-base) for relative positioning.
 *
 * @param widgetConfigs - Array of widget configurations with position functions
 * @param isWidgetDisabled - Optional function to check if a widget is disabled
 */
export function resolveDefaultPositions(
    widgetConfigs: Array<{
        id: string;
        scale?: number;
        position: (id: string, element: HTMLElement | null, resolver: PositionResolver) => WidgetPosition;
    }>,
    isWidgetDisabled?: (id: string) => boolean,
    hasSignaledReady?: boolean
): Map<string, WidgetRect> {
    const resolvedRects = new Map<string, WidgetRect>();

    const screen = {
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
    };

    const getWidgetSize = (id: string): WidgetSize => {
        const element = document.getElementById(`hud-widget-${id}`);
        return {
            width: element?.offsetWidth ?? 0,
            height: element?.offsetHeight ?? 0,
        };
    };

    // Get current rect from DOM (actual position after user dragging)
    // Returns computed rect if HUD hasn't signaled ready yet (widgets still positioning)
    const getWidgetCurrentRect = (id: string): WidgetRect | null => {
        // If HUD hasn't signaled ready, widgets are still in initial render - use computed positions
        if (!hasSignaledReady) {
            return resolvedRects.get(id) ?? null;
        }

        const element = document.getElementById(`hud-widget-${id}`);
        if (!element) return resolvedRects.get(id) ?? null;

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
        };
    };

    const resolver: PositionResolver = {
        getWidgetRect: (id: string) => resolvedRects.get(id) ?? null,
        getWidgetCurrentRect,
        getWidgetSize,
        screen,
        isWidgetDisabled,
        hasSignaledReady,
    };

    // Process widgets in order - earlier widgets are resolved first
    for (const config of widgetConfigs) {
        const element = document.getElementById(`hud-widget-${config.id}`);
        const scale = config.scale ?? 1;
        const size = getWidgetSizeFromDOM(config.id, scale);

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
