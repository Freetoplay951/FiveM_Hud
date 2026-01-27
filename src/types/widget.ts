import { PositionResolver } from "@/lib/widgetPositionResolver";

export interface WidgetPosition {
    x: number;
    y: number;
}

export type WidgetPositionFunction = (
    id: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver,
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
    | "wanted"
    | "date"
    | "serverinfo"
    | "servername"
    | "branding"
    // Helicopter subwidgets
    | "heli-base"
    | "heli-kts"
    | "heli-altitude"
    | "heli-vspeed"
    | "heli-heading"
    | "heli-rotor"
    | "heli-fuel"
    | "heli-warning"
    // Car subwidgets
    | "car-base"
    | "car-warning"
    | "car-fuel"
    // Plane subwidgets
    | "plane-base"
    | "plane-kts"
    | "plane-altitude"
    | "plane-warning"
    | "plane-heading"
    | "plane-gear"
    | "plane-flaps"
    | "plane-fuel"
    // Boat subwidgets
    | "boat-base"
    | "boat-warning"
    | "boat-fuel"
    // Motorcycle subwidgets
    | "motorcycle-base"
    | "motorcycle-warning"
    | "motorcycle-fuel"
    // Bicycle subwidgets
    | "bicycle-base"
    | "bicycle-warning"
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
    {
        base: "car-base",
        subwidgets: ["car-warning", "car-fuel"],
    },
    {
        base: "plane-base",
        subwidgets: [
            "plane-kts",
            "plane-altitude",
            "plane-warning",
            "plane-heading",
            "plane-gear",
            "plane-flaps",
            "plane-fuel",
        ],
    },
    {
        base: "boat-base",
        subwidgets: ["boat-warning", "boat-fuel"],
    },
    {
        base: "motorcycle-base",
        subwidgets: ["motorcycle-warning", "motorcycle-fuel"],
    },
    {
        base: "bicycle-base",
        subwidgets: ["bicycle-warning"],
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

export const CAR_SUBWIDGET_TYPES = [
    "car-base",
    ...WIDGET_GROUPS.find((g) => g.base === "car-base")!.subwidgets,
] as const;

export const PLANE_SUBWIDGET_TYPES = [
    "plane-base",
    ...WIDGET_GROUPS.find((g) => g.base === "plane-base")!.subwidgets,
] as const;

export const BOAT_SUBWIDGET_TYPES = [
    "boat-base",
    ...WIDGET_GROUPS.find((g) => g.base === "boat-base")!.subwidgets,
] as const;

export const MOTORCYCLE_SUBWIDGET_TYPES = [
    "motorcycle-base",
    ...WIDGET_GROUPS.find((g) => g.base === "motorcycle-base")!.subwidgets,
] as const;

export const BICYCLE_SUBWIDGET_TYPES = [
    "bicycle-base",
    ...WIDGET_GROUPS.find((g) => g.base === "bicycle-base")!.subwidgets,
] as const;

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";
export type SpeedometerType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";
export type MinimapShape = "square" | "round";
export type BrandingPosition = "center" | "right";

export interface HUDLayoutState {
    widgets: ResolvedWidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    brandingPosition: BrandingPosition;
    widgetsDistributed: boolean;
    simpleMode: boolean;
}

import {
    WIDGET_MARGIN as MARGIN,
    WIDGET_GAP as GAP,
    STATUS_WIDGET_IDS,
    NEARBY_WIDGET_THRESHOLD,
} from "@/lib/widgetConfig";

// Helper to calculate status widget positions in a chain
const getStatusWidgetPosition = (
    widgetId: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver,
): WidgetPosition => {
    const currentIndex = STATUS_WIDGET_IDS.indexOf(widgetId as (typeof STATUS_WIDGET_IDS)[number]);
    const { minimapOnlyInVehicle, inVehicle, isEditMode } = resolver.options;

    const minimapEffectivelyHidden =
        (minimapOnlyInVehicle && !inVehicle && !isEditMode) || resolver.isWidgetDisabled("minimap");

    let x: number;
    if (minimapEffectivelyHidden) {
        x = MARGIN;
    } else {
        const minimapRect = resolver.getWidgetRect("minimap");
        x = minimapRect ? minimapRect.right + GAP : MARGIN;
    }

    // Calculate x by summing widths of all previous ENABLED status widgets
    for (let i = 0; i < currentIndex; i++) {
        const prevWidgetId = STATUS_WIDGET_IDS[i];

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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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
            const scaledGap = GAP * Math.min(2, widgetScale);
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

// === Car Subwidget Configurations ===
const getCarSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "car-base",
        type: "car-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            const fuelHeight = resolver.getWidgetSize("car-fuel").height;
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - fuelHeight - GAP - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "car-warning",
        type: "car-warning",
        position: (id, _el, resolver) => {
            const baseRect = resolver.getWidgetCurrentRect("car-base");
            const { width, height } = resolver.getWidgetSize(id);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                // Center between outer arc (at ~12% from edge) and inner backdrop (at 25% from edge)
                // Middle point is at ~18.5% from edge = 81.5% from top
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.y + baseRect.height * 0.875 - height / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "car-fuel",
        type: "car-fuel",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("car-base");
            const { width } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.bottom + scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
];

// === Plane Subwidget Configurations ===
const getPlaneSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "plane-base",
        type: "plane-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            const gearHeight = resolver.getWidgetSize("plane-gear").height;
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - gearHeight - GAP - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "plane-kts",
        type: "plane-kts",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("plane-base");
            const { height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
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
        id: "plane-altitude",
        type: "plane-altitude",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("plane-base");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
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
        id: "plane-heading",
        type: "plane-heading",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("plane-base");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
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
        id: "plane-warning",
        type: "plane-warning",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("plane-base");
            const headingRect = resolver.getWidgetRect("plane-heading");
            const { width, height } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
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
        id: "plane-gear",
        type: "plane-gear",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("plane-base");
            const { width: gearWidth } = resolver.getWidgetSize(id);
            const flapsWidth = resolver.getWidgetSize("plane-flaps").width;
            const fuelWidth = resolver.getWidgetSize("plane-fuel").width;
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                const totalWidth = gearWidth + scaledGap + flapsWidth + scaledGap + fuelWidth;
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
        id: "plane-flaps",
        type: "plane-flaps",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const gearRect = resolver.getWidgetRect("plane-gear");
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (gearRect) {
                return {
                    x: gearRect.right + scaledGap,
                    y: gearRect.y,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "plane-fuel",
        type: "plane-fuel",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const flapsRect = resolver.getWidgetRect("plane-flaps");
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (flapsRect) {
                return {
                    x: flapsRect.right + scaledGap,
                    y: flapsRect.y,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
];

// === Boat Subwidget Configurations ===
const getBoatSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "boat-base",
        type: "boat-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            const fuelHeight = resolver.getWidgetSize("boat-fuel").height;
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - fuelHeight - GAP - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "boat-warning",
        type: "boat-warning",
        position: (id, _el, resolver) => {
            const baseRect = resolver.getWidgetCurrentRect("boat-base");
            const { width, height } = resolver.getWidgetSize(id);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                // Center between outer arc (at ~12% from edge) and inner backdrop (at 25% from edge)
                // Middle point is at ~18.5% from edge = 81.5% from top
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.y + baseRect.height * 0.875 - height / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "boat-fuel",
        type: "boat-fuel",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("boat-base");
            const { width } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.bottom + scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
];

// === Motorcycle Subwidget Configurations ===
const getMotorcycleSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "motorcycle-base",
        type: "motorcycle-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            const fuelHeight = resolver.getWidgetSize("motorcycle-fuel").height;
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - fuelHeight - GAP - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "motorcycle-warning",
        type: "motorcycle-warning",
        position: (id, _el, resolver) => {
            const baseRect = resolver.getWidgetCurrentRect("motorcycle-base");
            const { width, height } = resolver.getWidgetSize(id);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                // Center between outer arc (at ~20% from edge for motorcycle) and inner backdrop (at 28% from edge)
                // Middle point is at ~24% from edge = 76% from top
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.y + baseRect.height * 0.86 - height / 2,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "motorcycle-fuel",
        type: "motorcycle-fuel",
        position: (id, _el, resolver) => {
            const widgetScale = resolver.getWidgetScale?.(id) ?? 1;
            const baseRect = resolver.getWidgetCurrentRect("motorcycle-base");
            const { width } = resolver.getWidgetSize(id);
            const scaledGap = GAP * Math.min(2, widgetScale);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.bottom + scaledGap,
                };
            }
            return { x: resolver.screen.width - MARGIN, y: resolver.screen.height - MARGIN };
        },
        visible: true,
        scale: 1,
    },
];

// === Bicycle Subwidget Configurations ===
const getBicycleSubwidgetConfigs = (): WidgetConfig[] => [
    {
        id: "bicycle-base",
        type: "bicycle-base",
        position: (id, _el, resolver) => {
            const { width, height } = resolver.getWidgetSize(id);
            return {
                x: resolver.screen.width - MARGIN - width,
                y: resolver.screen.height - MARGIN - height,
            };
        },
        visible: true,
        scale: 1,
    },
    {
        id: "bicycle-warning",
        type: "bicycle-warning",
        position: (id, _el, resolver) => {
            const baseRect = resolver.getWidgetCurrentRect("bicycle-base");
            const { width, height } = resolver.getWidgetSize(id);
            if (baseRect) {
                const baseCenterX = baseRect.x + baseRect.width / 2;
                // Center between outer arc (at ~12% from edge) and inner backdrop (at 25% from edge)
                // Middle point is at ~18.5% from edge = 81.5% from top
                return {
                    x: baseCenterX - width / 2,
                    y: baseRect.y + baseRect.height * 0.875 - height / 2,
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
            id: "branding",
            type: "branding",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                if (resolver.options.brandingPosition === "right") {
                    return {
                        x: resolver.screen.width - MARGIN - width,
                        y: MARGIN,
                    };
                } else {
                    return {
                        x: resolver.screen.width / 2 - width / 2,
                        y: MARGIN,
                    };
                }
            },
            visible: true,
            scale: 1,
        },
        {
            id: "clock",
            type: "clock",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;

                // Always call getWidgetRect to register dependency for auto-relayout
                const brandingRect = resolver.getWidgetRect("branding");
                if (resolver.options.brandingPosition === "center" && brandingRect) {
                    return {
                        x: resolver.screen.width / 2 - width / 2,
                        y: brandingRect.bottom + GAP,
                    };
                } else {
                    return {
                        x: resolver.screen.width / 2 - width / 2,
                        y: MARGIN,
                    };
                }
            },
            visible: true,
            scale: 1,
        },
        {
            id: "date",
            type: "date",
            position: (_id, el, resolver) => {
                const clockRect = resolver.getWidgetRect("clock");
                const width = el?.offsetWidth ?? 0;
                if (clockRect) {
                    return {
                        x: resolver.screen.width / 2 - width / 2,
                        y: clockRect.bottom + GAP / 2,
                    };
                }
                return {
                    x: resolver.screen.width / 2 - width / 2,
                    y: MARGIN + 40,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "wanted",
            type: "wanted",
            position: (_id, el, resolver) => {
                const dateRect = resolver.getWidgetRect("date");
                const width = el?.offsetWidth ?? 0;
                if (dateRect) {
                    return {
                        x: resolver.screen.width / 2 - width / 2,
                        y: dateRect.bottom + GAP / 2,
                    };
                }
                return {
                    x: resolver.screen.width / 2 - width / 2,
                    y: MARGIN + 60,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "money",
            type: "money",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;

                // Always call getWidgetRect to register dependency for auto-relayout
                const brandingRect = resolver.getWidgetRect("branding");
                if (resolver.options.brandingPosition === "right" && brandingRect) {
                    return {
                        x: resolver.screen.width - MARGIN - width,
                        y: brandingRect.bottom + GAP,
                    };
                } else {
                    return {
                        x: resolver.screen.width - MARGIN - width,
                        y: MARGIN,
                    };
                }
            },
            visible: true,
            scale: 1,
        },
        {
            id: "serverinfo",
            type: "serverinfo",
            position: (_id, el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const width = el?.offsetWidth ?? 0;
                if (moneyRect) {
                    return {
                        x: moneyRect.x - GAP - width,
                        y: moneyRect.y,
                    };
                }
                return { x: resolver.screen.width - MARGIN - width - 100, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "servername",
            type: "servername",
            position: (_id, _el, resolver) => {
                const { compassHidden } = resolver.options;
                if (!compassHidden) {
                    const compassRect = resolver.getWidgetRect("compass");
                    const x = compassRect ? compassRect.right + GAP : MARGIN + 100;
                    return { x, y: MARGIN };
                } else {
                    return { x: MARGIN, y: MARGIN };
                }
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
        // === Dependent widgets (depend on previously defined widgets) ===
        // VehicleName under ServerName (right of compass)
        {
            id: "vehiclename",
            type: "vehiclename",
            position: (_id, _el, resolver) => {
                const servernameRect = resolver.getWidgetRect("servername");
                if (servernameRect) {
                    return { x: servernameRect.x, y: servernameRect.bottom + GAP / 2 };
                }

                // Fallback when servername not available
                const { compassHidden } = resolver.options;
                if (compassHidden) {
                    return { x: MARGIN, y: MARGIN + 30 };
                }

                const compassRect = resolver.getWidgetRect("compass");
                const x = compassRect ? compassRect.right + GAP : MARGIN;
                return { x, y: MARGIN + 30 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "notifications",
            type: "notifications",
            position: (_id, _el, resolver) => {
                const { compassHidden } = resolver.options;

                // Collect bottom edges of all relevant visible widgets
                let maxBottom = MARGIN;

                if (!compassHidden) {
                    const compassRect = resolver.getWidgetRect("compass");
                    if (compassRect) maxBottom = Math.max(maxBottom, compassRect.bottom);
                }

                const vehiclenameRect = resolver.getWidgetRect("vehiclename");
                if (vehiclenameRect) maxBottom = Math.max(maxBottom, vehiclenameRect.bottom);

                const servernameRect = resolver.getWidgetRect("servername");
                if (servernameRect) maxBottom = Math.max(maxBottom, servernameRect.bottom);

                return { x: MARGIN, y: maxBottom + GAP * 4 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: (_id, el, resolver) => {
                const serverInfoRect = resolver.getWidgetRect("serverinfo");
                const width = el?.offsetWidth ?? 0;
                if (serverInfoRect) {
                    return {
                        x: serverInfoRect.right - width,
                        y: serverInfoRect.bottom + GAP,
                    };
                } else {
                    return {
                        x: resolver.screen.width - MARGIN - width,
                        y: MARGIN,
                    };
                }
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
            id: "location",
            type: "location",
            position: (id, _el, resolver) => {
                const { height, width } = resolver.getWidgetSize(id);
                const { minimapOnlyInVehicle, inVehicle, isEditMode } = resolver.options;

                const minimapEffectivelyHidden =
                    (minimapOnlyInVehicle && !inVehicle && !isEditMode) || resolver.isWidgetDisabled("minimap");
                if (minimapEffectivelyHidden) {
                    // Define a reference area where the location widget would be (bottom-left corner)
                    const referenceRect = {
                        x: MARGIN,
                        y: resolver.screen.height - MARGIN - height,
                        width: width,
                        height: height,
                        right: MARGIN + width,
                        bottom: resolver.screen.height - MARGIN,
                    };

                    // Find all widgets within 100px of the reference position
                    // Sort by y-position (highest first = lowest y value)
                    const nearbyWidgets = resolver
                        .findNearbyWidgets(
                            referenceRect,
                            NEARBY_WIDGET_THRESHOLD,
                            [id, "minimap"], // Exclude location and minimap
                        )
                        .sort((a, b) => a.rect.y - b.rect.y);

                    // Find the highest widget (lowest y value) among nearby widgets
                    let highestY = resolver.screen.height - MARGIN;

                    for (const { rect } of nearbyWidgets) {
                        if (rect.y < highestY) {
                            highestY = rect.y;
                        }
                    }

                    // Position above the highest nearby widget
                    let targetY = highestY - GAP - height;

                    // Upper bound: don't go higher than chat.bottom + GAP
                    const chatRect = resolver.getWidgetCurrentRect("chat");
                    if (chatRect) {
                        const minY = chatRect.bottom + GAP;
                        targetY = Math.max(targetY, minY);
                    }

                    // X is always left-aligned (at MARGIN)
                    return {
                        x: MARGIN,
                        y: targetY,
                    };
                } else {
                    // Minimap visible - use actual DOM position
                    const minimapRect = resolver.getWidgetCurrentRect("minimap");
                    if (minimapRect) {
                        return {
                            x: minimapRect.x,
                            y: minimapRect.y - GAP - height,
                        };
                    }
                    // Fallback to default minimap rect
                    const defaultMinimapRect = resolver.getWidgetRect("minimap");
                    if (defaultMinimapRect) {
                        return {
                            x: defaultMinimapRect.x,
                            y: defaultMinimapRect.y - GAP - height,
                        };
                    }
                    return {
                        x: MARGIN,
                        y: MARGIN + 50 + GAP,
                    };
                }
            },
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

        // === Vehicle Subwidgets ===
        ...getHeliSubwidgetConfigs(),
        ...getCarSubwidgetConfigs(),
        ...getPlaneSubwidgetConfigs(),
        ...getBoatSubwidgetConfigs(),
        ...getMotorcycleSubwidgetConfigs(),
        ...getBicycleSubwidgetConfigs(),
    ];
};
