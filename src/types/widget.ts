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
    | "speedometer-motorcycle"
    | "speedometer-bicycle"
    | "heli-base"
    | "heli-kts"
    | "heli-altitude"
    | "heli-vspeed"
    | "heli-heading"
    | "heli-rotor"
    | "heli-fuel"
    | "heli-warning"
    | "notifications"
    | "chat"
    | "teamchat";

// Widget group structure: Base widget with its subwidgets
export interface WidgetGroup {
    base: WidgetType;
    subwidgets: WidgetType[];
}

// Define all widget groups (base → subwidgets mapping)
export const WIDGET_GROUPS: WidgetGroup[] = [
    {
        base: "heli-base",
        subwidgets: [
            "heli-kts",
            "heli-altitude",
            "heli-vspeed",
            "heli-heading",
            "heli-rotor",
            "heli-fuel",
            "heli-warning",
        ],
    },
];

// Helper to get all subwidget types for a base widget
export const getSubwidgetsForBase = (baseId: WidgetType): WidgetType[] => {
    const group = WIDGET_GROUPS.find((g) => g.base === baseId);
    return group?.subwidgets ?? [];
};

// Helper to get all widget groups as a flat map
export const getWidgetGroupsMap = (): Map<WidgetType, WidgetType[]> => {
    return new Map(WIDGET_GROUPS.map((g) => [g.base, g.subwidgets]));
};

// Derived constants for backwards compatibility
export const HELI_SUBWIDGET_TYPES = [
    "heli-base",
    ...WIDGET_GROUPS.find((g) => g.base === "heli-base")!.subwidgets,
] as const;

export const VEHICLE_WIDGET_TYPES = [
    "speedometer-car",
    "speedometer-plane",
    "speedometer-boat",
    "speedometer-motorcycle",
    "speedometer-bicycle",
] as const;

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
    simpleMode: boolean;
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

// === Helicopter Subwidget Configurations ===
const getHeliSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "heli-base",
        type: "heli-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            const rotorHeight = resolver.getWidgetSize("heli-rotor").height;
            const fuelHeight = resolver.getWidgetSize("heli-fuel").height;
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - Math.max(rotorHeight, fuelHeight) - GAP - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-kts",
        type: "heli-kts",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const { height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * widgetScale;
            if (baseRect) {
                return {
                    x: baseRect.x + scaledGap,
                    y: baseRect.y + baseRect.height / 2 - height / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-altitude",
        type: "heli-altitude",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * widgetScale;
            if (baseRect) {
                return {
                    x: baseRect.x + baseRect.width - width - scaledGap,
                    y: baseRect.y + baseRect.height / 2 - height / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-vspeed",
        type: "heli-vspeed",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const altitudeRect = resolver.getWidgetRect("heli-altitude");
            const { width } = resolver.getWidgetSize(id);
            const scaledGap = GAP * widgetScale;
            if (baseRect && altitudeRect) {
                return {
                    x: baseRect.x + baseRect.width - width - scaledGap,
                    y: altitudeRect.bottom + scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-heading",
        type: "heli-heading",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * widgetScale;
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.y + baseRect.height - height - scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-warning",
        type: "heli-warning",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const headingRect = resolver.getWidgetRect("heli-heading");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * widgetScale;
            if (baseRect && headingRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                return {
                    x: baseCenterX - width / 2,
                    y: headingRect.y - height - scaledGap / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-rotor",
        type: "heli-rotor",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("heli-base");
            const { width: rotorWidth } = resolver.getWidgetSize(id);
            const fuelWidth = resolver.getWidgetSize("heli-fuel").width;
            const scaledGap = GAP * widgetScale;
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                const totalWidth = rotorWidth + scaledGap + fuelWidth;
                return {
                    x: baseCenterX - totalWidth / 2,
                    y: baseRect.bottom + scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "heli-fuel",
        type: "heli-fuel",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const rotorRect = resolver.getWidgetRect("heli-rotor");
            const scaledGap = GAP * widgetScale;
            if (rotorRect) {
                return {
                    x: rotorRect.right + scaledGap,
                    y: rotorRect.y,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
];

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
        ...VEHICLE_WIDGET_TYPES.map((type) => ({
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
            position: (_id, _el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const scaledWidth = resolver.getWidgetSize(_id).width;

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

        // === Helicopter Subwidgets (injected from getHeliSubwidgetConfigs) ===
        ...getHeliSubwidgetConfigs(),
    ];
};
