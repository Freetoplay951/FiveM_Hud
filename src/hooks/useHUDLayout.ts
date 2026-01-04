import { useState, useCallback, useEffect } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    WidgetConfig,
    ResolvedWidgetConfig,
    WidgetPosition,
    WidgetPositionContext,
    StatusDesign,
    SpeedometerType,
    MinimapShape,
    getDefaultWidgets,
} from "@/types/widget";

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
    statusDesign: "circular",
    hudScale: 1,
    speedometerType: "car",
    minimapShape: "square",
    widgetsDistributed: false,
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

    next.widgets = clampAllWidgets(next.widgets ?? defaultState.widgets);
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

    // Distribute widgets using DOM elements and position functions.
    // Runs multiple passes so dependent widgets can read updated getBoundingClientRect() values.
    const distributeWidgets = useCallback((context?: WidgetPositionContext) => {
        const MAX_PASSES = 3;

        const runPass = () => {
            const newPositions: Record<string, WidgetPosition> = {};

            for (const w of defaultWidgetConfigs) {
                const element = document.getElementById(`hud-widget-${w.id}`);
                const computedPos = w.position(w.id, element, context);
                const clamped = clampPosition(computedPos);
                newPositions[w.id] = clamped;

                // Immediately update DOM so next widgets see correct rect
                if (element) {
                    element.style.left = `${clamped.x}px`;
                    element.style.top = `${clamped.y}px`;
                }
            }

            return newPositions;
        };

        // Run multiple passes to stabilize positions
        let finalPositions: Record<string, WidgetPosition> = {};
        for (let pass = 0; pass < MAX_PASSES; pass++) {
            finalPositions = runPass();
        }

        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) => ({
                ...w,
                position: finalPositions[w.id] ?? w.position,
            })),
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

    const setStatusDesign = useCallback((design: StatusDesign) => {
        setState((prev) => ({ ...prev, statusDesign: design }));
    }, []);

    const setHudScale = useCallback((scale: number) => {
        setState((prev) => ({ ...prev, hudScale: scale }));
    }, []);

    const setSpeedometerType = useCallback((type: SpeedometerType) => {
        setState((prev) => ({ ...prev, speedometerType: type }));
    }, []);

    const setMinimapShape = useCallback((shape: MinimapShape) => {
        setState((prev) => ({ ...prev, minimapShape: shape }));
        sendNuiCallback("onMinimapShapeChange", { shape });
    }, []);

    const resetLayout = useCallback((context?: WidgetPositionContext) => {
        // Reset to default positions using position functions
        const resetWidgets = defaultWidgetConfigs.map((w) => {
            const element = document.getElementById(`hud-widget-${w.id}`);
            const computedPos = w.position(w.id, element, context);
            return {
                id: w.id,
                type: w.type,
                position: clampPosition(computedPos),
                visible: w.visible,
                scale: w.scale ?? 1,
            };
        });

        setState((prev) => ({
            ...getDefaultState(),
            widgets: resetWidgets,
            editMode: true,
            snapToGrid: prev.snapToGrid,
            widgetsDistributed: true,
        }));
    }, []);

    const resetWidget = useCallback((id: string, context?: WidgetPositionContext) => {
        const defaultWidget = defaultWidgetConfigs.find((w) => w.id === id);
        if (!defaultWidget) return;

        const element = document.getElementById(`hud-widget-${id}`);
        const computedPos = defaultWidget.position(id, element, context);

        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) =>
                w.id === id ? { ...w, position: clampPosition(computedPos), scale: defaultWidget.scale ?? 1 } : w
            ),
        }));
    }, []);

    const getWidget = useCallback(
        (id: string): ResolvedWidgetConfig | undefined => {
            return state.widgets.find((w) => w.id === id);
        },
        [state.widgets]
    );

    return {
        ...state,
        toggleEditMode,
        setSnapToGrid,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        setStatusDesign,
        setHudScale,
        setSpeedometerType,
        setMinimapShape,
        resetLayout,
        resetWidget,
        getWidget,
        distributeWidgets,
    };
};
