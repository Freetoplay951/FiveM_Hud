import { create } from "zustand";
import { DisabledWidgets } from "@/types/hud";
import { WidgetType } from "@/types/widget";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

/**
 * HUD Global Store - ONLY for cross-cutting concerns
 * Does NOT contain any widget-specific data
 */
interface HUDGlobalStore {
    // Visibility
    isVisible: boolean;
    isDemoMode: boolean;

    // Disabled widgets (server-controlled)
    disabledWidgets: DisabledWidgets;

    // Actions
    setIsVisible: (visible: boolean) => void;
    setDisabledWidgets: (widgets: DisabledWidgets) => void;
    isWidgetDisabled: (widgetId: string) => boolean;
}

export const useHUDGlobalStore = create<HUDGlobalStore>((set, get) => ({
    isVisible: !isNuiEnvironment(),
    isDemoMode: !isNuiEnvironment(),
    disabledWidgets: {},

    setIsVisible: (visible) => set({ isVisible: visible }),

    setDisabledWidgets: (widgets) => set({ disabledWidgets: widgets }),

    isWidgetDisabled: (widgetId) => {
        return get().disabledWidgets[widgetId as WidgetType] === true;
    },
}));

// Selectors
export const useIsVisible = () => useHUDGlobalStore((state) => state.isVisible);
export const useIsDemoMode = () => useHUDGlobalStore((state) => state.isDemoMode);
export const useDisabledWidgets = () => useHUDGlobalStore((state) => state.disabledWidgets);
