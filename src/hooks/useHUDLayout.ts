import { useState, useCallback, useEffect } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    WidgetConfig,
    WidgetPosition,
    StatusDesign,
    SpeedometerType,
    SpeedometerConfig,
    SpeedometerConfigs,
    MinimapShape,
    getDefaultWidgets,
    getDefaultSpeedometerConfigs,
} from "@/types/widget";

// Get dynamic default state based on current screen size
const getDefaultState = (): HUDLayoutState => ({
    widgets: getDefaultWidgets(),
    editMode: false,
    snapToGrid: true,
    gridSize: 10,
    statusDesign: "circular",
    hudScale: 1,
    speedometerType: "car",
    speedometerConfigs: getDefaultSpeedometerConfigs(),
    minimapShape: "square",
});

const STORAGE_KEY = "hud-layout";

const clampPosition = (pos: WidgetPosition): WidgetPosition => ({
    x: Math.max(0, Math.min(window.innerWidth, pos.x)),
    y: Math.max(0, Math.min(window.innerHeight, pos.y)),
});

const clampAllWidgets = (widgets: WidgetConfig[]): WidgetConfig[] =>
    widgets.map((w) => ({
        ...w,
        position: clampPosition(w.position),
    }));

const clampSpeedometerConfigs = (configs: SpeedometerConfigs): SpeedometerConfigs => ({
    car: { ...configs.car, position: clampPosition(configs.car.position) },
    plane: { ...configs.plane, position: clampPosition(configs.plane.position) },
    boat: { ...configs.boat, position: clampPosition(configs.boat.position) },
    helicopter: { ...configs.helicopter, position: clampPosition(configs.helicopter.position) },
    motorcycle: { ...configs.motorcycle, position: clampPosition(configs.motorcycle.position) },
    bicycle: { ...configs.bicycle, position: clampPosition(configs.bicycle.position) },
});

const normalizeState = (raw: HUDLayoutState): HUDLayoutState => {
    const defaultState = getDefaultState();
    const next: HUDLayoutState = {
        ...defaultState,
        ...raw,
    };

    next.widgets = clampAllWidgets(next.widgets ?? defaultState.widgets);

    next.speedometerConfigs = clampSpeedometerConfigs(next.speedometerConfigs ?? defaultState.speedometerConfigs);

    next.minimapShape = next.minimapShape ?? "square";

    return next;
};

export const useHUDLayout = () => {
    const [state, setState] = useState<HUDLayoutState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const { editMode, ...data } = JSON.parse(saved);
                return normalizeState(data);
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

    const toggleEditMode = useCallback(() => {
        setState((prev) => ({ ...prev, editMode: !prev.editMode }));
    }, []);

    const setSnapToGrid = useCallback((snap: boolean) => {
        setState((prev) => ({ ...prev, snapToGrid: snap }));
    }, []);

    const updateWidgetPosition = useCallback((id: string, position: WidgetPosition) => {
        // Clamp to current viewport
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
        // Notify Lua about shape change
        sendNuiCallback("onMinimapShapeChange", { shape });
    }, []);

    const updateSpeedometerConfig = useCallback((type: SpeedometerType, config: Partial<SpeedometerConfig>) => {
        setState((prev) => ({
            ...prev,
            speedometerConfigs: {
                ...prev.speedometerConfigs,
                [type]: { ...prev.speedometerConfigs[type], ...config },
            },
        }));
    }, []);

    const getSpeedometerConfig = useCallback(
        (type: SpeedometerType): SpeedometerConfig => {
            const defaultConfigs = getDefaultSpeedometerConfigs();
            return state.speedometerConfigs?.[type] ?? defaultConfigs[type];
        },
        [state.speedometerConfigs]
    );

    const resetSpeedometer = useCallback((type: SpeedometerType) => {
        setState((prev) => {
            const defaultConfig = getDefaultSpeedometerConfigs()[type];
            return {
                ...prev,
                speedometerConfigs: {
                    ...prev.speedometerConfigs,
                    [type]: { position: defaultConfig.position, scale: 1 },
                },
            };
        });
    }, []);

    const resetLayout = useCallback(() => {
        setState((prev) => ({
            ...getDefaultState(),
            editMode: true,
            snapToGrid: prev.snapToGrid,
        }));
    }, []);

    const resetWidget = useCallback((id: string) => {
        const defaultWidgets = getDefaultWidgets();
        const defaultWidget = defaultWidgets.find((w) => w.id === id);
        if (!defaultWidget) return;

        setState((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) =>
                w.id === id ? { ...w, position: defaultWidget.position, scale: defaultWidget.scale ?? 1 } : w
            ),
        }));
    }, []);

    const getWidget = useCallback(
        (id: string): WidgetConfig | undefined => {
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
        updateSpeedometerConfig,
        getSpeedometerConfig,
        resetSpeedometer,
        resetLayout,
        resetWidget,
        getWidget,
    };
};
