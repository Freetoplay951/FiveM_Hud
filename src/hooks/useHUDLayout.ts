import { useState, useCallback, useEffect } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    ResolvedWidgetConfig,
    WidgetPosition,
    StatusDesign,
    SpeedometerType,
    MinimapShape,
    getDefaultWidgets,
} from "@/types/widget";
import { resolveDefaultPositions } from "@/lib/widgetPositionResolver";
import { StatusWidgetFlags } from "@/types/hud";

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

    // Distribute widgets using the resolver - computes all default positions in order
    const distributeWidgets = useCallback((context?: StatusWidgetFlags) => {
        const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, context);

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

    const resetLayout = useCallback((context?: StatusWidgetFlags) => {
        const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, context);

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
            ...getDefaultState(),
            widgets: resetWidgets,
            editMode: true,
            snapToGrid: prev.snapToGrid,
            widgetsDistributed: true,
        }));
    }, []);

    const resetWidget = useCallback((id: string, context?: StatusWidgetFlags) => {
        const defaultWidget = defaultWidgetConfigs.find((w) => w.id === id);
        if (!defaultWidget) return;

        const resolvedRects = resolveDefaultPositions(defaultWidgetConfigs, context);
        const rect = resolvedRects.get(id);

        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) =>
                w.id === id
                    ? {
                          ...w,
                          position: rect ? clampPosition({ x: rect.x, y: rect.y }) : w.position,
                          scale: defaultWidget.scale ?? 1,
                      }
                    : w
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
