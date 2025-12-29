export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  visible: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export type WidgetType = 
  | 'health'
  | 'armor'
  | 'hunger'
  | 'thirst'
  | 'stamina'
  | 'money'
  | 'clock'
  | 'compass'
  | 'location'
  | 'voice'
  | 'minimap'
  | 'speedometer';

export interface HUDLayoutState {
  widgets: WidgetConfig[];
  editMode: boolean;
  snapToGrid: boolean;
  showSafezone: boolean;
  gridSize: number;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Bottom left - Status bar (horizontal)
  { id: 'health', type: 'health', position: { x: 220, y: 660 }, visible: true, size: 'md' },
  { id: 'armor', type: 'armor', position: { x: 280, y: 660 }, visible: true, size: 'md' },
  { id: 'hunger', type: 'hunger', position: { x: 340, y: 660 }, visible: true, size: 'md' },
  { id: 'thirst', type: 'thirst', position: { x: 400, y: 660 }, visible: true, size: 'md' },
  { id: 'stamina', type: 'stamina', position: { x: 460, y: 660 }, visible: true, size: 'md' },
  
  // Top right corner - Money & Clock
  { id: 'money', type: 'money', position: { x: 1180, y: 20 }, visible: true },
  { id: 'clock', type: 'clock', position: { x: 1380, y: 20 }, visible: true },
  
  // Bottom left - above minimap
  { id: 'location', type: 'location', position: { x: 20, y: 580 }, visible: true },
  { id: 'minimap', type: 'minimap', position: { x: 20, y: 610 }, visible: true },
  
  // Center bottom - Voice
  { id: 'voice', type: 'voice', position: { x: 640, y: 660 }, visible: true },
  
  // Bottom right - Vehicle
  { id: 'speedometer', type: 'speedometer', position: { x: 1200, y: 480 }, visible: true },
  
  // Top center - Compass
  { id: 'compass', type: 'compass', position: { x: 640, y: 20 }, visible: true },
];
