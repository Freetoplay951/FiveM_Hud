/**
 * Styled logging utilities for the auto-relayout system.
 * Matches the style of useRenderLogger for consistency.
 */

const LOG_PREFIX = "[AutoRelayout]";
const LOGGING_ENABLED = process.env.NODE_ENV === "development";

/** Color palette for console output */
export const RELAYOUT_COLORS = {
    prefix: "#4FC3F7",    // Light blue
    phase: "#81C784",     // Green
    widget: "#FFB74D",    // Orange
    categoryA: "#4FC3F7", // Light blue
    categoryB: "#BA68C8", // Purple
    categoryC: "#F06292", // Pink
    external: "#90A4AE",  // Gray
    vector: "#81C784",    // Green
    warning: "#FF7043",   // Red-orange
    info: "#90A4AE",      // Gray
    distance: "#64B5F6",  // Blue
} as const;

type WidgetCategory = "A" | "B" | "C" | "External";

const CATEGORY_COLORS: Record<WidgetCategory, string> = {
    A: RELAYOUT_COLORS.categoryA,
    B: RELAYOUT_COLORS.categoryB,
    C: RELAYOUT_COLORS.categoryC,
    External: RELAYOUT_COLORS.external,
};

/**
 * Centralized logger for relayout operations.
 * All methods are no-ops in production.
 */
export const relayoutLogger = {
    /** Log a general message with optional color */
    log: (message: string, color: string = RELAYOUT_COLORS.phase): void => {
        if (!LOGGING_ENABLED) return;
        console.log(
            `%c${LOG_PREFIX} %c${message}`,
            `color: ${RELAYOUT_COLORS.prefix}; font-weight: bold`,
            `color: ${color}`
        );
    },

    /** Log a widget-specific message with category styling */
    logWidget: (category: WidgetCategory, id: string, details: string): void => {
        if (!LOGGING_ENABLED) return;
        
        const categoryColor = CATEGORY_COLORS[category];
        
        console.log(
            `%c${LOG_PREFIX} %c  [${category}] %c${id}: %c${details}`,
            `color: ${RELAYOUT_COLORS.prefix}`,
            `color: ${categoryColor}; font-weight: bold`,
            `color: ${RELAYOUT_COLORS.widget}`,
            `color: ${RELAYOUT_COLORS.vector}`
        );
    },

    /** Start a collapsed console group */
    logGroup: (label: string): void => {
        if (!LOGGING_ENABLED) return;
        console.groupCollapsed(
            `%c${LOG_PREFIX} %c${label}`,
            `color: ${RELAYOUT_COLORS.prefix}; font-weight: bold`,
            `color: ${RELAYOUT_COLORS.phase}; font-weight: bold`
        );
    },

    /** End the current console group */
    logGroupEnd: (): void => {
        if (!LOGGING_ENABLED) return;
        console.groupEnd();
    },

    /** Log an informational message */
    logInfo: (message: string): void => {
        if (!LOGGING_ENABLED) return;
        console.log(
            `%c${LOG_PREFIX} %c  ℹ️ ${message}`,
            `color: ${RELAYOUT_COLORS.prefix}`,
            `color: ${RELAYOUT_COLORS.info}`
        );
    },

    /** Log a warning message */
    logWarning: (message: string): void => {
        if (!LOGGING_ENABLED) return;
        console.log(
            `%c${LOG_PREFIX} %c  ⚠️ ${message}`,
            `color: ${RELAYOUT_COLORS.prefix}`,
            `color: ${RELAYOUT_COLORS.warning}; font-weight: bold`
        );
    },
};
