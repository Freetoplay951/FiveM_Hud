import { create } from "zustand";
import { DisabledWidgets } from "@/types/hud";
import { WidgetType } from "@/types/widget";
import { isNuiEnvironment } from "@/lib/nuiUtils";

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

    // Async widget readiness tracking (widgets register themselves)
    pendingAsyncWidgets: Set<string>;
    readyAsyncWidgets: Set<string>;

    // Actions
    setIsVisible: (visible: boolean) => void;
    setDisabledWidgets: (widgets: DisabledWidgets) => void;
    isWidgetDisabled: (widgetId: string) => boolean;

    // Async widget actions
    registerAsyncWidget: (widgetId: string) => void;
    unregisterAsyncWidget: (widgetId: string) => void;
    markWidgetReady: (widgetId: string) => void;
    areAllAsyncWidgetsReady: () => boolean;
}

export const useHUDGlobalStore = create<HUDGlobalStore>((set, get) => ({
    isVisible: !isNuiEnvironment(),
    isDemoMode: !isNuiEnvironment(),
    disabledWidgets: {},
    pendingAsyncWidgets: new Set(),
    readyAsyncWidgets: new Set(),

    setIsVisible: (visible) => set({ isVisible: visible }),

    setDisabledWidgets: (widgets) => set({ disabledWidgets: widgets }),

    isWidgetDisabled: (widgetId) => {
        return get().disabledWidgets[widgetId as WidgetType] === true;
    },

    registerAsyncWidget: (widgetId) => {
        const { pendingAsyncWidgets, readyAsyncWidgets } = get();
        if (!pendingAsyncWidgets.has(widgetId)) {
            console.log(`[HUD] Async widget "${widgetId}" registered`);
            const newPending = new Set([...pendingAsyncWidgets, widgetId]);
            // Remove from ready if it was there (re-registering)
            const newReady = new Set([...readyAsyncWidgets]);
            newReady.delete(widgetId);
            set({ pendingAsyncWidgets: newPending, readyAsyncWidgets: newReady });
        }
    },

    unregisterAsyncWidget: (widgetId) => {
        const { pendingAsyncWidgets, readyAsyncWidgets } = get();
        const newPending = new Set([...pendingAsyncWidgets]);
        const newReady = new Set([...readyAsyncWidgets]);
        newPending.delete(widgetId);
        newReady.delete(widgetId);
        set({ pendingAsyncWidgets: newPending, readyAsyncWidgets: newReady });
    },

    markWidgetReady: (widgetId) => {
        const { pendingAsyncWidgets, readyAsyncWidgets } = get();
        if (pendingAsyncWidgets.has(widgetId) && !readyAsyncWidgets.has(widgetId)) {
            const newReady = new Set([...readyAsyncWidgets, widgetId]);
            console.log(`[HUD] Widget "${widgetId}" marked as ready (${newReady.size}/${pendingAsyncWidgets.size})`);
            set({ readyAsyncWidgets: newReady });
        }
    },

    areAllAsyncWidgetsReady: () => {
        const { pendingAsyncWidgets, readyAsyncWidgets } = get();
        // If no async widgets are pending, we're ready
        if (pendingAsyncWidgets.size === 0) return true;
        // Check if all pending widgets are ready
        for (const widgetId of pendingAsyncWidgets) {
            if (!readyAsyncWidgets.has(widgetId)) {
                return false;
            }
        }
        return true;
    },
}));

// Selectors
export const useIsVisible = () => useHUDGlobalStore((state) => state.isVisible);
export const useIsDemoMode = () => useHUDGlobalStore((state) => state.isDemoMode);
export const useDisabledWidgets = () => useHUDGlobalStore((state) => state.disabledWidgets);
export const useAreAllAsyncWidgetsReady = () => useHUDGlobalStore((state) => state.areAllAsyncWidgetsReady());
