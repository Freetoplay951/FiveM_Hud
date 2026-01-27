import { ResolvedWidgetConfig, WidgetPosition } from "@/types/widget";
import { PositionResolver, WidgetRect } from "@/lib/widgetPositionResolver";
import { DEFAULT_LAYOUT_OPTIONS } from "@/lib/widgetConfig";

// ============= Type Aliases =============

/** Callback to check if a widget is disabled by server */
export type WidgetDisabledChecker = (id: string) => boolean;

/** Common context for relayout operations */
export interface RelayoutContext {
    isWidgetDisabled?: WidgetDisabledChecker;
    hasSignaledReady?: boolean;
}

// ============= DOM Constants =============

/** Prefix for widget DOM element IDs */
export const WIDGET_DOM_PREFIX = "hud-widget-";

/** Get the DOM element ID for a widget */
export const getWidgetElementId = (widgetId: string): string => `${WIDGET_DOM_PREFIX}${widgetId}`;

/** Get the DOM element for a widget */
export const getWidgetDOMElement = (widgetId: string): HTMLElement | null =>
    document.getElementById(getWidgetElementId(widgetId));

// ============= State Update Helpers =============

/**
 * Update a single widget in the widgets array.
 * Generic helper to reduce repetitive map/spread patterns.
 *
 * @example
 * updateWidgetInArray(widgets, "minimap", { position: { x: 100, y: 100 } })
 */
export const updateWidgetInArray = <K extends keyof ResolvedWidgetConfig>(
    widgets: ResolvedWidgetConfig[],
    id: string,
    updates: Pick<ResolvedWidgetConfig, K>,
): ResolvedWidgetConfig[] => {
    return widgets.map((w) => (w.id === id ? { ...w, ...updates } : w));
};

/**
 * Update multiple widgets in the widgets array.
 *
 * @example
 * updateMultipleWidgets(widgets, new Map([
 *   ["minimap", { position: { x: 100, y: 100 } }],
 *   ["status", { visible: false }]
 * ]))
 */
export const updateMultipleWidgets = (
    widgets: ResolvedWidgetConfig[],
    updates: Map<string, Partial<ResolvedWidgetConfig>>,
): ResolvedWidgetConfig[] => {
    return widgets.map((w) => {
        const update = updates.get(w.id);
        return update ? { ...w, ...update } : w;
    });
};

// ============= Mock Resolver Factory =============

/** Default mock rect for dependency detection */
const MOCK_RECT: WidgetRect = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
};

/** Default mock bounding client rect */
const MOCK_BOUNDING_RECT = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
};

/**
 * Create a mock resolver for dependency detection.
 * Used to trace which widgets a position function depends on.
 *
 * @param onWidgetAccess - Callback invoked when a widget is accessed
 */
export const createMockResolver = (onWidgetAccess?: (id: string) => void): PositionResolver => ({
    getWidgetRect: (id: string) => {
        onWidgetAccess?.(id);
        return MOCK_RECT;
    },
    getWidgetCurrentRect: (id: string) => {
        onWidgetAccess?.(id);
        return MOCK_RECT;
    },
    getWidgetSize: () => ({ width: 100, height: 100 }),
    screen: { width: 1920, height: 1080 },
    isWidgetDisabled: () => false,
    hasSignaledReady: false,
    options: DEFAULT_LAYOUT_OPTIONS,
});

/**
 * Create a mock HTML element for position function testing.
 */
export const createMockElement = (): HTMLElement =>
    ({
        offsetWidth: 100,
        offsetHeight: 100,
        getBoundingClientRect: () => MOCK_BOUNDING_RECT,
    }) as unknown as HTMLElement;

// ============= Position Utilities =============

/**
 * Clamp a position to the viewport bounds.
 */
export const clampToViewport = (pos: WidgetPosition): WidgetPosition => ({
    x: Math.max(0, Math.min(window.innerWidth, pos.x)),
    y: Math.max(0, Math.min(window.innerHeight, pos.y)),
});
