import { useState, useCallback, useEffect } from 'react';
import { HUDLayoutState, WidgetConfig, WidgetPosition, DEFAULT_HUD_STATE, StatusDesign } from '@/types/widget';

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

  const setShowSafezone = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showSafezone: show }));
  }, []);

  const updateWidgetPosition = useCallback((id: string, position: WidgetPosition) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === id ? { ...w, position } : w
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

  const resetLayout = useCallback(() => {
    setState({
      ...DEFAULT_HUD_STATE,
      editMode: true,
    });
  }, []);

  const getWidget = useCallback((id: string): WidgetConfig | undefined => {
    return state.widgets.find(w => w.id === id);
  }, [state.widgets]);

  return {
    ...state,
    toggleEditMode,
    setSnapToGrid,
    setShowSafezone,
    updateWidgetPosition,
    toggleWidgetVisibility,
    setStatusDesign,
    setHudScale,
    resetLayout,
    getWidget,
  };
};
