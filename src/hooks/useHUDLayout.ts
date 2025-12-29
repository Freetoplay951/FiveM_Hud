import { useState, useCallback, useEffect } from 'react';
import { HUDLayoutState, WidgetConfig, WidgetPosition, DEFAULT_WIDGETS } from '@/types/widget';

const STORAGE_KEY = 'hud-layout';

export const useHUDLayout = () => {
  const [state, setState] = useState<HUDLayoutState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          widgets: DEFAULT_WIDGETS,
          editMode: false,
          snapToGrid: true,
          showSafezone: false,
          gridSize: 20,
        };
      }
    }
    return {
      widgets: DEFAULT_WIDGETS,
      editMode: false,
      snapToGrid: true,
      showSafezone: false,
      gridSize: 20,
    };
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

  const resetLayout = useCallback(() => {
    setState({
      widgets: DEFAULT_WIDGETS,
      editMode: true,
      snapToGrid: true,
      showSafezone: false,
      gridSize: 20,
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
    resetLayout,
    getWidget,
  };
};
