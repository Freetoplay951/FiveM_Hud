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
    | "notifications";

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

// Dynamic position helpers
const pos = (xPercent: number, yPercent: number, offsetX = 0, offsetY = 0): WidgetPosition => ({
    x: Math.round(getScreenWidth() * xPercent + offsetX),
    y: Math.round(getScreenHeight() * yPercent + offsetY),
});

// Status icon positions - dynamic based on screen size
const getStatusStartX = () => Math.round(getScreenWidth() * 0.12);
const getStatusY = () => Math.round(getScreenHeight() * 0.91);
const getStatusSpacing = () => Math.round(getScreenWidth() * 0.029);

// Default speedometer position (bottom right) - dynamic
const getDefaultSpeedoPos = (): WidgetPosition => pos(0.86, 0.79);

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
    car: { position: { x: 1650, y: 850 }, scale: 1 },
    plane: { position: { x: 1650, y: 850 }, scale: 1 },
    boat: { position: { x: 1650, y: 850 }, scale: 1 },
    helicopter: { position: { x: 1650, y: 850 }, scale: 1 },
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

        // Bottom left - Minimap
        { id: "minimap", type: "minimap", position: pos(0.01, 0.77), visible: true, scale: 1 },

        // Bottom - next to minimap - Status icons in horizontal row
        { id: "health", type: "health", position: { x: statusStartX, y: statusY }, visible: true, scale: 1 },
        { id: "armor", type: "armor", position: { x: statusStartX + statusSpacing, y: statusY }, visible: true, scale: 1 },
        { id: "hunger", type: "hunger", position: { x: statusStartX + statusSpacing * 2, y: statusY }, visible: true, scale: 1 },
        { id: "thirst", type: "thirst", position: { x: statusStartX + statusSpacing * 3, y: statusY }, visible: true, scale: 1 },
        { id: "stamina", type: "stamina", position: { x: statusStartX + statusSpacing * 4, y: statusY }, visible: true, scale: 1 },
        { id: "stress", type: "stress", position: { x: statusStartX + statusSpacing * 5, y: statusY }, visible: true, scale: 1 },
        { id: "oxygen", type: "oxygen", position: { x: statusStartX + statusSpacing * 6, y: statusY }, visible: true, scale: 1 },

        // Voice - centered bottom
        { id: "voice", type: "voice", position: pos(0.47, 0.93), visible: true, scale: 1 },

        // Bottom right - Speedometer
        { id: "speedometer", type: "speedometer", position: getDefaultSpeedoPos(), visible: true, scale: 1 },
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
