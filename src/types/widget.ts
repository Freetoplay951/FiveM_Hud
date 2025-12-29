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
  | 'location'
  | 'voice'
  | 'minimap'
  | 'speedometer'
  | 'notifications';

export type StatusDesign = 'circular' | 'bar' | 'vertical' | 'minimal' | 'arc';

export type SpeedometerType = 'car' | 'plane' | 'boat' | 'helicopter';

export interface HUDLayoutState {
  widgets: WidgetConfig[];
  editMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  statusDesign: StatusDesign;
  hudScale: number;
  speedometerType: SpeedometerType;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Top left - Compass
  { id: 'compass', type: 'compass', position: { x: 20, y: 20 }, visible: true, scale: 1 },
  
  // Top center - Clock
  { id: 'clock', type: 'clock', position: { x: 640, y: 20 }, visible: true, scale: 1 },
  
  // Top right - Money
  { id: 'money', type: 'money', position: { x: 1180, y: 20 }, visible: true, scale: 1 },
  
  // Left middle (slightly upper) - Notifications
  { id: 'notifications', type: 'notifications', position: { x: 20, y: 200 }, visible: true, scale: 1 },
  
  // Bottom left - Location above Minimap
  { id: 'location', type: 'location', position: { x: 20, y: 560 }, visible: true, scale: 1 },
  { id: 'minimap', type: 'minimap', position: { x: 20, y: 590 }, visible: true, scale: 1 },
  
  // Next to minimap - Status icons
  { id: 'health', type: 'health', position: { x: 220, y: 640 }, visible: true, size: 'md', scale: 1 },
  { id: 'armor', type: 'armor', position: { x: 280, y: 640 }, visible: true, size: 'md', scale: 1 },
  { id: 'hunger', type: 'hunger', position: { x: 340, y: 640 }, visible: true, size: 'md', scale: 1 },
  { id: 'thirst', type: 'thirst', position: { x: 400, y: 640 }, visible: true, size: 'md', scale: 1 },
  { id: 'stamina', type: 'stamina', position: { x: 460, y: 640 }, visible: true, size: 'md', scale: 1 },
  { id: 'stress', type: 'stress', position: { x: 520, y: 640 }, visible: false, size: 'md', scale: 1 },
  { id: 'oxygen', type: 'oxygen', position: { x: 580, y: 640 }, visible: false, size: 'md', scale: 1 },
  
  // Voice
  { id: 'voice', type: 'voice', position: { x: 640, y: 660 }, visible: true, scale: 1 },
  
  // Bottom right - Speedometer
  { id: 'speedometer', type: 'speedometer', position: { x: 1200, y: 480 }, visible: true, scale: 1 },
];

export const DEFAULT_HUD_STATE: HUDLayoutState = {
  widgets: DEFAULT_WIDGETS,
  editMode: false,
  snapToGrid: true,
  gridSize: 20,
  statusDesign: 'circular',
  hudScale: 1,
  speedometerType: 'car',
};