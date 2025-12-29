// Position as percentage of viewport (0-100)
export interface WidgetPosition {
  xPercent: number;
  yPercent: number;
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
  size?: 'sm' | 'md' | 'lg';
  scale?: number;
}

export type WidgetType = 
  | 'health'
  | 'armor'
  | 'hunger'
  | 'thirst'
  | 'stamina'
  | 'stress'
  | 'oxygen'
  | 'money'
  | 'clock'
  | 'compass'
  | 'voice'
  | 'minimap'
  | 'speedometer'
  | 'notifications';

export type StatusDesign = 'circular' | 'bar' | 'vertical' | 'minimal' | 'arc';

export type SpeedometerType = 'car' | 'plane' | 'boat' | 'helicopter';

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

export const DEFAULT_SPEEDOMETER_POSITION: WidgetPosition = { xPercent: 78, yPercent: 60 };

export const DEFAULT_SPEEDOMETER_CONFIGS: SpeedometerConfigs = {
  car: { position: { ...DEFAULT_SPEEDOMETER_POSITION }, scale: 1 },
  plane: { position: { ...DEFAULT_SPEEDOMETER_POSITION }, scale: 1 },
  boat: { position: { ...DEFAULT_SPEEDOMETER_POSITION }, scale: 1 },
  helicopter: { position: { ...DEFAULT_SPEEDOMETER_POSITION }, scale: 1 },
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

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Top left - Compass
  { id: 'compass', type: 'compass', position: { xPercent: 1.5, yPercent: 2 }, visible: true, scale: 1 },
  
  // Top center - Clock
  { id: 'clock', type: 'clock', position: { xPercent: 48, yPercent: 2 }, visible: true, scale: 1 },
  
  // Top right - Money
  { id: 'money', type: 'money', position: { xPercent: 85, yPercent: 2 }, visible: true, scale: 1 },
  
  // Left middle (slightly upper) - Notifications
  { id: 'notifications', type: 'notifications', position: { xPercent: 1.5, yPercent: 25 }, visible: true, scale: 1 },
  
  // Bottom left - Minimap (Location is inside minimap)
  { id: 'minimap', type: 'minimap', position: { xPercent: 1.5, yPercent: 72 }, visible: true, scale: 1 },
  
  // Next to minimap - Status icons
  { id: 'health', type: 'health', position: { xPercent: 16, yPercent: 90 }, visible: true, size: 'md', scale: 1 },
  { id: 'armor', type: 'armor', position: { xPercent: 20, yPercent: 90 }, visible: true, size: 'md', scale: 1 },
  { id: 'hunger', type: 'hunger', position: { xPercent: 24, yPercent: 90 }, visible: true, size: 'md', scale: 1 },
  { id: 'thirst', type: 'thirst', position: { xPercent: 28, yPercent: 90 }, visible: true, size: 'md', scale: 1 },
  { id: 'stamina', type: 'stamina', position: { xPercent: 32, yPercent: 90 }, visible: true, size: 'md', scale: 1 },
  { id: 'stress', type: 'stress', position: { xPercent: 36, yPercent: 90 }, visible: false, size: 'md', scale: 1 },
  { id: 'oxygen', type: 'oxygen', position: { xPercent: 40, yPercent: 90 }, visible: false, size: 'md', scale: 1 },
  
  // Voice
  { id: 'voice', type: 'voice', position: { xPercent: 48, yPercent: 92 }, visible: true, scale: 1 },
  
  // Bottom right - Speedometer
  { id: 'speedometer', type: 'speedometer', position: { xPercent: 78, yPercent: 60 }, visible: true, scale: 1 },
];

export const DEFAULT_HUD_STATE: HUDLayoutState = {
  widgets: DEFAULT_WIDGETS,
  editMode: false,
  snapToGrid: true,
  gridSize: 20,
  statusDesign: 'circular',
  hudScale: 1,
  speedometerType: 'car',
  speedometerConfigs: DEFAULT_SPEEDOMETER_CONFIGS,
};