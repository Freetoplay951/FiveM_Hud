import { PositionResolver } from "@/lib/widgetPositionResolver";
import { StatusWidgetFlags } from "./hud";

export interface WidgetPosition {
    x: number;
    y: number;
}

export type WidgetPositionFunction = (
    id: string,
    widgetElement: HTMLElement | null,
    context: StatusWidgetFlags | undefined,
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
    | "voice"
    | "radio"
    | "location"
    | "speedometer"
    | "notifications"
    | "chat"
    | "teamchat";

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";
export type SpeedometerType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";
export type MinimapShape = "square" | "round";

export interface HUDLayoutState {
    widgets: ResolvedWidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    hudScale: number;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    widgetsDistributed: boolean;
}

export const REFERENCE_WIDTH = 1920;
export const REFERENCE_HEIGHT = 1080;

const MARGIN = 20;
const GAP = 10;

// Helper to check if a status widget is enabled based on server flags
const isStatusWidgetEnabled = (widgetId: string, context?: StatusWidgetFlags): boolean => {
    if (!context) return true;

    switch (widgetId) {
        case "armor":
            return context.hasArmor !== false;
        case "hunger":
            return context.hasHunger !== false;
        case "thirst":
            return context.hasThirst !== false;
        case "stamina":
            return context.hasStamina !== false;
        case "stress":
            return context.hasStress !== false;
        case "oxygen":
            return context.showOxygen !== false;
        default:
            return true;
    }
};

// Helper to calculate status widget positions in a chain, skipping disabled widgets
const getStatusWidgetPosition = (
    widgetId: string,
    widgetElement: HTMLElement | null,
    startX: number,
    context: StatusWidgetFlags | undefined,
    resolver: PositionResolver
): WidgetPosition => {
    const statusWidgetIds = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const currentIndex = statusWidgetIds.indexOf(widgetId);

    let x = startX;

    // Calculate x by summing widths of all previous ENABLED status widgets
    for (let i = 0; i < currentIndex; i++) {
        const prevWidgetId = statusWidgetIds[i];

        if (!isStatusWidgetEnabled(prevWidgetId, context)) {
            continue;
        }

        const prevRect = resolver.getWidgetRect(prevWidgetId);
        if (prevRect) {
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
    const STATUS_START_X = 200;

    return [
        // === Independent widgets (no dependencies) ===
        {
            id: "compass",
            type: "compass",
            position: (_id, _el, _ctx, resolver) => {
                return { x: MARGIN, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "clock",
            type: "clock",
            position: (_id, el, _ctx, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width / 2 - width / 2, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "money",
            type: "money",
            position: (_id, el, _ctx, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width - MARGIN - width, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "notifications",
            type: "notifications",
            position: (_id, _el, _ctx, resolver) => {
                return { x: MARGIN, y: resolver.screen.height / 4 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "location",
            type: "location",
            position: (_id, el, _ctx, resolver) => {
                const height = el?.offsetHeight ?? 0;
                return { x: MARGIN, y: resolver.screen.height - MARGIN - height };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "voice",
            type: "voice",
            position: (_id, el, _ctx, resolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;
                return {
                    x: resolver.screen.width / 2 - width / 2,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "speedometer",
            type: "speedometer",
            position: (_id, el, _ctx, resolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;
                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },

        // === Dependent widgets (depend on previously defined widgets) ===
        {
            id: "vehiclename",
            type: "vehiclename",
            position: (_id, _el, _ctx, resolver) => {
                const compassRect = resolver.getWidgetRect("compass");
                const x = compassRect ? compassRect.right + GAP : MARGIN;
                return { x, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: (_id, el, _ctx, resolver) => {
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
            position: (_id, el, _ctx, resolver) => {
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
            position: (_id, _el, _ctx, resolver) => {
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
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("health", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "armor",
            type: "armor",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("armor", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("hunger", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("thirst", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("stamina", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("stress", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: (_id, el, ctx, resolver) => getStatusWidgetPosition("oxygen", el, STATUS_START_X, ctx, resolver),
            visible: true,
            scale: 1,
        },
    ];
};
