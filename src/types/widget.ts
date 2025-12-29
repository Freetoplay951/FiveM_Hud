// Position as percentage of viewport (0-100)
// xPercent/yPercent represent the CENTER of the widget
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

export const DEFAULT_SPEEDOMETER_POSITION: WidgetPosition = { xPercent: 85, yPercent: 80 };

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
  // Top left - Compass (center position)
  { id: 'compass', type: 'compass', position: { xPercent: 5, yPercent: 5 }, visible: true, scale: 1 },
  
  // Top center - Clock
  { id: 'clock', type: 'clock', position: { xPercent: 50, yPercent: 5 }, visible: true, scale: 1 },
  
  // Top right - Money
  { id: 'money', type: 'money', position: { xPercent: 92, yPercent: 5 }, visible: true, scale: 1 },
  
  // Left middle (slightly upper) - Notifications
  { id: 'notifications', type: 'notifications', position: { xPercent: 12, yPercent: 30 }, visible: true, scale: 1 },
  
  // Bottom left - Minimap (Location is inside minimap)
  { id: 'minimap', type: 'minimap', position: { xPercent: 10, yPercent: 82 }, visible: true, scale: 1 },
  
  // Next to minimap - Status icons
  { id: 'health', type: 'health', position: { xPercent: 22, yPercent: 94 }, visible: true, size: 'md', scale: 1 },
  { id: 'armor', type: 'armor', position: { xPercent: 26, yPercent: 94 }, visible: true, size: 'md', scale: 1 },
  { id: 'hunger', type: 'hunger', position: { xPercent: 30, yPercent: 94 }, visible: true, size: 'md', scale: 1 },
  { id: 'thirst', type: 'thirst', position: { xPercent: 34, yPercent: 94 }, visible: true, size: 'md', scale: 1 },
  { id: 'stamina', type: 'stamina', position: { xPercent: 38, yPercent: 94 }, visible: true, size: 'md', scale: 1 },
  { id: 'stress', type: 'stress', position: { xPercent: 42, yPercent: 94 }, visible: false, size: 'md', scale: 1 },
  { id: 'oxygen', type: 'oxygen', position: { xPercent: 46, yPercent: 94 }, visible: false, size: 'md', scale: 1 },
  
  // Voice
  { id: 'voice', type: 'voice', position: { xPercent: 50, yPercent: 94 }, visible: true, scale: 1 },
  
  // Bottom right - Speedometer
  { id: 'speedometer', type: 'speedometer', position: { xPercent: 85, yPercent: 80 }, visible: true, scale: 1 },
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