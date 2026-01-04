import { useState, useCallback, useEffect } from "react";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    HUDLayoutState,
    WidgetConfig,
    ResolvedWidgetConfig,
    WidgetPosition,
    StatusDesign,
    SpeedometerType,
    SpeedometerConfig,
    SpeedometerConfigs,
    SpeedometerConfigsInput,
    MinimapShape,
    getDefaultWidgets,
    getDefaultSpeedometerConfigs,
    getDefaultSpeedometerConfigsInput,
} from "@/types/widget";

// Store default widget configs for position resolution
const defaultWidgetConfigs = getDefaultWidgets();
const defaultSpeedometerConfigsInput = getDefaultSpeedometerConfigsInput();

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
    speedometerConfigs: getDefaultSpeedometerConfigs(),
    minimapShape: "square",
    widgetsDistributed: false,
});

const STORAGE_KEY = "hud-layout";

const clampPosition = (pos: WidgetPosition): WidgetPosition => ({
    x: Math.max(0, Math.min(window.innerWidth, pos.x)),
    y: Math.max(0, Math.min(window.innerHeight, pos.y)),
});

const clampAllWidgets = (widgets: ResolvedWidgetConfig[]): ResolvedWidgetConfig[] =>
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

const normalizeState = (raw: Partial<HUDLayoutState>): HUDLayoutState => {
    const defaultState = getDefaultState();
    const next: HUDLayoutState = {
        ...defaultState,
        ...raw,
    };

    next.widgets = clampAllWidgets(next.widgets ?? defaultState.widgets);
    next.speedometerConfigs = clampSpeedometerConfigs(next.speedometerConfigs ?? defaultState.speedometerConfigs);
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

    // Distribute widgets using DOM elements and position functions
    const distributeWidgets = useCallback(() => {
        setState((prev) => {
            const distributedWidgets = prev.widgets.map((w) => {
                const element = document.getElementById(`hud-widget-${w.id}`);
                const defaultConfig = defaultWidgetConfigs.find((d) => d.id === w.id);
                
                if (defaultConfig) {
                    const computedPos = defaultConfig.position(w.id, element);
                    return {
                        ...w,
                        position: clampPosition(computedPos),
                    };
                }
                return w;
            });

            // Also distribute speedometer positions
            const speedoTypes: SpeedometerType[] = ["car", "plane", "boat", "helicopter", "motorcycle", "bicycle"];
            const distributedSpeedoConfigs = { ...prev.speedometerConfigs };
            
            speedoTypes.forEach((type) => {
                const element = document.getElementById(`hud-widget-speedometer-${type}`);
                const defaultInput = defaultSpeedometerConfigsInput[type];
                const computedPos = defaultInput.position(type, element);
                distributedSpeedoConfigs[type] = {
                    ...distributedSpeedoConfigs[type],
                    position: clampPosition(computedPos),
                };
            });

            return {
                ...prev,
                widgets: distributedWidgets,
                speedometerConfigs: distributedSpeedoConfigs,
                widgetsDistributed: true,
            };
        });
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
            const element = document.getElementById(`hud-widget-speedometer-${type}`);
            const defaultInput = defaultSpeedometerConfigsInput[type];
            const computedPos = defaultInput.position(type, element);
            
            return {
                ...prev,
                speedometerConfigs: {
                    ...prev.speedometerConfigs,
                    [type]: { position: clampPosition(computedPos), scale: 1 },
                },
            };
        });
    }, []);

    const resetLayout = useCallback(() => {
        // Reset to default positions using position functions
        const resetWidgets = defaultWidgetConfigs.map((w) => {
            const element = document.getElementById(`hud-widget-${w.id}`);
            const computedPos = w.position(w.id, element);
            return {
                id: w.id,
                type: w.type,
                position: clampPosition(computedPos),
                visible: w.visible,
                scale: w.scale ?? 1,
            };
        });

        // Reset speedometer configs using position functions
        const speedoTypes: SpeedometerType[] = ["car", "plane", "boat", "helicopter", "motorcycle", "bicycle"];
        const resetSpeedoConfigs: SpeedometerConfigs = {} as SpeedometerConfigs;
        
        speedoTypes.forEach((type) => {
            const element = document.getElementById(`hud-widget-speedometer-${type}`);
            const defaultInput = defaultSpeedometerConfigsInput[type];
            const computedPos = defaultInput.position(type, element);
            resetSpeedoConfigs[type] = { position: clampPosition(computedPos), scale: 1 };
        });

        setState((prev) => ({
            ...getDefaultState(),
            widgets: resetWidgets,
            speedometerConfigs: resetSpeedoConfigs,
            editMode: true,
            snapToGrid: prev.snapToGrid,
            widgetsDistributed: true,
        }));
    }, []);

    const resetWidget = useCallback((id: string) => {
        const defaultWidget = defaultWidgetConfigs.find((w) => w.id === id);
        if (!defaultWidget) return;

        const element = document.getElementById(`hud-widget-${id}`);
        const computedPos = defaultWidget.position(id, element);

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
        updateSpeedometerConfig,
        getSpeedometerConfig,
        resetSpeedometer,
        resetLayout,
        resetWidget,
        getWidget,
        distributeWidgets,
    };
};
