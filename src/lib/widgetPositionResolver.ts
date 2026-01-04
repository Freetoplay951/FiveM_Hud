import { StatusWidgetFlags } from "@/types/hud";
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
    /** Get just the size of a widget from DOM */
    getWidgetSize: (id: string) => WidgetSize;
    /** Get screen dimensions */
    screen: { width: number; height: number };
}

/**
 * Computes all default widget positions in order, building up a cache
 * so dependent widgets can query the resolved positions of their dependencies.
 */
export function resolveDefaultPositions(
    widgetConfigs: Array<{
        id: string;
        scale?: number;
        position: (
            id: string,
            element: HTMLElement | null,
            context: StatusWidgetFlags | undefined,
            resolver: PositionResolver
        ) => WidgetPosition;
    }>,
    context?: StatusWidgetFlags
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

    const resolver: PositionResolver = {
        getWidgetRect: (id: string) => resolvedRects.get(id) ?? null,
        getWidgetSize,
        screen,
    };

    // Process widgets in order - earlier widgets are resolved first
    for (const config of widgetConfigs) {
        const element = document.getElementById(`hud-widget-${config.id}`);
        const size = getWidgetSize(config.id);
        const scale = config.scale ?? 1;

        // Compute position using resolver (which has access to previously computed rects)
        const pos = config.position(config.id, element, context, resolver);

        // Store the full rect for this widget
        const rect: WidgetRect = {
            x: pos.x,
            y: pos.y,
            width: size.width * scale,
            height: size.height * scale,
            right: pos.x + size.width * scale,
            bottom: pos.y + size.height * scale,
        };

        resolvedRects.set(config.id, rect);
    }

    return resolvedRects;
}
