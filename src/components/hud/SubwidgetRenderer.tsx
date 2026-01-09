import { useCallback } from "react";
import { HUDWidget } from "./HUDWidget";
import { VehicleState } from "@/types/hud";
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

export interface SubwidgetRendererProps {
    vehicleState: VehicleState;
    editMode: boolean;
    simpleMode: boolean;
    speedometerType: string;
    snapToGrid: boolean;
    gridSize: number;
    hasSignaledReady: boolean;
    deathState: { isDead: boolean };
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
    renderBaseWidget: (vehicle: VehicleState, visible: boolean) => React.ReactNode,
    renderWidgetContent: (
        widgetType: string,
        contentVisible: boolean,
        vehicleState: VehicleState
    ) => React.ReactNode
) => {
    return (props: SubwidgetRendererProps) => {
        const {
            vehicleState,
            editMode,
            simpleMode,
            speedometerType,
            snapToGrid,
            gridSize,
            hasSignaledReady,
            deathState,
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            reflowWidgetPosition,
            isWidgetDisabled,
            getMultiSelectProps,
        } = props;

        const isActive = editMode
            ? speedometerType === vehicleType
            : vehicleState.inVehicle && vehicleState.vehicleType === vehicleType;

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
            [simpleMode, getWidget, updateWidgetPosition]
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
            [simpleMode, getWidget]
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
            [simpleMode, updateWidgetScale, reflowWidgetPosition, isWidgetDisabled, hasSignaledReady]
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
                        (w) => subwidgetTypes.includes(w.id) && w.id !== baseWidgetId
                    );

                    const resolvedRects = new Map<
                        string,
                        { x: number; y: number; width: number; height: number; right: number; bottom: number }
                    >();

                    const resolver = {
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
            [simpleMode]
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
            [simpleMode, resetWidget, isWidgetDisabled]
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

                    const baseVisible = editMode ? true : !deathState.isDead;
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
                                ? renderBaseWidget(vehicleState, contentVisible)
                                : renderWidgetContent(widgetType, contentVisible, vehicleState)}
                        </HUDWidget>
                    );
                })}
            </>
        );
    };
};

// Helicopter Subwidget Renderer
const HeliSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "helicopter",
    HELI_SUBWIDGET_TYPES,
    "heli-base",
    (vehicle, visible) => <HeliBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "heli-kts":
                return <HeliKtsWidget airspeed={vehicle.airspeed ?? 0} visible={visible} />;
            case "heli-altitude":
                return <HeliAltitudeWidget altitude={vehicle.altitude ?? 0} visible={visible} />;
            case "heli-vspeed":
                return <HeliVSpeedWidget verticalSpeed={vehicle.verticalSpeed ?? 0} visible={visible} />;
            case "heli-heading":
                return <HeliHeadingWidget heading={vehicle.heading ?? 0} visible={visible} />;
            case "heli-rotor":
                return <HeliRotorWidget rotorRpm={vehicle.rotorRpm ?? 0} visible={visible} />;
            case "heli-fuel":
                return <HeliFuelWidget fuel={vehicle.fuel ?? 0} visible={visible} />;
            case "heli-warning":
                return <HeliWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            default:
                return null;
        }
    }
);

// Car Subwidget Renderer
const CarSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "car",
    CAR_SUBWIDGET_TYPES,
    "car-base",
    (vehicle, visible) => <CarBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "car-warning":
                return <CarWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            case "car-fuel":
                return <CarFuelWidget fuel={vehicle.fuel ?? 0} visible={visible} />;
            default:
                return null;
        }
    }
);

// Plane Subwidget Renderer
const PlaneSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "plane",
    PLANE_SUBWIDGET_TYPES,
    "plane-base",
    (vehicle, visible) => <PlaneBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "plane-kts":
                return <PlaneKtsWidget airspeed={vehicle.airspeed ?? vehicle.speed} visible={visible} />;
            case "plane-altitude":
                return <PlaneAltitudeWidget altitude={vehicle.altitude ?? 0} visible={visible} />;
            case "plane-warning":
                return <PlaneWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            case "plane-heading":
                return <PlaneHeadingWidget heading={vehicle.heading ?? 0} visible={visible} />;
            case "plane-gear":
                return <PlaneGearWidget landingGear={vehicle.landingGear ?? true} visible={visible} />;
            case "plane-flaps":
                return <PlaneFlapsWidget flaps={vehicle.flaps ?? 0} visible={visible} />;
            case "plane-fuel":
                return <PlaneFuelWidget fuel={vehicle.fuel ?? 0} visible={visible} />;
            default:
                return null;
        }
    }
);

// Boat Subwidget Renderer
const BoatSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "boat",
    BOAT_SUBWIDGET_TYPES,
    "boat-base",
    (vehicle, visible) => <BoatBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "boat-warning":
                return <BoatWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            case "boat-fuel":
                return <BoatFuelWidget fuel={vehicle.fuel ?? 0} visible={visible} />;
            default:
                return null;
        }
    }
);

// Motorcycle Subwidget Renderer
const MotorcycleSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "motorcycle",
    MOTORCYCLE_SUBWIDGET_TYPES,
    "motorcycle-base",
    (vehicle, visible) => <MotorcycleBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "motorcycle-warning":
                return <MotorcycleWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            case "motorcycle-fuel":
                return <MotorcycleFuelWidget fuel={vehicle.fuel ?? 0} visible={visible} />;
            default:
                return null;
        }
    }
);

// Bicycle Subwidget Renderer
const BicycleSubwidgetRenderer = createVehicleSubwidgetRenderer(
    "bicycle",
    BICYCLE_SUBWIDGET_TYPES,
    "bicycle-base",
    (vehicle, visible) => <BicycleBaseWidget vehicle={vehicle} visible={visible} />,
    (widgetType, visible, vehicle) => {
        switch (widgetType) {
            case "bicycle-warning":
                return <BicycleWarningWidget bodyHealth={vehicle.bodyHealth} visible={visible} />;
            default:
                return null;
        }
    }
);

// Main Subwidget Renderer
export const SubwidgetRenderer = (props: SubwidgetRendererProps) => {
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
