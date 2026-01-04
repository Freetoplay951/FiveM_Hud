export interface WidgetPosition {
    x: number;
    y: number;
}

export type WidgetPositionFunction = (id: string, widgetElement: HTMLElement | null) => WidgetPosition;

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

let lastWidget: HTMLElement | null = null;
export const getDefaultWidgets = (): WidgetConfig[] => {
    const NOTIFICATION_HEIGHT = 180;
    const NOTIFICATION_GAP = 20;

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
                return { x: MARGIN + GAP + getWidget("compass").offsetWidth, y: MARGIN };
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
                return {
                    x: getWidget("money").getBoundingClientRect().left - GAP - widgetElement.offsetWidth,
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
                const moneyRect = moneyWidget.getBoundingClientRect();
                return {
                    x: moneyRect.left + moneyWidget.offsetWidth / 2 - (widgetElement.offsetWidth * 0.8) / 2,
                    y: MARGIN + getWidget("money").offsetHeight + GAP,
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
            position: (_, widgetElement) => {
                const notifyWidget = getWidget("notifications");
                const notifyRect = notifyWidget.getBoundingClientRect();
                return { x: MARGIN, y: notifyRect.top + GAP * 2 + notifyWidget.offsetHeight };
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
            position: (_, widgetElement) => {
                lastWidget = widgetElement;
                return {
                    x: 200,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "armor",
            type: "armor",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: (_, widgetElement) => {
                const widget = lastWidget;
                lastWidget = widgetElement;
                return {
                    x: widget.getBoundingClientRect().left + widget.offsetWidth + GAP,
                    y: getScreenHeight() - MARGIN - widgetElement.offsetHeight,
                };
            },
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
