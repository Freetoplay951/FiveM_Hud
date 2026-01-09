import { useCallback } from "react";
import { HUDWidget } from "./HUDWidget";
import { VehicleState } from "@/types/hud";
import { WidgetPosition, HELI_SUBWIDGET_TYPES, getDefaultWidgets, ResolvedWidgetConfig } from "@/types/widget";
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

// ==========================================
// SUBWIDGET SYSTEM CONFIGURATION
// ==========================================
// This system is designed to be extensible for any vehicle type.
// To add a new vehicle type (e.g., plane):
// 1. Create new widget components in widgets/vehicles/plane/
// 2. Add PLANE_SUBWIDGET_TYPES to types/widget.ts
// 3. Create a PlaneSubwidgetRenderer below following the HeliSubwidgetRenderer pattern
// 4. Add the new renderer to the SubwidgetRenderer component

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

// ==========================================
// HELICOPTER SUBWIDGET RENDERER
// ==========================================
const HeliSubwidgetRenderer = ({
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
}: SubwidgetRendererProps) => {
    const isHelicopter = editMode
        ? speedometerType === "helicopter"
        : vehicleState.inVehicle && vehicleState.vehicleType === "helicopter";

    // Extract helicopter values
    const airspeed = vehicleState.airspeed ?? 0;
    const altitude = vehicleState.altitude ?? 0;
    const verticalSpeed = vehicleState.verticalSpeed ?? 0;
    const heading = vehicleState.heading ?? 0;
    const rotorRpm = vehicleState.rotorRpm ?? 0;
    const fuel = vehicleState.fuel ?? 0;
    const bodyHealth = vehicleState.bodyHealth ?? 100;

    // Handle base widget position change - in simple mode, move all sub-widgets together
    const handleBasePositionChange = useCallback(
        (id: string, newPosition: WidgetPosition) => {
            if (!simpleMode) {
                updateWidgetPosition(id, newPosition);
                return;
            }

            const baseWidget = getWidget("heli-base");
            if (!baseWidget) return;

            const deltaX = newPosition.x - baseWidget.position.x;
            const deltaY = newPosition.y - baseWidget.position.y;

            HELI_SUBWIDGET_TYPES.forEach((subType) => {
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

    // Handle live drag - directly manipulate DOM for instant feedback
    // Note: This receives delta from base widget position change
    const handleLiveDrag = useCallback(
        (_id: string, currentPos: WidgetPosition) => {
            if (!simpleMode) return;

            const baseWidget = getWidget("heli-base");
            if (!baseWidget) return;

            const deltaX = currentPos.x - baseWidget.position.x;
            const deltaY = currentPos.y - baseWidget.position.y;

            HELI_SUBWIDGET_TYPES.forEach((subType) => {
                if (subType === "heli-base") return;
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

    // Handle base widget scale change - in simple mode, scale all sub-widgets together
    const handleBaseScaleChange = useCallback(
        (id: string, newScale: number) => {
            updateWidgetScale(id, newScale);

            if (simpleMode) {
                HELI_SUBWIDGET_TYPES.forEach((subType) => {
                    if (subType === "heli-base") return;
                    updateWidgetScale(subType, newScale);
                });

                // After scale change, reflow all sub-widgets to recalculate positions
                requestAnimationFrame(() => {
                    HELI_SUBWIDGET_TYPES.forEach((subType) => {
                        if (subType === "heli-base") return;
                        reflowWidgetPosition(subType, isWidgetDisabled, hasSignaledReady);
                    });
                });
            }
        },
        [simpleMode, updateWidgetScale, reflowWidgetPosition, isWidgetDisabled, hasSignaledReady]
    );

    // Handle live scale - directly manipulate DOM for instant feedback using resolver
    const handleLiveScale = useCallback(
        (_id: string, currentScale: number) => {
            if (!simpleMode) return;

            // Apply scale to all sub-widgets first
            HELI_SUBWIDGET_TYPES.forEach((subType) => {
                if (subType === "heli-base") return;
                const el = document.getElementById(`hud-widget-${subType}`);
                if (el) {
                    el.style.transform = `scale(${Math.round(currentScale * 100) / 100})`;
                }
            });

            // Use the resolver system to recalculate positions
            requestAnimationFrame(() => {
                const defaultWidgets = getDefaultWidgets();
                const heliSubConfigs = defaultWidgets.filter(
                    (w) =>
                        HELI_SUBWIDGET_TYPES.includes(w.id as (typeof HELI_SUBWIDGET_TYPES)[number]) &&
                        w.id !== "heli-base"
                );

                // Build a resolver that uses current DOM positions with scaled dimensions
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

                // Calculate positions for each sub-widget using their position functions
                heliSubConfigs.forEach((config) => {
                    const el = document.getElementById(`hud-widget-${config.id}`);
                    if (!el) return;

                    // Get the scaled dimensions from getBoundingClientRect
                    const scaledRect = el.getBoundingClientRect();

                    // Create a mock element with scaled dimensions for the position function
                    const mockElement = {
                        offsetWidth: scaledRect.width,
                        offsetHeight: scaledRect.height,
                        getBoundingClientRect: () => scaledRect,
                    } as HTMLElement;

                    const newPos = config.position(config.id, mockElement, resolver);
                    el.style.left = `${newPos.x}px`;
                    el.style.top = `${newPos.y}px`;

                    // Store resolved rect for dependent widgets
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

    // Handle reset - in simple mode, reset all sub-widgets when base is reset
    const handleBaseReset = useCallback(
        (id: string) => {
            resetWidget(id, isWidgetDisabled, false);

            if (simpleMode && id === "heli-base") {
                HELI_SUBWIDGET_TYPES.forEach((subType) => {
                    if (subType === "heli-base") return;
                    resetWidget(subType, isWidgetDisabled, false);
                });
            }
        },
        [simpleMode, resetWidget, isWidgetDisabled]
    );

    // Handle visibility toggle - in simple mode, toggle all sub-widgets when base is toggled
    const handleBaseVisibilityToggle = useCallback(() => {
        const baseWidget = getWidget("heli-base");
        if (!baseWidget) return;

        // Toggle base widget
        toggleWidgetVisibility("heli-base");

        if (simpleMode) {
            const newVisibility = !baseWidget.visible;
            HELI_SUBWIDGET_TYPES.forEach((subType) => {
                if (subType === "heli-base") return;
                const subWidget = getWidget(subType);
                if (subWidget && subWidget.visible !== newVisibility) {
                    toggleWidgetVisibility(subType);
                }
            });
        }
    }, [simpleMode, getWidget, toggleWidgetVisibility]);

    // Render widget content based on type
    const renderWidgetContent = (widgetType: string, contentVisible: boolean) => {
        switch (widgetType) {
            case "heli-base":
                return (
                    <HeliBaseWidget
                        vehicle={vehicleState}
                        visible={contentVisible}
                    />
                );
            case "heli-kts":
                return (
                    <HeliKtsWidget
                        airspeed={airspeed}
                        visible={contentVisible}
                    />
                );
            case "heli-altitude":
                return (
                    <HeliAltitudeWidget
                        altitude={altitude}
                        visible={contentVisible}
                    />
                );
            case "heli-vspeed":
                return (
                    <HeliVSpeedWidget
                        verticalSpeed={verticalSpeed}
                        visible={contentVisible}
                    />
                );
            case "heli-heading":
                return (
                    <HeliHeadingWidget
                        heading={heading}
                        visible={contentVisible}
                    />
                );
            case "heli-rotor":
                return (
                    <HeliRotorWidget
                        rotorRpm={rotorRpm}
                        visible={contentVisible}
                    />
                );
            case "heli-fuel":
                return (
                    <HeliFuelWidget
                        fuel={fuel}
                        visible={contentVisible}
                    />
                );
            case "heli-warning":
                return (
                    <HeliWarningWidget
                        bodyHealth={bodyHealth}
                        visible={contentVisible}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            {HELI_SUBWIDGET_TYPES.map((widgetType) => {
                const widget = getWidget(widgetType);
                if (!widget) return null;

                const baseVisible = editMode ? true : !deathState.isDead;
                const shouldShow = widget.visible && baseVisible && isHelicopter;

                const isBaseWidget = widgetType === "heli-base";
                const canDrag = isBaseWidget || !simpleMode;

                const contentVisible = editMode && isHelicopter ? true : shouldShow;

                return (
                    <HUDWidget
                        key={widgetType}
                        id={widget.id}
                        position={widget.position}
                        hasAccess={isHelicopter}
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
                        {renderWidgetContent(widgetType, contentVisible)}
                    </HUDWidget>
                );
            })}
        </>
    );
};

// ==========================================
// MAIN SUBWIDGET RENDERER
// ==========================================
export const SubwidgetRenderer = (props: SubwidgetRendererProps) => {
    return (
        <>
            <HeliSubwidgetRenderer {...props} />
        </>
    );
};
