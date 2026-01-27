import { useState, useCallback, useEffect, useRef } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    ResolvedWidgetConfig,
    WidgetPosition,
    StatusDesign,
    SpeedometerType,
    MinimapShape,
    BrandingPosition,
    getDefaultWidgets,
} from "@/types/widget";
import { resolveDefaultPositions, WidgetRect } from "@/lib/widgetPositionResolver";
import { DEFAULT_LAYOUT_OPTIONS, LayoutOptions, WidgetDisabledChecker } from "@/lib/widgetConfig";
import { mapPartialState } from "@/lib/utils";
import { buildAffectedWidgetGraph, buildCurrentRects, computeRelayoutPositions } from "@/lib/relayoutUtils";
import { clampToViewport, updateWidgetInArray } from "@/lib/widgetHelpers";

import { useVehicleStore } from "@/stores/vehicleStore";
import { useUtilityStore } from "@/stores/utilityStore";

// Store default widget configs for position resolution
const defaultWidgetConfigs = getDefaultWidgets();

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
    speedometerType: "car",
    widgetsDistributed: false,
    simpleMode: true,
    brandingPosition: DEFAULT_LAYOUT_OPTIONS.brandingPosition,
    minimapShape: DEFAULT_LAYOUT_OPTIONS.minimapShape,
    statusDesign: DEFAULT_LAYOUT_OPTIONS.statusDesign,
});

const STORAGE_KEY = "hud-layout";

const clampAllWidgets = (widgets: ResolvedWidgetConfig[]): ResolvedWidgetConfig[] =>
    widgets.map((w) => ({
        ...w,
        position: clampToViewport(w.position),
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
    next.brandingPosition = next.brandingPosition ?? "center";
    next.widgetsDistributed = next.widgetsDistributed ?? false;

    return next;
};

export const useHUDLayout = () => {
    const [state, setState] = useState<HUDLayoutState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);

        let initialState: HUDLayoutState;
        if (saved) {
            try {
                const { editMode, widgetsDistributed, ...data } = JSON.parse(saved);
                // If we have saved positions, mark as already distributed
                const normalized = normalizeState(data);
                initialState = { ...normalized, widgetsDistributed: true };
            } catch {
                initialState = normalizeState(getDefaultState());
            }
        } else {
            initialState = normalizeState(getDefaultState());
        }

        sendNuiCallback("onMinimapShapeChange", { shape: initialState.minimapShape });

        return initialState;
    });

    useEffect(() => {
        const { editMode, ...data } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [state]);

    const getLayoutOptions = useCallback(
        (override?: Partial<LayoutOptions>): LayoutOptions => {
            const vehicleState = useVehicleStore.getState();
            const utilityState = useUtilityStore.getState();

            const original: LayoutOptions = {
                brandingPosition: state.brandingPosition,
                minimapShape: state.minimapShape,
                statusDesign: state.statusDesign,
                isEditMode: state.editMode,
                inVehicle: vehicleState.inVehicle,
                locationOnlyInVehicle: utilityState.locationOnlyInVehicle,
                minimapOnlyInVehicle: utilityState.minimapOnlyInVehicle,
            };

            return mapPartialState(original, override ?? {});
        },
        [state.brandingPosition, state.minimapShape, state.statusDesign, state.editMode],
    );

    // Distribute widgets using the resolver - computes all default positions in order
    const distributeWidgets = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean) => {
            setState((prev) => {
                const resolvedRects = resolveDefaultPositions(
                    defaultWidgetConfigs,
                    isWidgetDisabled,
                    hasSignaledReady,
                    getLayoutOptions(prev),
                );

                return {
                    ...prev,
                    widgets: prev.widgets.map((w) => {
                        const rect = resolvedRects.get(w.id);
                        return {
                            ...w,
                            position: rect ? clampToViewport({ x: rect.x, y: rect.y }) : w.position,
                        };
                    }),
                    widgetsDistributed: true,
                };
            });
        },
        [getLayoutOptions],
    );

    const toggleEditMode = useCallback(() => {
        setState((prev) => ({ ...prev, editMode: !prev.editMode }));
    }, []);

    const setSnapToGrid = useCallback((snap: boolean) => {
        setState((prev) => ({ ...prev, snapToGrid: snap }));
    }, []);

    const updateWidgetPosition = useCallback((id: string, position: WidgetPosition) => {
        const clampedPosition = clampToViewport(position);
        setState((prev) => ({
            ...prev,
            widgets: updateWidgetInArray(prev.widgets, id, { position: clampedPosition }),
        }));
    }, []);

    const updateWidgetScale = useCallback((id: string, scale: number) => {
        setState((prev) => ({
            ...prev,
            widgets: updateWidgetInArray(prev.widgets, id, { scale }),
        }));
    }, []);

    const toggleWidgetVisibility = useCallback((id: string) => {
        setState((prev) => {
            const widget = prev.widgets.find((w) => w.id === id);
            if (!widget) return prev;
            return {
                ...prev,
                widgets: updateWidgetInArray(prev.widgets, id, { visible: !widget.visible }),
            };
        });
    }, []);

    const [autoLayoutHiddenIds, setAutoLayoutHiddenIds] = useState<string[]>([]);
    const lastDefaultRectsRef = useRef<Map<string, WidgetRect> | null>(null);

    const captureDefaultRects = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean, override?: Partial<LayoutOptions>) => {
            lastDefaultRectsRef.current = resolveDefaultPositions(
                defaultWidgetConfigs,
                isWidgetDisabled,
                hasSignaledReady,
                getLayoutOptions(override),
            );
        },
        [getLayoutOptions],
    );

    /**
     * Helper to resolve default widget positions with current layout options.
     * Reduces duplication of resolveDefaultPositions calls.
     */
    const resolveWidgetRects = useCallback(
        (
            isWidgetDisabled?: WidgetDisabledChecker,
            hasSignaledReady?: boolean,
            layoutOverride?: Partial<LayoutOptions>,
        ) => {
            return resolveDefaultPositions(
                defaultWidgetConfigs,
                isWidgetDisabled,
                hasSignaledReady,
                getLayoutOptions(layoutOverride),
            );
        },
        [getLayoutOptions],
    );

    /**
     * Runs the auto-relayout process after a state change has occurred.
     *
     * **IMPORTANT: This function MUST be called AFTER the state change that affects widget positions.**
     *
     * The function uses a recursive approach to move widgets:
     * 1. Category A: Widgets at their default position → moved to new default
     * 2. Category B/C: Widgets near affected widgets → moved by the same vector (recursively)
     * 3. External: Widgets near moved widgets after relayout → pulled along
     */
    const runAutoRelayout = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean) => {
            // Ensure we have the "before" snapshot
            const oldRects = lastDefaultRectsRef.current;
            if (!oldRects) return;

            // Wait for DOM to update with new sizes, then compute new defaults
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setState((prev) => {
                        // Compute new default positions
                        const newRects = resolveWidgetRects(isWidgetDisabled, hasSignaledReady, prev);

                        // Use the new high-level function to compute all position changes
                        const newPositions = computeRelayoutPositions({
                            widgets: prev.widgets,
                            oldDefaultRects: oldRects,
                            newDefaultRects: newRects,
                            gridSize: prev.gridSize,
                        });

                        // CRITICAL: Update lastDefaultRectsRef for subsequent relayouts
                        lastDefaultRectsRef.current = newRects;

                        return {
                            ...prev,
                            widgets: prev.widgets.map((w) => {
                                const newPos = newPositions.get(w.id);
                                return newPos ? { ...w, position: clampToViewport(newPos) } : w;
                            }),
                        };
                    });

                    // Unhide after positions have been updated
                    setAutoLayoutHiddenIds([]);
                });
            });
        },
        [resolveWidgetRects],
    );

    /**
     * Determine which widgets will actually be moved (are at their default position or nearby).
     * Uses the same graph-building logic as runAutoRelayout for consistency.
     */
    const getWidgetsToMove = useCallback(
        (oldRects: Map<string, WidgetRect>): string[] => {
            const currentRects = buildCurrentRects(state.widgets);

            // Build the affected widget graph to find all widgets that will move
            const affectedWidgets = buildAffectedWidgetGraph({
                widgets: state.widgets,
                oldDefaultRects: oldRects,
                newDefaultRects: oldRects, // Use same rects since we just want to know who's affected
                currentRects,
                gridSize: state.gridSize,
                // Prediction for hiding: we want the full affected set even before we know the true vectors
                allowStaticSources: true,
            });

            return Array.from(affectedWidgets.keys());
        },
        [state.widgets, state.gridSize],
    );

    /**
     * Prepares for an auto-relayout by capturing current default positions.
     *
     * **IMPORTANT: This function MUST be called BEFORE the state change that affects widget positions.**
     *
     * This function:
     * 1. Captures the current default positions of all widgets
     * 2. Hides widgets that will be moved to prevent visual flickering
     *
     * @example
     * ```ts
     * startAutoRelayout(["minimap", "status"], isWidgetDisabled); // BEFORE state change
     * setState((prev) => ({ ...prev, minimapShape: "square" })); // State change
     * runAutoRelayout(isWidgetDisabled);
     * ```
     *
     * @param affectedWidgetIds - IDs of widgets that might need repositioning
     * @param isWidgetDisabled - Optional function to check if a widget is disabled
     */
    const startAutoRelayout = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker, override?: Partial<LayoutOptions>) => {
            captureDefaultRects(isWidgetDisabled, undefined, override);

            // Only hide widgets that are actually at their default position (will be moved)
            const oldRects = lastDefaultRectsRef.current;
            if (oldRects) {
                const toHide = getWidgetsToMove(oldRects);
                setAutoLayoutHiddenIds(toHide);
            }
        },
        [captureDefaultRects, getWidgetsToMove],
    );

    const setStatusDesign = useCallback(
        (design: StatusDesign, isWidgetDisabled?: WidgetDisabledChecker) => {
            // Capture current positions before state change
            startAutoRelayout(isWidgetDisabled);

            setState((prev) => ({ ...prev, statusDesign: design }));

            // After render, compute new defaults and apply (without flicker: widgets are hidden during this)
            runAutoRelayout(isWidgetDisabled);
        },
        [runAutoRelayout, startAutoRelayout],
    );

    const setSpeedometerType = useCallback((type: SpeedometerType) => {
        setState((prev) => ({ ...prev, speedometerType: type }));
    }, []);

    const setMinimapShape = useCallback(
        (shape: MinimapShape, isWidgetDisabled?: WidgetDisabledChecker) => {
            startAutoRelayout(isWidgetDisabled);

            setState((prev) => ({ ...prev, minimapShape: shape }));
            sendNuiCallback("onMinimapShapeChange", { shape });

            runAutoRelayout(isWidgetDisabled);
        },
        [runAutoRelayout, startAutoRelayout],
    );

    const setBrandingPosition = useCallback(
        (position: BrandingPosition, isWidgetDisabled?: WidgetDisabledChecker) => {
            startAutoRelayout(isWidgetDisabled);

            setState((prev) => ({ ...prev, brandingPosition: position }));

            runAutoRelayout(isWidgetDisabled);
        },
        [runAutoRelayout, startAutoRelayout],
    );

    const startMinimapRelayout = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker, override?: Partial<LayoutOptions>) => {
            startAutoRelayout(isWidgetDisabled, override);
        },
        [startAutoRelayout],
    );

    const runMinimapRelayout = useCallback(
        (isWidgetDisabled?: WidgetDisabledChecker) => {
            runAutoRelayout(isWidgetDisabled);
        },
        [runAutoRelayout],
    );

    const resetLayout = useCallback(
        (force: boolean, isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean) => {
            const defaultState = getDefaultState();

            if (force) {
                setSpeedometerType(defaultState.speedometerType);
                setMinimapShape(defaultState.minimapShape);
                setStatusDesign(defaultState.statusDesign);
                setBrandingPosition(defaultState.brandingPosition);
            } else {
                defaultState.speedometerType = state.speedometerType ?? defaultState.speedometerType;
                defaultState.minimapShape = state.minimapShape ?? defaultState.minimapShape;
                defaultState.statusDesign = state.statusDesign ?? defaultState.statusDesign;
                defaultState.brandingPosition = state.brandingPosition ?? defaultState.brandingPosition;
            }

            requestAnimationFrame(() => {
                const resolvedRects = resolveWidgetRects(isWidgetDisabled, false);

                const resetWidgets = defaultWidgetConfigs.map((w) => {
                    const rect = resolvedRects.get(w.id);
                    return {
                        id: w.id,
                        type: w.type,
                        position: rect ? clampToViewport({ x: rect.x, y: rect.y }) : { x: 0, y: 0 },
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
        [setBrandingPosition, setMinimapShape, setStatusDesign, setSpeedometerType, state, resolveWidgetRects],
    );

    /**
     * Resets a widget to its default configuration or keeps its current position
     * depending on whether the HUD has signaled that all widgets are ready.
     *
     * @param {string} id - The ID of the widget to reset.
     * @param {(id: string) => boolean} [isWidgetDisabled] - Optional function to check if a widget is disabled.
     * @param {boolean} [hasSignaledReady] - If true, the widget keeps its current DOM position;
     *                                      otherwise, the default position from configuration is used.
     *
     * @description
     * Finds the default configuration for the widget and updates the state:
     * - `position`: Uses the current DOM position if `hasSignaledReady` is true;
     *               otherwise, computes the default position and clamps it.
     * - `scale`: Uses the scale from default configuration (default 1).
     * - `visible`: Sets to default visibility.
     *
     * Uses `resolveDefaultPositions` internally to compute standard positions for all widgets,
     * taking into account disabled widgets, layout options, and current DOM positions.
     */
    const resetWidget = useCallback(
        (id: string, isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean) => {
            const defaultWidget = defaultWidgetConfigs.find((w) => w.id === id);
            if (!defaultWidget) return;

            setState((prev) => {
                const resolvedRects = resolveWidgetRects(isWidgetDisabled, hasSignaledReady, prev);
                const rect = resolvedRects.get(id);

                return {
                    ...prev,
                    widgets: updateWidgetInArray(prev.widgets, id, {
                        position: rect
                            ? clampToViewport({ x: rect.x, y: rect.y })
                            : (prev.widgets.find((w) => w.id === id)?.position ?? { x: 0, y: 0 }),
                        scale: defaultWidget.scale ?? 1,
                        visible: defaultWidget.visible,
                    }),
                };
            });
        },
        [resolveWidgetRects],
    );

    /**
     * Recalculate a widget's position using the resolver, but keep its current scale/visibility.
     */
    const reflowWidgetPosition = useCallback(
        (id: string, isWidgetDisabled?: WidgetDisabledChecker, hasSignaledReady?: boolean) => {
            setState((prev) => {
                // Build widget configs with current scales from state
                const widgetConfigsWithCurrentScales = defaultWidgetConfigs.map((config) => {
                    const stateWidget = prev.widgets.find((w) => w.id === config.id);
                    return {
                        ...config,
                        scale: stateWidget?.scale ?? config.scale,
                    };
                });

                const resolvedRects = resolveDefaultPositions(
                    widgetConfigsWithCurrentScales,
                    isWidgetDisabled,
                    hasSignaledReady,
                    getLayoutOptions(prev),
                );

                const rect = resolvedRects.get(id);
                if (!rect) return prev;

                return {
                    ...prev,
                    widgets: updateWidgetInArray(prev.widgets, id, {
                        position: clampToViewport({ x: rect.x, y: rect.y }),
                    }),
                };
            });
        },
        [getLayoutOptions],
    );

    const getWidget = useCallback(
        (id: string): ResolvedWidgetConfig | undefined => {
            return state.widgets.find((w) => w.id === id);
        },
        [state.widgets],
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
        setBrandingPosition,
        setSimpleMode,
        resetLayout,
        resetWidget,
        reflowWidgetPosition,
        getWidget,
        distributeWidgets,
        startMinimapRelayout,
        runMinimapRelayout,
    };
};
