import { useRef, useEffect, useMemo } from "react";

/**
 * Performance debugging hook to track component re-renders
 *
 * Usage:
 * ```tsx
 * const MyComponent = ({ prop1, prop2 }) => {
 *   useRenderLogger("MyComponent", { prop1, prop2 });
 *   // ...
 * }
 * ```
 *
 * For store subscriptions, pass the store values:
 * ```tsx
 * const value = useMyStore(s => s.value);
 * useRenderLogger("MyComponent", { value });
 * ```
 */

// Global flag to enable/disable render logging
const RENDER_LOGGING_ENABLED = process.env.NODE_ENV === "development";

// Render count per component for session tracking
const renderCounts = new Map<string, number>();

// Color palette for console output
const COLORS = {
    component: "#4FC3F7", // Light blue
    props: "#81C784", // Green
    store: "#FFB74D", // Orange
    count: "#BA68C8", // Purple
    initial: "#90A4AE", // Gray
    warning: "#FF7043", // Red-orange for frequent renders
};

interface RenderLoggerOptions {
    /** Log initial render (default: false) */
    logInitial?: boolean;
    /** Threshold for warning about frequent renders (renders per second) */
    frequencyWarningThreshold?: number;
    /** Group related logs (default: true) */
    groupLogs?: boolean;
}

/**
 * Hook to log component re-renders with prop/store change detection
 */
export function useRenderLogger(
    componentName: string,
    trackedValues: Record<string, unknown>,
    options: RenderLoggerOptions = {},
) {
    const { logInitial = false, frequencyWarningThreshold = 10, groupLogs = true } = options;

    const prevValuesRef = useRef<Record<string, unknown> | null>(null);
    const renderTimestampsRef = useRef<number[]>([]);
    const isFirstRenderRef = useRef(true);

    // Increment render count
    const renderCount = useMemo(() => {
        const current = renderCounts.get(componentName) ?? 0;
        const next = current + 1;
        renderCounts.set(componentName, next);
        return next;
    }, [componentName]);

    useEffect(() => {
        if (!RENDER_LOGGING_ENABLED) return;

        const now = Date.now();
        renderTimestampsRef.current.push(now);

        // Keep only last second of timestamps
        renderTimestampsRef.current = renderTimestampsRef.current.filter((t) => now - t < 1000);

        const rendersPerSecond = renderTimestampsRef.current.length;
        const isFrequent = rendersPerSecond > frequencyWarningThreshold;

        // Handle first render
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            prevValuesRef.current = { ...trackedValues };

            if (logInitial) {
                console.log(
                    `%c[Render] %c${componentName} %c(initial)`,
                    `color: ${COLORS.initial}`,
                    `color: ${COLORS.component}; font-weight: bold`,
                    `color: ${COLORS.initial}`,
                );
            }
            return;
        }

        // Detect changes
        const changes: Array<{ key: string; from: unknown; to: unknown }> = [];

        Object.entries(trackedValues).forEach(([key, value]) => {
            const prevValue = prevValuesRef.current?.[key];
            if (!Object.is(prevValue, value)) {
                changes.push({ key, from: prevValue, to: value });
            }
        });

        // Only log if there are changes or if this is a forced re-render
        if (changes.length > 0 || Object.keys(trackedValues).length === 0) {
            const logFn = isFrequent ? console.warn : console.log;

            if (groupLogs && changes.length > 1) {
                console.groupCollapsed(
                    `%c[Render] %c${componentName} %c#${renderCount} %c(${changes.length} changes)${
                        isFrequent ? " ⚠️ FREQUENT" : ""
                    }`,
                    `color: ${isFrequent ? COLORS.warning : COLORS.props}`,
                    `color: ${COLORS.component}; font-weight: bold`,
                    `color: ${COLORS.count}`,
                    `color: ${COLORS.props}`,
                );

                changes.forEach(({ key, from, to }) => {
                    console.log(`  %c${key}:`, `color: ${COLORS.store}`, from, "→", to);
                });

                console.groupEnd();
            } else if (changes.length > 0) {
                const changeStr = changes.map((c) => c.key).join(", ");
                logFn(
                    `%c[Render] %c${componentName} %c#${renderCount} %c← ${changeStr}${isFrequent ? " ⚠️" : ""}`,
                    `color: ${isFrequent ? COLORS.warning : COLORS.props}`,
                    `color: ${COLORS.component}; font-weight: bold`,
                    `color: ${COLORS.count}`,
                    `color: ${COLORS.store}`,
                );
            } else {
                // No tracked values but component re-rendered (parent re-render)
                logFn(
                    `%c[Render] %c${componentName} %c#${renderCount} %c(parent re-render)${isFrequent ? " ⚠️" : ""}`,
                    `color: ${isFrequent ? COLORS.warning : COLORS.initial}`,
                    `color: ${COLORS.component}; font-weight: bold`,
                    `color: ${COLORS.count}`,
                    `color: ${COLORS.initial}`,
                );
            }
        }

        prevValuesRef.current = { ...trackedValues };
    });

    return renderCount;
}

/**
 * Simpler version that just logs render count without change detection
 */
export function useRenderCount(componentName: string) {
    const countRef = useRef(0);

    useEffect(() => {
        if (!RENDER_LOGGING_ENABLED) return;

        countRef.current += 1;
        console.log(
            `%c[Render] %c${componentName} %c#${countRef.current}`,
            `color: ${COLORS.initial}`,
            `color: ${COLORS.component}; font-weight: bold`,
            `color: ${COLORS.count}`,
        );
    });

    return countRef.current;
}

/**
 * Get current render statistics for all components
 */
export function getRenderStats(): Record<string, number> {
    return Object.fromEntries(renderCounts);
}

/**
 * Reset render statistics
 */
export function resetRenderStats(): void {
    renderCounts.clear();
}

/**
 * Log a summary of all render counts
 */
export function logRenderSummary(): void {
    if (!RENDER_LOGGING_ENABLED) return;

    const stats = Array.from(renderCounts.entries()).sort((a, b) => b[1] - a[1]);

    console.group("%c[Render Summary]", `color: ${COLORS.component}; font-weight: bold`);
    stats.forEach(([name, count]) => {
        const isHot = count > 50;
        console.log(
            `%c${name}: %c${count}${isHot ? " 🔥" : ""}`,
            `color: ${COLORS.store}`,
            `color: ${isHot ? COLORS.warning : COLORS.count}; font-weight: bold`,
        );
    });
    console.groupEnd();
}

// Expose to window for debugging
if (typeof window !== "undefined" && RENDER_LOGGING_ENABLED) {
    (
        window as unknown as {
            __renderStats: { get: () => Record<string, number>; reset: () => void; log: () => void };
        }
    ).__renderStats = {
        get: getRenderStats,
        reset: resetRenderStats,
        log: logRenderSummary,
    };
}
