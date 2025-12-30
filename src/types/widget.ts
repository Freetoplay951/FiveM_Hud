// Position in pixels from top-left corner
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

// Default speedometer position (bottom right)
const DEFAULT_SPEEDO_POS: WidgetPosition = { x: 1650, y: 850 };

export const DEFAULT_SPEEDOMETER_CONFIGS: SpeedometerConfigs = {
    car: { position: DEFAULT_SPEEDO_POS, scale: 1 },
    plane: { position: DEFAULT_SPEEDO_POS, scale: 1 },
    boat: { position: DEFAULT_SPEEDO_POS, scale: 1 },
    helicopter: { position: DEFAULT_SPEEDO_POS, scale: 1 },
};

export interface HUDLayoutState {
    widgets: WidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    hudScale: number;
    speedometerType: SpeedometerType;
    speedometerConfigs: SpeedometerConfigs;
}

// Status icon positions next to minimap (bottom left, horizontal row)
// Minimap is at x:20, width ~200px, so status starts around x:230
const STATUS_Y = 980; // Near bottom
const STATUS_START_X = 230;
const STATUS_SPACING = 55;

export const DEFAULT_WIDGETS: WidgetConfig[] = [
    // Top left - Compass
    { id: "compass", type: "compass", position: { x: 20, y: 20 }, visible: true, scale: 1 },

    // Top center - Clock (centered at ~960 for 1920 width)
    { id: "clock", type: "clock", position: { x: 910, y: 20 }, visible: true, scale: 1 },

    // Top right - Money
    { id: "money", type: "money", position: { x: 1720, y: 20 }, visible: true, scale: 1 },

    // Middle left - Notifications
    { id: "notifications", type: "notifications", position: { x: 20, y: 350 }, visible: true, scale: 1 },

    // Bottom left - Minimap
    { id: "minimap", type: "minimap", position: { x: 20, y: 830 }, visible: true, scale: 1 },

    // Bottom - next to minimap - Status icons in horizontal row
    { id: "health", type: "health", position: { x: STATUS_START_X, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "armor", type: "armor", position: { x: STATUS_START_X + STATUS_SPACING, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "hunger", type: "hunger", position: { x: STATUS_START_X + STATUS_SPACING * 2, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "thirst", type: "thirst", position: { x: STATUS_START_X + STATUS_SPACING * 3, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "stamina", type: "stamina", position: { x: STATUS_START_X + STATUS_SPACING * 4, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "stress", type: "stress", position: { x: STATUS_START_X + STATUS_SPACING * 5, y: STATUS_Y }, visible: true, scale: 1 },
    { id: "oxygen", type: "oxygen", position: { x: STATUS_START_X + STATUS_SPACING * 6, y: STATUS_Y }, visible: true, scale: 1 },

    // Voice - centered bottom
    { id: "voice", type: "voice", position: { x: 900, y: 1000 }, visible: true, scale: 1 },

    // Bottom right - Speedometer
    { id: "speedometer", type: "speedometer", position: { x: 1650, y: 850 }, visible: true, scale: 1 },
];

export const DEFAULT_HUD_STATE: HUDLayoutState = {
    widgets: DEFAULT_WIDGETS,
    editMode: false,
    snapToGrid: true,
    gridSize: 10,
    statusDesign: "circular",
    hudScale: 1,
    speedometerType: "car",
    speedometerConfigs: DEFAULT_SPEEDOMETER_CONFIGS,
};
