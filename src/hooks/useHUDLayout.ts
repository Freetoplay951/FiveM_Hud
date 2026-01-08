import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    ResolvedWidgetConfig,
    WidgetPosition,
    StatusDesign,
    SpeedometerType,
    MinimapShape,
    getDefaultWidgets,
    WidgetConfig,
} from "@/types/widget";
import { resolveDefaultPositions, PositionResolver, WidgetRect } from "@/lib/widgetPositionResolver";

// Tolerance for position comparison (pixels)
const POSITION_TOLERANCE = 5;

/**
 * Programmatically extract widget dependencies by analyzing position functions.
 * Runs each widget's position function with a mock resolver that tracks getWidgetRect calls.
 */
const extractWidgetDependencies = (widgetConfigs: WidgetConfig[]): Record<string, Set<string>> => {
    const dependencyMap: Record<string, Set<string>> = {};
    const widgetIds = widgetConfigs.map((w) => w.id);

    // Initialize all widgets with empty dependency sets
    for (const id of widgetIds) {
        dependencyMap[id] = new Set();
    }

    // For each widget, run its position function with a tracking resolver
    for (const config of widgetConfigs) {
        const trackedDeps: string[] = [];

        const mockResolver: PositionResolver = {
            getWidgetRect: (id: string) => {
                trackedDeps.push(id);
                // Return a mock rect - the actual values don't matter for dependency detection
                return { x: 0, y: 0, width: 100, height: 100, right: 100, bottom: 100 };
            },
            getWidgetCurrentRect: (id: string) => {
                trackedDeps.push(id);
                return { x: 0, y: 0, width: 100, height: 100, right: 100, bottom: 100 };
            },
            getWidgetSize: () => ({ width: 100, height: 100 }),
            screen: { width: 1920, height: 1080 },
            isWidgetDisabled: () => false,
            hasSignaledReady: false,
        };

        // Create a mock element with all properties that position functions might access
        const mockElement = {
            offsetWidth: 100,
            offsetHeight: 100,
            getBoundingClientRect: () => ({
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
            }),
        } as unknown as HTMLElement;

        try {
            // Run the position function to see which widgets it queries
            config.position(config.id, mockElement, mockResolver);
        } catch (e) {
            // Some position functions might fail with mock data
            // Log for debugging but continue
            console.debug(`Dependency extraction for ${config.id} failed:`, e);
        }

        // Record dependencies - this widget depends on the widgets it queried
        for (const depId of trackedDeps) {
            if (depId !== config.id) {
                dependencyMap[config.id].add(depId);
            }
        }
    }

    return dependencyMap;
};

/**
 * Build a reverse dependency map: which widgets depend ON a given widget.
 * Also includes transitive dependencies (if A depends on B, and B depends on C,
 * then C's dependents include both A and B).
 */
const buildReverseDependencyMap = (
    directDeps: Record<string, Set<string>>,
    widgetConfigs: WidgetConfig[]
): Record<string, string[]> => {
    const reverseMap: Record<string, Set<string>> = {};
    const widgetIds = widgetConfigs.map((w) => w.id);
    const widgetOrder = new Map(widgetIds.map((id, idx) => [id, idx]));

    // Initialize
    for (const id of widgetIds) {
        reverseMap[id] = new Set();
    }

    // Build direct reverse dependencies
    for (const [widgetId, deps] of Object.entries(directDeps)) {
        for (const depId of deps) {
            if (reverseMap[depId]) {
                reverseMap[depId].add(widgetId);
            }
        }
    }

    // Expand to include transitive dependencies
    // If minimap -> location -> something, then minimap's dependents should include location's dependents
    let changed = true;
    while (changed) {
        changed = false;
        for (const [anchorId, dependents] of Object.entries(reverseMap)) {
            const currentSize = dependents.size;
            const toAdd: string[] = [];

            for (const depId of dependents) {
                // This dependent's dependents are also affected by the anchor
                for (const transitiveDep of reverseMap[depId] || []) {
                    if (!dependents.has(transitiveDep) && transitiveDep !== anchorId) {
                        toAdd.push(transitiveDep);
                    }
                }
            }

            for (const id of toAdd) {
                dependents.add(id);
            }

            if (dependents.size > currentSize) {
                changed = true;
            }
        }
    }

    // Convert to sorted arrays (by widget order for consistent processing)
    const result: Record<string, string[]> = {};
    for (const [id, deps] of Object.entries(reverseMap)) {
        result[id] = Array.from(deps).sort((a, b) => (widgetOrder.get(a) ?? 0) - (widgetOrder.get(b) ?? 0));
    }

    return result;
};

// Store default widget configs for position resolution
const defaultWidgetConfigs = getDefaultWidgets();

// Build the dependency maps once at module load
const directDependencies = extractWidgetDependencies(defaultWidgetConfigs);
const WIDGET_DEPENDENCIES = buildReverseDependencyMap(directDependencies, defaultWidgetConfigs);

// Get dynamic default state based on current screen size
const getDefaultState = (): HUDLayoutState => ({
    widgets: defaultWidgetConfigs.map((w) => ({
        id: w.id,
        type: w.type,
        position: { x: 0, y: 0 }, // Initial position before distribution
        visible: w.visible,
        scale: w.scale,
    })),
    editMode: false,
    snapToGrid: true,
    gridSize: 10,
    statusDesign: "circular",
    speedometerType: "car",
    minimapShape: "square",
    widgetsDistributed: false,
    simpleMode: true,
});

const STORAGE_KEY = "hud-layout";

const clampPosition = (pos: WidgetPosition): WidgetPosition => {
    return {
        x: Math.max(0, Math.min(window.innerWidth, pos.x)),
        y: Math.max(0, Math.min(window.innerHeight, pos.y)),
    };
};

const clampAllWidgets = (widgets: ResolvedWidgetConfig[]): ResolvedWidgetConfig[] =>
    widgets.map((w) => ({
        ...w,
        position: clampPosition(w.position),
    }));

const normalizeState = (raw: Partial<HUDLayoutState>): HUDLayoutState => {
    const defaultState = getDefaultState();
    const next: HUDLayoutState = {
        ...defaultState,
        ...raw,
    };

    // Merge saved widgets with default widgets (add new widgets that don't exist in saved state)
    const savedWidgetIds = new Set((raw.widgets ?? []).map((w) => w.id));
    const mergedWidgets = [
        ...(raw.widgets ?? []),
        // Add any new widgets from default config that weren't in saved state
        ...defaultState.widgets.filter((w) => !savedWidgetIds.has(w.id)),
    ];

    next.widgets = clampAllWidgets(mergedWidgets);
    next.minimapShape = next.minimapShape ?? "square";
    next.widgetsDistributed = next.widgetsDistributed ?? false;

    return next;
};

export const useHUDLayout = () => {
    const [state, setState] = useState<HUDLayoutState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { editMode, widgetsDistributed, ...data } = JSON.parse(saved);
                // If we have saved positions, mark as already distributed
                const normalized = normalizeState(data);
                return { ...normalized, widgetsDistributed: true };
            } catch {
                return normalizeState(getDefaultState());
            }
        }
        return normalizeState(getDefaultState());
    });

    useEffect(() => {
        const { editMode, ...data } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [state]);

    // Distribute widgets using the resolver - computes all default positions in order
    const distributeWidgets = useCallback((isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => {
        const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, isWidgetDisabled, hasSignaledReady);

        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => {
                const rect = resolvedRects.get(w.id);
                return {
                    ...w,
                    position: rect ? clampPosition({ x: rect.x, y: rect.y }) : w.position,
                };
            }),
            widgetsDistributed: true,
        }));
    }, []);

    const toggleEditMode = useCallback(() => {
        setState((prev) => ({ ...prev, editMode: !prev.editMode }));
    }, []);

    const setSnapToGrid = useCallback((snap: boolean) => {
        setState((prev) => ({ ...prev, snapToGrid: snap }));
    }, []);

    const updateWidgetPosition = useCallback((id: string, position: WidgetPosition) => {
        const clampedPosition = clampPosition(position);
        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => (w.id === id ? { ...w, position: clampedPosition } : w)),
        }));
    }, []);

    const updateWidgetScale = useCallback((id: string, scale: number) => {
        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => (w.id === id ? { ...w, scale } : w)),
        }));
    }, []);

    const toggleWidgetVisibility = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
        }));
    }, []);

    const [autoLayoutHiddenIds, setAutoLayoutHiddenIds] = useState<string[]>([]);
    const lastDefaultRectsRef = useRef<Map<string, WidgetRect> | null>(null);

    const isPositionClose = useCallback((a: WidgetPosition, b: WidgetPosition) => {
        return Math.abs(a.x - b.x) <= POSITION_TOLERANCE && Math.abs(a.y - b.y) <= POSITION_TOLERANCE;
    }, []);

    const captureDefaultRects = useCallback(
        (isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => {
            lastDefaultRectsRef.current = resolveDefaultPositions(
                defaultWidgetConfigs,
                isWidgetDisabled,
                hasSignaledReady
            );
        },
        []
    );

    /**
     * Auto-relayout: only move widgets that are still at their *previous* default position.
     * This matches your requirement: do not touch widgets the user manually moved.
     */
    const runAutoRelayout = useCallback(
        (affectedWidgetIds: string[], isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => {
            // Ensure we have the "before" snapshot
            const oldRects = lastDefaultRectsRef.current;
            if (!oldRects) return;

            // Wait for DOM to update with new sizes, then compute new defaults
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const newRects = resolveDefaultPositions(defaultWidgetConfigs, isWidgetDisabled, hasSignaledReady);

                    setState((prev) => ({
                        ...prev,
                        widgets: prev.widgets.map((w) => {
                            if (!affectedWidgetIds.includes(w.id)) return w;

                            const oldRect = oldRects.get(w.id);
                            const newRect = newRects.get(w.id);
                            if (!oldRect || !newRect) return w;

                            // Only move if it was at the old default position
                            if (isPositionClose(w.position, { x: oldRect.x, y: oldRect.y })) {
                                return {
                                    ...w,
                                    position: clampPosition({ x: newRect.x, y: newRect.y }),
                                };
                            }

                            return w;
                        }),
                    }));

                    // Unhide after positions have been updated
                    setAutoLayoutHiddenIds([]);
                });
            });
        },
        [isPositionClose]
    );

    /**
     * Determine which widgets will actually be moved (are at their default position).
     * Only those should be hidden during auto-relayout.
     */
    const getWidgetsToMove = useCallback(
        (affectedWidgetIds: string[], oldRects: Map<string, WidgetRect>): string[] => {
            return state.widgets
                .filter((w) => {
                    if (!affectedWidgetIds.includes(w.id)) return false;
                    const oldRect = oldRects.get(w.id);
                    if (!oldRect) return false;
                    // Only include if at old default position
                    return isPositionClose(w.position, { x: oldRect.x, y: oldRect.y });
                })
                .map((w) => w.id);
        },
        [state.widgets, isPositionClose]
    );

    const startAutoRelayout = useCallback(
        (affectedWidgetIds: string[], isWidgetDisabled?: (id: string) => boolean) => {
            const uniq = Array.from(new Set(affectedWidgetIds));
            captureDefaultRects(isWidgetDisabled);

            // Only hide widgets that are actually at their default position (will be moved)
            const oldRects = lastDefaultRectsRef.current;
            if (oldRects) {
                const toHide = getWidgetsToMove(uniq, oldRects);
                setAutoLayoutHiddenIds(toHide);
            }

            return uniq;
        },
        [captureDefaultRects, getWidgetsToMove]
    );

    const setStatusDesign = useCallback(
        (design: StatusDesign, isWidgetDisabled?: (id: string) => boolean) => {
            //We also want to refresh the health element, as it's gonna change
            const affected = startAutoRelayout([...WIDGET_DEPENDENCIES["health"], "health"], isWidgetDisabled);

            setState((prev) => ({ ...prev, statusDesign: design }));

            // After render, compute new defaults and apply (without flicker: widgets are hidden during this)
            runAutoRelayout(affected, isWidgetDisabled);
        },
        [runAutoRelayout, startAutoRelayout]
    );

    const setSpeedometerType = useCallback((type: SpeedometerType) => {
        setState((prev) => ({ ...prev, speedometerType: type }));
    }, []);

    const setMinimapShape = useCallback(
        (shape: MinimapShape, isWidgetDisabled?: (id: string) => boolean) => {
            const affected = startAutoRelayout(WIDGET_DEPENDENCIES["minimap"] || [], isWidgetDisabled);

            setState((prev) => ({ ...prev, minimapShape: shape }));
            sendNuiCallback("onMinimapShapeChange", { shape });

            runAutoRelayout(affected, isWidgetDisabled);
        },
        [runAutoRelayout, startAutoRelayout]
    );

    const resetLayout = useCallback(
        (force: boolean, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => {
            const defaultState = getDefaultState();

            if (force) {
                setSpeedometerType(defaultState.speedometerType);
                setMinimapShape(defaultState.minimapShape);
                setStatusDesign(defaultState.statusDesign);
            } else {
                defaultState.speedometerType = state.speedometerType ?? defaultState.speedometerType;
                defaultState.minimapShape = state.minimapShape ?? defaultState.minimapShape;
                defaultState.statusDesign = state.statusDesign ?? defaultState.statusDesign;
            }

            requestAnimationFrame(() => {
                const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, isWidgetDisabled, false);

                const resetWidgets = defaultWidgetConfigs.map((w) => {
                    const rect = resolvedRects.get(w.id);
                    return {
                        id: w.id,
                        type: w.type,
                        position: rect ? clampPosition({ x: rect.x, y: rect.y }) : { x: 0, y: 0 },
                        visible: w.visible,
                        scale: w.scale ?? 1,
                    };
                });

                setState((prev) => ({
                    ...defaultState,
                    widgets: resetWidgets,
                    editMode: true,
                    snapToGrid: prev.snapToGrid,
                    widgetsDistributed: true,
                }));
            });
        },
        [setMinimapShape, setStatusDesign, setSpeedometerType, state]
    );

    const resetWidget = useCallback(
        (id: string, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => {
            const defaultWidget = defaultWidgetConfigs.find((w) => w.id === id);
            if (!defaultWidget) return;

            // getWidgetCurrentRect in the position functions will automatically
            // get the current DOM position of anchor widgets like heli-base
            const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, isWidgetDisabled, hasSignaledReady);
            const rect = resolvedRects.get(id);

            setState((prev) => ({
                ...prev,
                widgets: prev.widgets.map((w) =>
                    w.id === id
                        ? {
                              ...w,
                              position: rect ? clampPosition({ x: rect.x, y: rect.y }) : w.position,
                              scale: defaultWidget.scale ?? 1,
                              visible: defaultWidget.visible,
                          }
                        : w
                ),
            }));
        },
        []
    );

    const getWidget = useCallback(
        (id: string): ResolvedWidgetConfig | undefined => {
            return state.widgets.find((w) => w.id === id);
        },
        [state.widgets]
    );

    const setSimpleMode = useCallback((enabled: boolean) => {
        setState((prev) => ({ ...prev, simpleMode: enabled }));
    }, []);

    return {
        ...state,
        autoLayoutHiddenIds,
        toggleEditMode,
        setSnapToGrid,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        setStatusDesign,
        setSpeedometerType,
        setMinimapShape,
        setSimpleMode,
        resetLayout,
        resetWidget,
        getWidget,
        distributeWidgets,
    };
};
