import { useState, useCallback, useEffect } from 'react';
import {
  HUDLayoutState,
  WidgetConfig,
  WidgetPosition,
  DEFAULT_HUD_STATE,
  DEFAULT_WIDGETS,
  StatusDesign,
  SpeedometerType,
  DEFAULT_SPEEDOMETER_CONFIGS,
  SpeedometerConfig,
  SpeedometerConfigs,
  REFERENCE_WIDTH,
  REFERENCE_HEIGHT,
  MinimapShape,
} from '@/types/widget';

const STORAGE_KEY = 'hud-layout';

// Scale position from reference resolution to current viewport
export const scalePositionToViewport = (pos: WidgetPosition): WidgetPosition => {
  const scaleX = window.innerWidth / REFERENCE_WIDTH;
  const scaleY = window.innerHeight / REFERENCE_HEIGHT;
  return {
    x: pos.x * scaleX,
    y: pos.y * scaleY,
  };
};

// Scale position from current viewport to reference resolution
export const scalePositionToReference = (pos: WidgetPosition): WidgetPosition => {
  const scaleX = window.innerWidth / REFERENCE_WIDTH;
  const scaleY = window.innerHeight / REFERENCE_HEIGHT;
  return {
    x: pos.x / scaleX,
    y: pos.y / scaleY,
  };
};

// Clamp position to reference resolution bounds
const clampPosition = (pos: WidgetPosition): WidgetPosition => ({
  x: Math.max(0, Math.min(REFERENCE_WIDTH - 50, pos.x)),
  y: Math.max(0, Math.min(REFERENCE_HEIGHT - 50, pos.y)),
});

const clampAllWidgets = (widgets: WidgetConfig[]): WidgetConfig[] =>
  widgets.map((w) => ({
    ...w,
    position: clampPosition(w.position),
  }));

const clampSpeedometerConfigs = (configs: SpeedometerConfigs): SpeedometerConfigs => ({
  car: { ...configs.car, position: clampPosition(configs.car.position) },
  plane: { ...configs.plane, position: clampPosition(configs.plane.position) },
  boat: { ...configs.boat, position: clampPosition(configs.boat.position) },
  helicopter: { ...configs.helicopter, position: clampPosition(configs.helicopter.position) },
});

const normalizeState = (raw: HUDLayoutState): HUDLayoutState => {
  const next: HUDLayoutState = {
    ...DEFAULT_HUD_STATE,
    ...raw,
  };

  next.widgets = clampAllWidgets(next.widgets ?? DEFAULT_WIDGETS);
  next.speedometerConfigs = clampSpeedometerConfigs(
    (next.speedometerConfigs ?? DEFAULT_SPEEDOMETER_CONFIGS) as SpeedometerConfigs
  );
  next.minimapShape = next.minimapShape ?? 'square';

  return next;
};

export const useHUDLayout = () => {
  const [state, setState] = useState<HUDLayoutState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: if old percent-based positions detected, reset to defaults
        if (parsed.widgets?.[0]?.position?.xPercent !== undefined) {
          console.log('Migrating from percent to pixel positions...');
          return normalizeState(DEFAULT_HUD_STATE);
        }
        return normalizeState(parsed);
      } catch {
        return normalizeState(DEFAULT_HUD_STATE);
      }
    }
    return normalizeState(DEFAULT_HUD_STATE);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const toggleEditMode = useCallback(() => {
    setState(prev => ({ ...prev, editMode: !prev.editMode }));
  }, []);

  const setSnapToGrid = useCallback((snap: boolean) => {
    setState(prev => ({ ...prev, snapToGrid: snap }));
  }, []);

  const updateWidgetPosition = useCallback((id: string, position: WidgetPosition) => {
    // Convert viewport position to reference position for storage
    const refPosition = scalePositionToReference(position);
    const clampedPosition = clampPosition(refPosition);
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, position: clampedPosition } : w)),
    }));
  }, []);

  const updateWidgetScale = useCallback((id: string, scale: number) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === id ? { ...w, scale } : w
      ),
    }));
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  const setStatusDesign = useCallback((design: StatusDesign) => {
    setState(prev => ({ ...prev, statusDesign: design }));
  }, []);

  const setHudScale = useCallback((scale: number) => {
    setState(prev => ({ ...prev, hudScale: scale }));
  }, []);

  const setSpeedometerType = useCallback((type: SpeedometerType) => {
    setState(prev => ({ ...prev, speedometerType: type }));
  }, []);

  const setMinimapShape = useCallback((shape: MinimapShape) => {
    setState(prev => ({ ...prev, minimapShape: shape }));
  }, []);

  const updateSpeedometerConfig = useCallback((type: SpeedometerType, config: Partial<SpeedometerConfig>) => {
    setState(prev => ({
      ...prev,
      speedometerConfigs: {
        ...prev.speedometerConfigs,
        [type]: { ...prev.speedometerConfigs[type], ...config },
      },
    }));
  }, []);

  const getSpeedometerConfig = useCallback((type: SpeedometerType): SpeedometerConfig => {
    return state.speedometerConfigs?.[type] ?? DEFAULT_SPEEDOMETER_CONFIGS[type];
  }, [state.speedometerConfigs]);

  const resetSpeedometer = useCallback((type: SpeedometerType) => {
    setState(prev => {
      const defaultConfig = DEFAULT_SPEEDOMETER_CONFIGS[type];
      return {
        ...prev,
        speedometerConfigs: {
          ...prev.speedometerConfigs,
          [type]: { position: defaultConfig.position, scale: 1 },
        },
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setState(prev => ({
      ...DEFAULT_HUD_STATE,
      editMode: true,
      snapToGrid: prev.snapToGrid,
    }));
  }, []);

  const resetWidget = useCallback((id: string) => {
    const defaultWidget = DEFAULT_WIDGETS.find(w => w.id === id);
    if (!defaultWidget) return;
    
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === id ? { ...w, position: defaultWidget.position, scale: defaultWidget.scale ?? 1 } : w
      ),
    }));
  }, []);

  const getWidget = useCallback((id: string): WidgetConfig | undefined => {
    return state.widgets.find(w => w.id === id);
  }, [state.widgets]);

  // Get scaled position for rendering
  const getScaledPosition = useCallback((pos: WidgetPosition): WidgetPosition => {
    return scalePositionToViewport(pos);
  }, []);

  return {
    ...state,
    toggleEditMode,
    setSnapToGrid,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    setStatusDesign,
    setHudScale,
    setSpeedometerType,
    setMinimapShape,
    updateSpeedometerConfig,
    getSpeedometerConfig,
    resetSpeedometer,
    resetLayout,
    resetWidget,
    getWidget,
    getScaledPosition,
  };
};
