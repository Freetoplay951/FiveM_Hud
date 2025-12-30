// Position in pixels from top-left corner (responsive - will be scaled based on viewport)
export interface WidgetPosition {
    x: number;
    y: number;
}

export interface WidgetSize {
    width: number;
    height: number;
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
    | "voice"
    | "minimap"
    | "speedometer"
    | "notifications"
    | "deathscreen";

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";

export type SpeedometerType = "car" | "plane" | "boat" | "helicopter";

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
const getScreenWidth = () => typeof window !== 'undefined' ? window.innerWidth : REFERENCE_WIDTH;
const getScreenHeight = () => typeof window !== 'undefined' ? window.innerHeight : REFERENCE_HEIGHT;

// Widget sizes for bottom alignment calculations
const MINIMAP_HEIGHT = 200; // Approximate height including location text
const STATUS_WIDGET_SIZE = 56; // w-14 = 56px
const STATUS_GAP = 8; // Gap between widgets
const VOICE_HEIGHT = 50;
const SPEEDOMETER_HEIGHT = 200;

// Common bottom margin (distance from screen bottom)
const BOTTOM_MARGIN = 20;

// Calculate bottom-aligned Y position (widgets align at their bottom edge)
const getBottomY = (widgetHeight: number) => 
    getScreenHeight() - BOTTOM_MARGIN - widgetHeight;

// Dynamic position helpers
const pos = (xPercent: number, yPercent: number, offsetX = 0, offsetY = 0): WidgetPosition => ({
    x: Math.round(getScreenWidth() * xPercent + offsetX),
    y: Math.round(getScreenHeight() * yPercent + offsetY),
});

// Bottom-aligned position (from left percentage, aligned to bottom)
const bottomPos = (xPercent: number, widgetHeight: number, offsetX = 0): WidgetPosition => ({
    x: Math.round(getScreenWidth() * xPercent + offsetX),
    y: getBottomY(widgetHeight),
});

// Status icon positions - all aligned to bottom
const getStatusStartX = () => Math.round(getScreenWidth() * 0.12);
const getStatusY = () => getBottomY(STATUS_WIDGET_SIZE);
const getStatusSpacing = () => STATUS_WIDGET_SIZE + STATUS_GAP;

// Default speedometer position (bottom right, aligned to bottom)
const getDefaultSpeedoPos = (): WidgetPosition => ({
    x: Math.round(getScreenWidth() * 0.86),
    y: getBottomY(SPEEDOMETER_HEIGHT),
});

export const getDefaultSpeedometerConfigs = (): SpeedometerConfigs => {
    const defaultPos = getDefaultSpeedoPos();
    return {
        car: { position: defaultPos, scale: 1 },
        plane: { position: defaultPos, scale: 1 },
        boat: { position: defaultPos, scale: 1 },
        helicopter: { position: defaultPos, scale: 1 },
    };
};

// Legacy static configs for backwards compatibility
export const DEFAULT_SPEEDOMETER_CONFIGS: SpeedometerConfigs = {
    car: { position: { x: 1650, y: 860 }, scale: 1 },
    plane: { position: { x: 1650, y: 860 }, scale: 1 },
    boat: { position: { x: 1650, y: 860 }, scale: 1 },
    helicopter: { position: { x: 1650, y: 860 }, scale: 1 },
};

// Dynamic widget generator - call this at runtime
export const getDefaultWidgets = (): WidgetConfig[] => {
    const statusStartX = getStatusStartX();
    const statusY = getStatusY();
    const statusSpacing = getStatusSpacing();

    return [
        // Top left - Compass
        { id: "compass", type: "compass", position: pos(0.01, 0.02), visible: true, scale: 1 },

        // Top center - Clock
        { id: "clock", type: "clock", position: pos(0.47, 0.02), visible: true, scale: 1 },

        // Top right - Money
        { id: "money", type: "money", position: pos(0.89, 0.02), visible: true, scale: 1 },

        // Middle left - Notifications
        { id: "notifications", type: "notifications", position: pos(0.01, 0.32), visible: true, scale: 1 },

        // Bottom left - Minimap (aligned to bottom)
        { id: "minimap", type: "minimap", position: bottomPos(0.01, MINIMAP_HEIGHT), visible: true, scale: 1 },

        // Bottom - Status icons (all aligned to same bottom line)
        { id: "health", type: "health", position: { x: statusStartX, y: statusY }, visible: true, scale: 1 },
        { id: "armor", type: "armor", position: { x: statusStartX + statusSpacing, y: statusY }, visible: true, scale: 1 },
        { id: "hunger", type: "hunger", position: { x: statusStartX + statusSpacing * 2, y: statusY }, visible: true, scale: 1 },
        { id: "thirst", type: "thirst", position: { x: statusStartX + statusSpacing * 3, y: statusY }, visible: true, scale: 1 },
        { id: "stamina", type: "stamina", position: { x: statusStartX + statusSpacing * 4, y: statusY }, visible: true, scale: 1 },
        { id: "stress", type: "stress", position: { x: statusStartX + statusSpacing * 5, y: statusY }, visible: true, scale: 1 },
        { id: "oxygen", type: "oxygen", position: { x: statusStartX + statusSpacing * 6, y: statusY }, visible: true, scale: 1 },

        // Voice - centered, aligned to bottom
        { id: "voice", type: "voice", position: bottomPos(0.47, VOICE_HEIGHT), visible: true, scale: 1 },

        // Bottom right - Speedometer (aligned to bottom)
        { id: "speedometer", type: "speedometer", position: getDefaultSpeedoPos(), visible: true, scale: 1 },

        // Death Screen - centered (only visible when dead)
        { id: "deathscreen", type: "deathscreen", position: pos(0.25, 0.15), visible: true, scale: 1 },
    ];
};

// Static default for backwards compatibility (uses reference resolution)
export const DEFAULT_WIDGETS: WidgetConfig[] = getDefaultWidgets();

export const DEFAULT_HUD_STATE: HUDLayoutState = {
    widgets: DEFAULT_WIDGETS,
    editMode: false,
    snapToGrid: true,
    gridSize: 10,
    statusDesign: "circular",
    hudScale: 1,
    speedometerType: "car",
    speedometerConfigs: DEFAULT_SPEEDOMETER_CONFIGS,
    minimapShape: "square",
};
