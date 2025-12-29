import { useState, useCallback, useEffect } from 'react';
import { HUDLayoutState, WidgetConfig, WidgetPosition, DEFAULT_HUD_STATE, DEFAULT_WIDGETS, StatusDesign, SpeedometerType, DEFAULT_SPEEDOMETER_SCALES } from '@/types/widget';
import { snapPositionToGrid } from '@/lib/snapUtils';

const STORAGE_KEY = 'hud-layout';

export const useHUDLayout = () => {
  const [state, setState] = useState<HUDLayoutState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new properties
        return { ...DEFAULT_HUD_STATE, ...parsed };
      } catch {
        return DEFAULT_HUD_STATE;
      }
    }
    return DEFAULT_HUD_STATE;
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
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === id ? { ...w, position } : w
      ),
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

  const updateSpeedometerScale = useCallback((type: SpeedometerType, scale: number) => {
    setState(prev => ({
      ...prev,
      speedometerScales: { ...prev.speedometerScales, [type]: scale },
    }));
  }, []);

  const getSpeedometerScale = useCallback((type: SpeedometerType): number => {
    return state.speedometerScales?.[type] ?? 1;
  }, [state.speedometerScales]);

  const resetLayout = useCallback(() => {
    setState(prev => {
      const widgetsToUse = prev.snapToGrid 
        ? DEFAULT_WIDGETS.map(w => ({
            ...w,
            position: snapPositionToGrid(w.position, prev.gridSize),
          }))
        : DEFAULT_WIDGETS;
      
      return {
        ...DEFAULT_HUD_STATE,
        editMode: true,
        snapToGrid: prev.snapToGrid,
        widgets: widgetsToUse,
      };
    });
  }, []);

  const resetWidget = useCallback((id: string) => {
    const defaultWidget = DEFAULT_WIDGETS.find(w => w.id === id);
    if (!defaultWidget) return;
    
    setState(prev => {
      const newPosition = prev.snapToGrid 
        ? snapPositionToGrid(defaultWidget.position, prev.gridSize)
        : defaultWidget.position;
      
      return {
        ...prev,
        widgets: prev.widgets.map(w => 
          w.id === id ? { ...w, position: newPosition, scale: defaultWidget.scale ?? 1 } : w
        ),
      };
    });
  }, []);

  const getWidget = useCallback((id: string): WidgetConfig | undefined => {
    return state.widgets.find(w => w.id === id);
  }, [state.widgets]);

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
    updateSpeedometerScale,
    getSpeedometerScale,
    resetLayout,
    resetWidget,
    getWidget,
  };
};