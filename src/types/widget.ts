export interface WidgetPosition {
    x: number;
    y: number;
}

// Context passed to position functions for smarter positioning
export interface WidgetPositionContext {
    // Server-side flags for disabled widgets
    hasHunger?: boolean;
    hasThirst?: boolean;
    hasStress?: boolean;
    hasStamina?: boolean;
    hasArmor?: boolean;
    showOxygen?: boolean;
}

export type WidgetPositionFunction = (
    id: string,
    widgetElement: HTMLElement | null,
    context?: WidgetPositionContext
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

const getScreenWidth = () => (typeof window !== "undefined" ? window.innerWidth : REFERENCE_WIDTH);
const getScreenHeight = () => (typeof window !== "undefined" ? window.innerHeight : REFERENCE_HEIGHT);

const MARGIN = 20;
const GAP = 10;

function getWidget(id: string) {
    return document.getElementById(`hud-widget-${id}`);
}

// Helper to check if a status widget is enabled based on server flags
const isStatusWidgetEnabled = (
    widgetId: string,
    context?: WidgetPositionContext
): boolean => {
    if (!context) return true; // No context = assume all enabled
    
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
            return true; // health is always enabled
    }
};

// Helper to calculate status widget positions in a chain, skipping disabled widgets
const getStatusWidgetPosition = (
    widgetId: string,
    widgetElement: HTMLElement | null,
    startX: number,
    context?: WidgetPositionContext
): WidgetPosition => {
    const statusWidgetIds = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const currentIndex = statusWidgetIds.indexOf(widgetId);
    
    let x = startX;
    
    // Calculate x by summing widths of all previous ENABLED status widgets
    for (let i = 0; i < currentIndex; i++) {
        const prevWidgetId = statusWidgetIds[i];
        
        // Skip disabled widgets
        if (!isStatusWidgetEnabled(prevWidgetId, context)) {
            continue;
        }
        
        const prevWidget = document.getElementById(`hud-widget-${prevWidgetId}`);
        if (prevWidget) {
            x += prevWidget.offsetWidth + GAP;
        }
    }
    
    return {
        x,
        y: getScreenHeight() - MARGIN - (widgetElement?.offsetHeight || 0),
    };
};

export const getDefaultWidgets = (): WidgetConfig[] => {
    const NOTIFICATION_HEIGHT = 180;
    const NOTIFICATION_GAP = 20;
    const STATUS_START_X = 200;

    return [
        {
            id: "compass",
            type: "compass",
            position: () => {
                return { x: MARGIN, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "vehiclename",
            type: "vehiclename",
            position: () => {
                const compassWidget = getWidget("compass");
                const compassRect = compassWidget?.getBoundingClientRect();
                return { x: (compassRect?.right ?? MARGIN) + GAP, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "clock",
            type: "clock",
            position: (_, widgetElement) => {
                return { x: getScreenWidth() / 2 - widgetElement.offsetWidth / 2, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },

        {
            id: "money",
            type: "money",
            position: (_, widgetElement) => {
                return { x: getScreenWidth() - MARGIN - widgetElement.offsetWidth, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: (_, widgetElement) => {
                const moneyWidget = getWidget("money");
                const moneyRect = moneyWidget?.getBoundingClientRect();
                return {
                    x: (moneyRect?.left ?? getScreenWidth()) - GAP - widgetElement.offsetWidth,
                    y: MARGIN,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "radio",
            type: "radio",
            position: (_, widgetElement) => {
                const moneyWidget = getWidget("money");
                const moneyRect = moneyWidget?.getBoundingClientRect();
                const moneyCenterX = moneyRect ? moneyRect.left + moneyRect.width / 2 : getScreenWidth() - MARGIN;
                const moneyBottom = moneyRect?.bottom ?? MARGIN;
                return {
                    x: moneyCenterX - (widgetElement.offsetWidth * 0.8) / 2,
                    y: moneyBottom + GAP,
                };
            },
            visible: true,
            scale: 0.8,
        },

        {
            id: "notifications",
            type: "notifications",
            position: () => {
                return { x: MARGIN, y: getScreenHeight() / 4 };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "chat",
            type: "chat",
            position: () => {
                const notifyWidget = getWidget("notifications");
                const notifyRect = notifyWidget?.getBoundingClientRect();
                const notifyBottom = notifyRect?.bottom ?? getScreenHeight() / 4;
                return { x: MARGIN, y: notifyBottom + GAP * 2 };
            },
            visible: true,
            scale: 1,
        },

        {
            id: "location",
            type: "location",
            position: (_, widgetElement) => {
                return {
                    x: MARGIN,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },

        {
            id: "health",
            type: "health",
            position: (_, widgetElement, context) => getStatusWidgetPosition("health", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "armor",
            type: "armor",
            position: (_, widgetElement, context) => getStatusWidgetPosition("armor", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: (_, widgetElement, context) => getStatusWidgetPosition("hunger", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: (_, widgetElement, context) => getStatusWidgetPosition("thirst", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: (_, widgetElement, context) => getStatusWidgetPosition("stamina", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: (_, widgetElement, context) => getStatusWidgetPosition("stress", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: (_, widgetElement, context) => getStatusWidgetPosition("oxygen", widgetElement, STATUS_START_X, context),
            visible: true,
            scale: 1,
        },

        {
            id: "voice",
            type: "voice",
            position: (_, widgetElement) => {
                return {
                    x: getScreenWidth() / 2 - widgetElement.offsetWidth / 2,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },

        {
            id: "speedometer",
            type: "speedometer",
            position: (_, widgetElement) => {
                return {
                    x: getScreenWidth() - MARGIN - widgetElement.offsetWidth,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
    ];
};
