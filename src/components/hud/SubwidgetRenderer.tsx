import { useCallback, memo } from "react";
import { HUDWidget } from "./HUDWidget";
import {
    WidgetPosition,
    HELI_SUBWIDGET_TYPES,
    CAR_SUBWIDGET_TYPES,
    PLANE_SUBWIDGET_TYPES,
    BOAT_SUBWIDGET_TYPES,
    MOTORCYCLE_SUBWIDGET_TYPES,
    BICYCLE_SUBWIDGET_TYPES,
    getDefaultWidgets,
    ResolvedWidgetConfig,
} from "@/types/widget";
import {
    HeliBaseWidget,
    HeliKtsWidget,
    HeliAltitudeWidget,
    HeliVSpeedWidget,
    HeliHeadingWidget,
    HeliRotorWidget,
    HeliFuelWidget,
    HeliWarningWidget,
} from "./widgets/vehicles/helicopter";
import { CarBaseWidget, CarWarningWidget, CarFuelWidget } from "./widgets/vehicles/car";
import {
    PlaneBaseWidget,
    PlaneKtsWidget,
    PlaneAltitudeWidget,
    PlaneWarningWidget,
    PlaneHeadingWidget,
    PlaneGearWidget,
    PlaneFlapsWidget,
    PlaneFuelWidget,
} from "./widgets/vehicles/plane";
import { BoatBaseWidget, BoatWarningWidget, BoatFuelWidget } from "./widgets/vehicles/boat";
import { MotorcycleBaseWidget, MotorcycleWarningWidget, MotorcycleFuelWidget } from "./widgets/vehicles/motorcycle";
import { BicycleBaseWidget, BicycleWarningWidget } from "./widgets/vehicles/bicycle";

// Import stores - widgets subscribe to their own data
import { useVehicleStore } from "@/stores/vehicleStore";
import { useIsDead } from "@/stores/deathStore";
import { DEFAULT_LAYOUT_SETTINGS } from "@/lib/widgetConfig";

export interface SubwidgetRendererProps {
    editMode: boolean;
    simpleMode: boolean;
    speedometerType: string;
    snapToGrid: boolean;
    gridSize: number;
    hasSignaledReady: boolean;
    getWidget: (id: string) => ResolvedWidgetConfig | undefined;
    updateWidgetPosition: (id: string, position: WidgetPosition) => void;
    updateWidgetScale: (id: string, scale: number) => void;
    toggleWidgetVisibility: (id: string) => void;
    resetWidget: (id: string, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => void;
    reflowWidgetPosition: (id: string, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => void;
    isWidgetDisabled: (id: string) => boolean;
    getMultiSelectProps: (id: string) => Record<string, unknown>;
}

// Generic Vehicle Subwidget Renderer Factory
const createVehicleSubwidgetRenderer = (
    vehicleType: string,
    subwidgetTypes: readonly string[],
    baseWidgetId: string,
    renderBaseWidget: (visible: boolean) => React.ReactNode,
    renderWidgetContent: (widgetType: string, contentVisible: boolean) => React.ReactNode,
) => {
    return (props: SubwidgetRendererProps) => {
        const {
            editMode,
            simpleMode,
            speedometerType,
            snapToGrid,
            gridSize,
            hasSignaledReady,
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            reflowWidgetPosition,
            isWidgetDisabled,
            getMultiSelectProps,
        } = props;

        // Subscribe to vehicle state from store
        const inVehicle = useVehicleStore((s) => s.inVehicle);
        const currentVehicleType = useVehicleStore((s) => s.vehicleType);
        const isDead = useIsDead();

        const isActive = editMode ? speedometerType === vehicleType : inVehicle && currentVehicleType === vehicleType;

        const handleBasePositionChange = useCallback(
            (id: string, newPosition: WidgetPosition) => {
                if (!simpleMode) {
                    updateWidgetPosition(id, newPosition);
                    return;
                }

                const baseWidget = getWidget(baseWidgetId);
                if (!baseWidget) return;

                const deltaX = newPosition.x - baseWidget.position.x;
                const deltaY = newPosition.y - baseWidget.position.y;

                subwidgetTypes.forEach((subType) => {
                    const subWidget = getWidget(subType);
                    if (subWidget) {
                        updateWidgetPosition(subType, {
                            x: subWidget.position.x + deltaX,
                            y: subWidget.position.y + deltaY,
                        });
                    }
                });
            },
            [simpleMode, getWidget, updateWidgetPosition],
        );

        const handleLiveDrag = useCallback(
            (_id: string, currentPos: WidgetPosition) => {
                if (!simpleMode) return;

                const baseWidget = getWidget(baseWidgetId);
                if (!baseWidget) return;

                const deltaX = currentPos.x - baseWidget.position.x;
                const deltaY = currentPos.y - baseWidget.position.y;

                subwidgetTypes.forEach((subType) => {
                    if (subType === baseWidgetId) return;
                    const subWidget = getWidget(subType);
                    if (subWidget) {
                        const el = document.getElementById(`hud-widget-${subType}`);
                        if (el) {
                            el.style.left = `${subWidget.position.x + deltaX}px`;
                            el.style.top = `${subWidget.position.y + deltaY}px`;
                        }
                    }
                });
            },
            [simpleMode, getWidget],
        );

        const handleBaseScaleChange = useCallback(
            (id: string, newScale: number) => {
                updateWidgetScale(id, newScale);

                if (simpleMode) {
                    subwidgetTypes.forEach((subType) => {
                        if (subType === baseWidgetId) return;
                        updateWidgetScale(subType, newScale);
                    });

                    requestAnimationFrame(() => {
                        subwidgetTypes.forEach((subType) => {
                            if (subType === baseWidgetId) return;
                            reflowWidgetPosition(subType, isWidgetDisabled, hasSignaledReady);
                        });
                    });
                }
            },
            [simpleMode, updateWidgetScale, reflowWidgetPosition, isWidgetDisabled, hasSignaledReady],
        );

        const handleLiveScale = useCallback(
            (_id: string, currentScale: number) => {
                if (!simpleMode) return;

                subwidgetTypes.forEach((subType) => {
                    if (subType === baseWidgetId) return;
                    const el = document.getElementById(`hud-widget-${subType}`);
                    if (el) {
                        el.style.transform = `scale(${Math.round(currentScale * 100) / 100})`;
                    }
                });

                requestAnimationFrame(() => {
                    const defaultWidgets = getDefaultWidgets();
                    const subConfigs = defaultWidgets.filter(
                        (w) => subwidgetTypes.includes(w.id) && w.id !== baseWidgetId,
                    );

                    const resolvedRects = new Map<
                        string,
                        { x: number; y: number; width: number; height: number; right: number; bottom: number }
                    >();

                    const resolver: import("@/lib/widgetPositionResolver").PositionResolver = {
                        getWidgetRect: (id: string) => resolvedRects.get(id) ?? null,
                        getWidgetCurrentRect: (id: string) => {
                            const el = document.getElementById(`hud-widget-${id}`);
                            if (!el) return resolvedRects.get(id) ?? null;
                            const rect = el.getBoundingClientRect();
                            return {
                                x: rect.left,
                                y: rect.top,
                                width: rect.width,
                                height: rect.height,
                                right: rect.right,
                                bottom: rect.bottom,
                            };
                        },
                        getWidgetSize: (id: string) => {
                            const el = document.getElementById(`hud-widget-${id}`);
                            const rect = el?.getBoundingClientRect();
                            return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
                        },
                        screen: { width: window.innerWidth, height: window.innerHeight },
                        isWidgetDisabled: () => false,
                        hasSignaledReady: true,
                        layout: DEFAULT_LAYOUT_SETTINGS,
                    };

                    subConfigs.forEach((config) => {
                        const el = document.getElementById(`hud-widget-${config.id}`);
                        if (!el) return;

                        const scaledRect = el.getBoundingClientRect();
                        const mockElement = {
                            offsetWidth: scaledRect.width,
                            offsetHeight: scaledRect.height,
                            getBoundingClientRect: () => scaledRect,
                        } as HTMLElement;

                        const newPos = config.position(config.id, mockElement, resolver);
                        el.style.left = `${newPos.x}px`;
                        el.style.top = `${newPos.y}px`;

                        resolvedRects.set(config.id, {
                            x: newPos.x,
                            y: newPos.y,
                            width: scaledRect.width,
                            height: scaledRect.height,
                            right: newPos.x + scaledRect.width,
                            bottom: newPos.y + scaledRect.height,
                        });
                    });
                });
            },
            [simpleMode],
        );

        const handleBaseReset = useCallback(
            (id: string) => {
                resetWidget(id, isWidgetDisabled, false);

                if (simpleMode && id === baseWidgetId) {
                    subwidgetTypes.forEach((subType) => {
                        if (subType === baseWidgetId) return;
                        resetWidget(subType, isWidgetDisabled, false);
                    });
                }
            },
            [simpleMode, resetWidget, isWidgetDisabled],
        );

        const handleBaseVisibilityToggle = useCallback(() => {
            const baseWidget = getWidget(baseWidgetId);
            if (!baseWidget) return;

            toggleWidgetVisibility(baseWidgetId);

            if (simpleMode) {
                const newVisibility = !baseWidget.visible;
                subwidgetTypes.forEach((subType) => {
                    if (subType === baseWidgetId) return;
                    const subWidget = getWidget(subType);
                    if (subWidget && subWidget.visible !== newVisibility) {
                        toggleWidgetVisibility(subType);
                    }
                });
            }
        }, [simpleMode, getWidget, toggleWidgetVisibility]);

        return (
            <>
                {subwidgetTypes.map((widgetType) => {
                    const widget = getWidget(widgetType);
                    if (!widget) return null;

                    const baseVisible = editMode ? true : !isDead;
                    const shouldShow = widget.visible && baseVisible && isActive;

                    const isBaseWidget = widgetType === baseWidgetId;
                    const canDrag = isBaseWidget || !simpleMode;

                    const contentVisible = editMode && isActive ? true : shouldShow;

                    return (
                        <HUDWidget
                            key={widgetType}
                            id={widget.id}
                            position={widget.position}
                            hasAccess={isActive}
                            visible={shouldShow}
                            scale={widget.scale}
                            editMode={editMode}
                            snapToGrid={snapToGrid}
                            gridSize={gridSize}
                            onPositionChange={
                                canDrag ? (isBaseWidget ? handleBasePositionChange : updateWidgetPosition) : undefined
                            }
                            onScaleChange={
                                canDrag
                                    ? isBaseWidget && simpleMode
                                        ? handleBaseScaleChange
                                        : updateWidgetScale
                                    : undefined
                            }
                            onVisibilityToggle={
                                canDrag
                                    ? isBaseWidget && simpleMode
                                        ? handleBaseVisibilityToggle
                                        : () => toggleWidgetVisibility(widgetType)
                                    : undefined
                            }
                            onReset={
                                canDrag
                                    ? isBaseWidget && simpleMode
                                        ? handleBaseReset
                                        : (id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)
                                    : undefined
                            }
                            onLiveDrag={isBaseWidget && simpleMode ? handleLiveDrag : undefined}
                            onLiveScale={isBaseWidget && simpleMode ? handleLiveScale : undefined}
                            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                            {...(canDrag ? getMultiSelectProps(widget.id) : {})}>
                            {isBaseWidget
                                ? renderBaseWidget(contentVisible)
                                : renderWidgetContent(widgetType, contentVisible)}
                        </HUDWidget>
                    );
                })}
            </>
        );
    };
};

// Helicopter Subwidget Renderer - uses store internally
const HeliSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "helicopter",
    HELI_SUBWIDGET_TYPES,
    "heli-base",
    (visible) => <HeliBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <HeliSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

// Connected components that subscribe to store
const HeliBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <HeliBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const HeliSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const airspeed = useVehicleStore((s) => s.airspeed ?? 0);
    const altitude = useVehicleStore((s) => s.altitude ?? 0);
    const verticalSpeed = useVehicleStore((s) => s.verticalSpeed ?? 0);
    const heading = useVehicleStore((s) => s.heading ?? 0);
    const rotorRpm = useVehicleStore((s) => s.rotorRpm ?? 0);
    const fuel = useVehicleStore((s) => s.fuel ?? 0);
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "heli-kts":
            return (
                <HeliKtsWidget
                    airspeed={airspeed}
                    visible={visible}
                />
            );
        case "heli-altitude":
            return (
                <HeliAltitudeWidget
                    altitude={altitude}
                    visible={visible}
                />
            );
        case "heli-vspeed":
            return (
                <HeliVSpeedWidget
                    verticalSpeed={verticalSpeed}
                    visible={visible}
                />
            );
        case "heli-heading":
            return (
                <HeliHeadingWidget
                    heading={heading}
                    visible={visible}
                />
            );
        case "heli-rotor":
            return (
                <HeliRotorWidget
                    rotorRpm={rotorRpm}
                    visible={visible}
                />
            );
        case "heli-fuel":
            return (
                <HeliFuelWidget
                    fuel={fuel}
                    visible={visible}
                />
            );
        case "heli-warning":
            return (
                <HeliWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Car Subwidget Renderer
const CarSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "car",
    CAR_SUBWIDGET_TYPES,
    "car-base",
    (visible) => <CarBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <CarSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

const CarBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <CarBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const CarSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const fuel = useVehicleStore((s) => s.fuel ?? 0);
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "car-warning":
            return (
                <CarWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        case "car-fuel":
            return (
                <CarFuelWidget
                    fuel={fuel}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Plane Subwidget Renderer
const PlaneSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "plane",
    PLANE_SUBWIDGET_TYPES,
    "plane-base",
    (visible) => <PlaneBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <PlaneSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

const PlaneBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <PlaneBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const PlaneSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const airspeed = useVehicleStore((s) => s.airspeed ?? s.speed);
    const altitude = useVehicleStore((s) => s.altitude ?? 0);
    const heading = useVehicleStore((s) => s.heading ?? 0);
    const landingGear = useVehicleStore((s) => s.landingGear ?? true);
    const flaps = useVehicleStore((s) => s.flaps ?? 0);
    const fuel = useVehicleStore((s) => s.fuel ?? 0);
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "plane-kts":
            return (
                <PlaneKtsWidget
                    airspeed={airspeed}
                    visible={visible}
                />
            );
        case "plane-altitude":
            return (
                <PlaneAltitudeWidget
                    altitude={altitude}
                    visible={visible}
                />
            );
        case "plane-warning":
            return (
                <PlaneWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        case "plane-heading":
            return (
                <PlaneHeadingWidget
                    heading={heading}
                    visible={visible}
                />
            );
        case "plane-gear":
            return (
                <PlaneGearWidget
                    landingGear={landingGear}
                    visible={visible}
                />
            );
        case "plane-flaps":
            return (
                <PlaneFlapsWidget
                    flaps={flaps}
                    visible={visible}
                />
            );
        case "plane-fuel":
            return (
                <PlaneFuelWidget
                    fuel={fuel}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Boat Subwidget Renderer
const BoatSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "boat",
    BOAT_SUBWIDGET_TYPES,
    "boat-base",
    (visible) => <BoatBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <BoatSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

const BoatBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <BoatBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const BoatSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const fuel = useVehicleStore((s) => s.fuel ?? 0);
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "boat-warning":
            return (
                <BoatWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        case "boat-fuel":
            return (
                <BoatFuelWidget
                    fuel={fuel}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Motorcycle Subwidget Renderer
const MotorcycleSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "motorcycle",
    MOTORCYCLE_SUBWIDGET_TYPES,
    "motorcycle-base",
    (visible) => <MotorcycleBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <MotorcycleSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

const MotorcycleBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <MotorcycleBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const MotorcycleSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const fuel = useVehicleStore((s) => s.fuel ?? 0);
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "motorcycle-warning":
            return (
                <MotorcycleWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        case "motorcycle-fuel":
            return (
                <MotorcycleFuelWidget
                    fuel={fuel}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Bicycle Subwidget Renderer
const BicycleSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "bicycle",
    BICYCLE_SUBWIDGET_TYPES,
    "bicycle-base",
    (visible) => <BicycleBaseWidgetConnected visible={visible} />,
    (widgetType, visible) => (
        <BicycleSubwidgetConnected
            widgetType={widgetType}
            visible={visible}
        />
    ),
);

const BicycleBaseWidgetConnected = ({ visible }: { visible: boolean }) => {
    const vehicle = useVehicleStore();
    return (
        <BicycleBaseWidget
            vehicle={vehicle}
            visible={visible}
        />
    );
};

const BicycleSubwidgetConnected = ({ widgetType, visible }: { widgetType: string; visible: boolean }) => {
    const healthStatus = useVehicleStore((s) => s.healthStatus);

    switch (widgetType) {
        case "bicycle-warning":
            return (
                <BicycleWarningWidget
                    healthStatus={healthStatus}
                    visible={visible}
                />
            );
        default:
            return null;
    }
};

// Main Subwidget Renderer Component
const SubwidgetRendererComponent = (props: SubwidgetRendererProps) => {
    return (
        <>
            <HeliSubwidgetRenderer {...props} />
            <CarSubwidgetRenderer {...props} />
            <PlaneSubwidgetRenderer {...props} />
            <BoatSubwidgetRenderer {...props} />
            <MotorcycleSubwidgetRenderer {...props} />
            <BicycleSubwidgetRenderer {...props} />
        </>
    );
};

export const SubwidgetRenderer = memo(SubwidgetRendererComponent);
