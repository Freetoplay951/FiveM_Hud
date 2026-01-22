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
