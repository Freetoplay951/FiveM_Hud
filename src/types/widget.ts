import { PositionResolver } from "@/lib/widgetPositionResolver";

export interface WidgetPosition {
    x: number;
    y: number;
}

export type WidgetPositionFunction = (
    id: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver
) => WidgetPosition;

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    position: WidgetPositionFunction;
    visible: boolean;
    scale?: number;
}

export interface ResolvedWidgetConfig {
    id: string;
    type: WidgetType;
    position: WidgetPosition;
    visible: boolean;
    scale?: number;
}

export type WidgetType =
    | "health"
    | "armor"
    | "hunger"
    | "thirst"
    | "stamina"
    | "stress"
    | "oxygen"
    | "money"
    | "clock"
    | "compass"
    | "vehiclename"
    | "minimap"
    | "voice"
    | "radio"
    | "location"
    | "speedometer-car"
    | "speedometer-plane"
    | "speedometer-boat"
    | "speedometer-helicopter"
    | "speedometer-motorcycle"
    | "speedometer-bicycle"
    | "notifications"
    | "chat"
    | "teamchat"
    // Helicopter sub-widgets
    | "heli-base"
    | "heli-speed"
    | "heli-altitude"
    | "heli-heading"
    | "heli-rotor"
    | "heli-fuel"
    | "heli-verticalspeed";

export const VEHICLE_WIDGET_TYPES = [
    "speedometer-car",
    "speedometer-plane",
    "speedometer-boat",
    "speedometer-helicopter",
    "speedometer-motorcycle",
    "speedometer-bicycle",
] as const;

export const HELI_WIDGET_TYPES = [
    "heli-base",
    "heli-speed",
    "heli-altitude",
    "heli-heading",
    "heli-rotor",
    "heli-fuel",
    "heli-verticalspeed",
] as const;

export type VehicleWidgetType = (typeof VEHICLE_WIDGET_TYPES)[number];
export type HeliWidgetType = (typeof HELI_WIDGET_TYPES)[number];

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";
export type SpeedometerType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";
export type MinimapShape = "square" | "round";

export interface HUDLayoutState {
    widgets: ResolvedWidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    widgetsDistributed: boolean;
}

const MARGIN = 20;
const GAP = 10;

// Helper to calculate status widget positions in a chain
const getStatusWidgetPosition = (
    widgetId: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver
): WidgetPosition => {
    const statusWidgetIds = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const currentIndex = statusWidgetIds.indexOf(widgetId);

    let x = resolver.getWidgetRect("minimap").right + GAP;

    // Calculate x by summing widths of all previous ENABLED status widgets
    for (let i = 0; i < currentIndex; i++) {
        const prevWidgetId = statusWidgetIds[i];

        // Skip disabled widgets - they don't take up space
        if (resolver.isWidgetDisabled?.(prevWidgetId)) {
            continue;
        }

        const prevRect = resolver.getWidgetRect(prevWidgetId);
        if (prevRect && prevRect.width > 0) {
            x = prevRect.right + GAP;
        }
    }

    const height = widgetElement?.offsetHeight ?? 0;

    return {
        x,
        y: resolver.screen.height - MARGIN - height,
    };
};

export const getDefaultWidgets = (): WidgetConfig[] => {
    return [
        // === Independent widgets (no dependencies) ===
        {
            id: "compass",
            type: "compass",
            position: (_id, _el, resolver) => {
                return { x: MARGIN, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "clock",
            type: "clock",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width / 2 - width / 2, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "money",
            type: "money",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width - MARGIN - width, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "minimap",
            type: "minimap",
            position: (_id, el, resolver) => {
                const height = el?.offsetHeight ?? 0;
                return {
                    x: MARGIN,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },
        // Vehicle speedometer widgets - all share same default position (except helicopter which uses subwidgets)
        ...VEHICLE_WIDGET_TYPES.filter((type) => type !== "speedometer-helicopter").map((type) => ({
            id: type,
            type: type as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;
                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        })),

        // === Helicopter sub-widgets (individual movable elements) ===
        {
            id: "heli-base",
            type: "heli-base" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const width = el?.offsetWidth ?? 176; // 44*4 = 176px (w-44)
                const height = el?.offsetHeight ?? 176;
                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-speed",
            type: "heli-speed" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const width = el?.offsetWidth ?? 40;
                const height = el?.offsetHeight ?? 30;
                if (heliBaseRect) {
                    // Position: left side of the attitude indicator, vertically centered
                    return {
                        x: heliBaseRect.x + 8, // 8px from left edge of base
                        y: heliBaseRect.y + heliBaseRect.height / 2 - height / 2,
                    };
                }
                return { x: resolver.screen.width - MARGIN - 200, y: resolver.screen.height - MARGIN - 100 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-altitude",
            type: "heli-altitude" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const width = el?.offsetWidth ?? 44;
                const height = el?.offsetHeight ?? 30;
                if (heliBaseRect) {
                    // Position: right side of the attitude indicator, vertically centered
                    return {
                        x: heliBaseRect.x + heliBaseRect.width - width - 8, // 8px from right edge
                        y: heliBaseRect.y + heliBaseRect.height / 2 - height / 2,
                    };
                }
                return { x: resolver.screen.width - MARGIN - 50, y: resolver.screen.height - MARGIN - 100 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-heading",
            type: "heli-heading" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const width = el?.offsetWidth ?? 48;
                const height = el?.offsetHeight ?? 24;
                if (heliBaseRect) {
                    // Position: bottom center of the attitude indicator
                    return {
                        x: heliBaseRect.x + heliBaseRect.width / 2 - width / 2,
                        y: heliBaseRect.y + heliBaseRect.height - 12 - height, // 12px from bottom
                    };
                }
                return { x: resolver.screen.width - MARGIN - 100, y: resolver.screen.height - MARGIN - 30 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-verticalspeed",
            type: "heli-verticalspeed" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const width = el?.offsetWidth ?? 44;
                const height = el?.offsetHeight ?? 20;
                if (heliBaseRect) {
                    // Position: right side, below altitude (bottom-right area)
                    return {
                        x: heliBaseRect.x + heliBaseRect.width - width - 8,
                        y: heliBaseRect.y + heliBaseRect.height - 48 - height, // above heading
                    };
                }
                return { x: resolver.screen.width - MARGIN - 50, y: resolver.screen.height - MARGIN - 60 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-rotor",
            type: "heli-rotor" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const width = el?.offsetWidth ?? 88;
                if (heliBaseRect) {
                    // Position: below the attitude indicator, left side of status row
                    return {
                        x: heliBaseRect.x + heliBaseRect.width / 2 - width - GAP / 2,
                        y: heliBaseRect.y + heliBaseRect.height + 8,
                    };
                }
                return { x: resolver.screen.width - MARGIN - 160, y: resolver.screen.height - MARGIN - 8 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "heli-fuel",
            type: "heli-fuel" as WidgetType,
            position: (_id: string, el: HTMLElement | null, resolver: PositionResolver) => {
                const heliBaseRect = resolver.getWidgetRect("heli-base");
                const heliRotorRect = resolver.getWidgetRect("heli-rotor");
                if (heliBaseRect && heliRotorRect) {
                    // Position: next to rotor widget
                    return {
                        x: heliRotorRect.right + GAP,
                        y: heliRotorRect.y,
                    };
                }
                return { x: resolver.screen.width - MARGIN - 64, y: resolver.screen.height - MARGIN - 8 };
            },
            visible: true,
            scale: 1,
        },

        // === Dependent widgets (depend on previously defined widgets) ===
        {
            id: "vehiclename",
            type: "vehiclename",
            position: (_id, _el, resolver) => {
                const compassRect = resolver.getWidgetRect("compass");
                const x = compassRect ? compassRect.right + GAP : MARGIN;
                return { x, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "notifications",
            type: "notifications",
            position: (_id, _el, resolver) => {
                const compassRect = resolver.getWidgetRect("compass");
                const y = compassRect ? compassRect.bottom + GAP * 4 : MARGIN;
                return { x: MARGIN, y };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: (_id, el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const width = el?.offsetWidth ?? 0;
                const x = moneyRect ? moneyRect.x - GAP - width : resolver.screen.width - MARGIN - width;
                return { x, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "radio",
            type: "radio",
            position: (_id, el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const width = el?.offsetWidth ?? 0;
                const scale = 0.8;
                const scaledWidth = width * scale;

                if (moneyRect) {
                    const moneyCenterX = moneyRect.x + moneyRect.width / 2;
                    return {
                        x: moneyCenterX - scaledWidth / 2,
                        y: moneyRect.bottom + GAP,
                    };
                }

                return {
                    x: resolver.screen.width - MARGIN - scaledWidth,
                    y: MARGIN + 50 + GAP,
                };
            },
            visible: true,
            scale: 0.8,
        },
        {
            id: "chat",
            type: "chat",
            position: (_id, _el, resolver) => {
                const notifyRect = resolver.getWidgetRect("notifications");
                const y = notifyRect ? notifyRect.bottom + GAP * 2 : resolver.screen.height / 4;
                return { x: MARGIN, y };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "location",
            type: "location",
            position: (_id, el, resolver) => {
                const minimapRect = resolver.getWidgetRect("minimap");
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;

                if (minimapRect) {
                    const minimapCenterX = minimapRect.x + minimapRect.width / 2;
                    return {
                        x: minimapCenterX - width / 2,
                        y: minimapRect.y - GAP - height,
                    };
                }

                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: MARGIN + 50 + GAP,
                };
            },
            visible: true,
            scale: 1,
        },

        // === Status widgets (chain dependency) ===
        {
            id: "health",
            type: "health",
            position: (_id, el, resolver) => getStatusWidgetPosition("health", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "armor",
            type: "armor",
            position: (_id, el, resolver) => getStatusWidgetPosition("armor", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: (_id, el, resolver) => getStatusWidgetPosition("hunger", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: (_id, el, resolver) => getStatusWidgetPosition("thirst", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: (_id, el, resolver) => getStatusWidgetPosition("stamina", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: (_id, el, resolver) => getStatusWidgetPosition("stress", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: (_id, el, resolver) => getStatusWidgetPosition("oxygen", el, resolver),
            visible: true,
            scale: 1,
        },

        {
            id: "voice",
            type: "voice",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;

                const oxygenRect = resolver.getWidgetRect("oxygen");
                const lastStatusX = oxygenRect.right;

                const x = resolver.screen.width / 2 - width / 2;
                let y = resolver.screen.height - MARGIN - height;

                if (lastStatusX > x) y = oxygenRect.y - GAP - el.offsetHeight;

                return {
                    x,
                    y,
                };
            },
            visible: true,
            scale: 1,
        },
    ];
};
