// Position in pixels from top-left corner (responsive - will be scaled based on viewport)
export interface WidgetPosition {
    x: number;
    y: number;
}

export interface WidgetConfig {
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
    | "deathscreen"
    | "chat"
    | "teamchat";

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";

export type SpeedometerType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";

export type MinimapShape = "square" | "round";

export interface SpeedometerConfig {
    position: WidgetPosition;
    scale: number;
}

export interface SpeedometerConfigs {
    car: SpeedometerConfig;
    plane: SpeedometerConfig;
    boat: SpeedometerConfig;
    helicopter: SpeedometerConfig;
    motorcycle: SpeedometerConfig;
    bicycle: SpeedometerConfig;
}

export interface HUDLayoutState {
    widgets: WidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    hudScale: number;
    speedometerType: SpeedometerType;
    speedometerConfigs: SpeedometerConfigs;
    minimapShape: MinimapShape;
}

// Reference resolution for positions (1920x1080)
export const REFERENCE_WIDTH = 1920;
export const REFERENCE_HEIGHT = 1080;

// Dynamic position calculator - uses window dimensions
const getScreenWidth = () => (typeof window !== "undefined" ? window.innerWidth : REFERENCE_WIDTH);
const getScreenHeight = () => (typeof window !== "undefined" ? window.innerHeight : REFERENCE_HEIGHT);

// Widget sizes for bottom alignment calculations
const LOCATION_HEIGHT = 45;
const STATUS_WIDGET_SIZE = 56;
const STATUS_GAP = 8;
const VOICE_HEIGHT = 50;
const SPEEDOMETER_HEIGHT = 200;
const SPEEDOMETER_WIDTH = 240;
const MONEY_WIDGET_WIDTH = 160;
const BOTTOM_MARGIN = 20;

// Calculate bottom-aligned Y position
const getBottomY = (widgetHeight: number) => getScreenHeight() - BOTTOM_MARGIN - widgetHeight;

// Dynamic position helpers
const pos = (xPercent: number, yPercent: number, offsetX = 0, offsetY = 0): WidgetPosition => ({
    x: Math.round(getScreenWidth() * xPercent + offsetX),
    y: Math.round(getScreenHeight() * yPercent + offsetY),
});

// Bottom-aligned position
const bottomPos = (xPercent: number, widgetHeight: number, offsetX = 0): WidgetPosition => ({
    x: Math.round(getScreenWidth() * xPercent + offsetX),
    y: getBottomY(widgetHeight),
});

// Status icon positions
const getStatusStartX = () => Math.round(getScreenWidth() * 0.15);
const getStatusY = () => getBottomY(STATUS_WIDGET_SIZE);
const getStatusSpacing = () => STATUS_WIDGET_SIZE + STATUS_GAP;

// Default speedometer position
const getDefaultSpeedoPos = (): WidgetPosition => ({
    x: Math.round(getScreenWidth() - SPEEDOMETER_WIDTH - 20),
    y: getBottomY(SPEEDOMETER_HEIGHT),
});

export const getDefaultSpeedometerConfigs = (): SpeedometerConfigs => {
    const defaultPos = getDefaultSpeedoPos();
    return {
        car: { position: defaultPos, scale: 1 },
        plane: { position: defaultPos, scale: 1 },
        boat: { position: defaultPos, scale: 1 },
        helicopter: { position: defaultPos, scale: 1 },
        motorcycle: { position: defaultPos, scale: 1 },
        bicycle: { position: defaultPos, scale: 1 },
    };
};

export const getDefaultWidgets = (): WidgetConfig[] => {
    const statusStartX = getStatusStartX();
    const statusY = getStatusY();
    const statusSpacing = getStatusSpacing();
    const NOTIFICATION_HEIGHT = 180;
    const NOTIFICATION_GAP = 20;

    return [
        { id: "compass", type: "compass", position: pos(0.01, 0.02), visible: true, scale: 1 },
        { id: "vehiclename", type: "vehiclename", position: pos(0.06, 0.02), visible: true, scale: 1 },
        { id: "clock", type: "clock", position: pos(0.47, 0.02), visible: true, scale: 1 },
        {
            id: "money",
            type: "money",
            position: { x: getScreenWidth() - MONEY_WIDGET_WIDTH - 20, y: 20 },
            visible: true,
            scale: 1,
        },
        { id: "notifications", type: "notifications", position: pos(0.01, 0.25), visible: true, scale: 1 },
        { id: "location", type: "location", position: bottomPos(0.01, LOCATION_HEIGHT), visible: true, scale: 1 },
        { id: "health", type: "health", position: { x: statusStartX, y: statusY }, visible: true, scale: 1 },
        {
            id: "armor",
            type: "armor",
            position: { x: statusStartX + statusSpacing, y: statusY },
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: { x: statusStartX + statusSpacing * 2, y: statusY },
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: { x: statusStartX + statusSpacing * 3, y: statusY },
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: { x: statusStartX + statusSpacing * 4, y: statusY },
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: { x: statusStartX + statusSpacing * 5, y: statusY },
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: { x: statusStartX + statusSpacing * 6, y: statusY },
            visible: true,
            scale: 1,
        },
        { id: "voice", type: "voice", position: bottomPos(0.47, VOICE_HEIGHT), visible: true, scale: 1 },
        {
            id: "radio",
            type: "radio",
            position: { x: getScreenWidth() - 180, y: 180 },
            visible: true,
            scale: 0.8,
        },
        { id: "speedometer", type: "speedometer", position: getDefaultSpeedoPos(), visible: true, scale: 1 },
        { id: "deathscreen", type: "deathscreen", position: pos(0.25, 0.15), visible: true, scale: 1 },
        {
            id: "chat",
            type: "chat",
            position: pos(0.01, 0.25 + (NOTIFICATION_HEIGHT + NOTIFICATION_GAP) / getScreenHeight()),
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: { x: getScreenWidth() - 515, y: 20 },
            visible: true,
            scale: 1,
        },
    ];
};
