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
  { id: 'health', type: 'health', position: { x: 180, y: 680 }, visible: true, size: 'md' },
  { id: 'armor', type: 'armor', position: { x: 240, y: 680 }, visible: true, size: 'md' },
  { id: 'hunger', type: 'hunger', position: { x: 300, y: 680 }, visible: true, size: 'md' },
  { id: 'thirst', type: 'thirst', position: { x: 360, y: 680 }, visible: true, size: 'md' },
  { id: 'stamina', type: 'stamina', position: { x: 420, y: 680 }, visible: true, size: 'md' },
  { id: 'money', type: 'money', position: { x: 1280, y: 20 }, visible: true },
  { id: 'clock', type: 'clock', position: { x: 1350, y: 20 }, visible: true },
  { id: 'location', type: 'location', position: { x: 180, y: 620 }, visible: true },
  { id: 'voice', type: 'voice', position: { x: 700, y: 680 }, visible: true },
  { id: 'minimap', type: 'minimap', position: { x: 20, y: 520 }, visible: true },
  { id: 'speedometer', type: 'speedometer', position: { x: 1200, y: 550 }, visible: true },
  { id: 'compass', type: 'compass', position: { x: 1100, y: 300 }, visible: true },
];
