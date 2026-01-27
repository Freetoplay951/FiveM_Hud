import { StatusType } from "@/types/hud";
import { BrandingPosition, MinimapShape, StatusDesign, WIDGET_GROUPS, WidgetType } from "@/types/widget";

// ============= Re-exports from widgetHelpers =============
// Centralized DOM utilities - use these instead of hardcoding "hud-widget-" prefix

export {
    WIDGET_DOM_PREFIX,
    getWidgetElementId,
    getWidgetDOMElement,
    type WidgetDisabledChecker,
    type RelayoutContext,
} from "@/lib/widgetHelpers";

// ============= Layout Spacing Constants =============

/** Default margin from screen edges */
export const WIDGET_MARGIN = 20;

/** Default gap between widgets */
export const WIDGET_GAP = 10;

/** Base tolerance for position comparison (added to gridSize) */
export const POSITION_TOLERANCE_BASE = 5;

/** Distance threshold for cascading widget relayout (nearby widgets get moved along) */
export const PROXIMITY_THRESHOLD = 100;

/** Distance threshold for external widgets to be pulled along (2 * WIDGET_GAP) */
export const EXTERNAL_PROXIMITY_THRESHOLD = WIDGET_GAP * 2;

/** Default proximity threshold for finding nearby widgets */
export const NEARBY_WIDGET_THRESHOLD = 100;

// ============= Snap Visualization Config =============

/** Duration in ms to show snap lines during keyboard navigation */
export const SNAP_LINE_DISPLAY_DURATION = 1000;

// ============= Widget ID Lists =============

/** Status widget IDs in display order (left to right) */
export const STATUS_WIDGET_IDS: StatusType[] = [
    "health",
    "armor",
    "hunger",
    "thirst",
    "stamina",
    "stress",
    "oxygen",
] as const;

// ============= Layout Options =============

/**
 * Layout options passed to position functions for dynamic positioning.
 * Add new settings here as needed - they'll be available in all position functions.
 */
export interface LayoutOptions {
    brandingPosition: BrandingPosition;
    minimapShape: MinimapShape;
    statusDesign: StatusDesign;
    // Config options that affect widget visibility/positioning
    minimapOnlyInVehicle: boolean;
    locationOnlyInVehicle: boolean;
    inVehicle: boolean;
    isEditMode: boolean;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
    brandingPosition: "center",
    minimapShape: "square",
    statusDesign: "circular",
    minimapOnlyInVehicle: false,
    locationOnlyInVehicle: false,
    inVehicle: false,
    isEditMode: false,
};

// ============= Widget Selection & Lock Config =============

/**
 * Widgets that are excluded from multi-selection.
 * These widgets cannot be selected or moved via box selection.
 */
export const WIDGETS_EXCLUDED_FROM_MULTI_SELECT: ReadonlySet<string> = new Set(["minimap"]);

/**
 * Widgets that are locked (not movable, not resizable, not hideable).
 * These widgets show a lock indicator in edit mode.
 */
export const LOCKED_WIDGETS: ReadonlySet<string> = new Set(["minimap"]);

/**
 * Check if a widget is excluded from multi-selection
 */
export const isExcludedFromMultiSelect = (widgetId: string): boolean =>
    WIDGETS_EXCLUDED_FROM_MULTI_SELECT.has(widgetId);

/**
 * Check if a widget is locked
 */
export const isWidgetLocked = (widgetId: string): boolean => LOCKED_WIDGETS.has(widgetId);

// ============= Subwidget Detection =============

/**
 * All subwidgets derived from WIDGET_GROUPS - single source of truth.
 * This set is automatically updated when WIDGET_GROUPS changes.
 */
export const ALL_SUBWIDGETS: ReadonlySet<WidgetType> = new Set(WIDGET_GROUPS.flatMap((group) => group.subwidgets));

/**
 * Check if a widget is a subwidget (non-base vehicle widget).
 * Subwidgets are vehicle-specific widgets like heli-kts, car-fuel, plane-altitude, etc.
 * BaseWidgets (heli-base, car-base, etc.) are NOT subwidgets.
 *
 * Uses WIDGET_GROUPS as single source of truth - no hardcoded suffixes.
 */
export const isSubwidget = (widgetId: string): boolean => {
    return ALL_SUBWIDGETS.has(widgetId as WidgetType);
};
