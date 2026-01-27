import { create } from "zustand";
import { DisabledWidgets } from "@/types/hud";
import { WidgetType } from "@/types/widget";
import { isNuiEnvironment } from "@/lib/nuiUtils";

/**
 * HUD Global Store - ONLY for cross-cutting concerns
 * Does NOT contain any widget-specific data
 *
 * Async Widget Readiness Pattern:
 * 1. Widgets register themselves via registerAsyncWidget() on mount
 * 2. HUD seals registration after one render cycle via sealRegistration()
 * 3. Widgets signal readiness via markWidgetReady() when their async work is done
 * 4. areAllAsyncWidgetsReady() returns true only after seal AND all widgets ready
 */
interface HUDGlobalStore {
    // Visibility
    isVisible: boolean;
    isDemoMode: boolean;

    // Disabled widgets (server-controlled)
    disabledWidgets: DisabledWidgets;

    // Async widget readiness tracking (barrier pattern)
    isRegistrationSealed: boolean;
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
    sealRegistration: () => void;
    resetRegistration: () => void;
    areAllAsyncWidgetsReady: () => boolean;
}

export const useHUDGlobalStore = create<HUDGlobalStore>((set, get) => ({
    isVisible: !isNuiEnvironment(),
    isDemoMode: !isNuiEnvironment(),
    disabledWidgets: {},
    isRegistrationSealed: false,
    pendingAsyncWidgets: new Set(),
    readyAsyncWidgets: new Set(),

    setIsVisible: (visible) => set({ isVisible: visible }),

    setDisabledWidgets: (widgets) => set({ disabledWidgets: widgets }),

    isWidgetDisabled: (widgetId) => {
        return get().disabledWidgets[widgetId as WidgetType] === true;
    },

    registerAsyncWidget: (widgetId) => {
        const { pendingAsyncWidgets, readyAsyncWidgets, isRegistrationSealed } = get();

        // Warn if trying to register after seal (programming error)
        if (isRegistrationSealed) {
            console.warn(`[HUD] Warning: Widget "${widgetId}" tried to register after registration was sealed`);
            return;
        }

        if (!pendingAsyncWidgets.has(widgetId)) {
            console.log(`[HUD] Async widget "${widgetId}" registered`);
            const newPending = new Set([...pendingAsyncWidgets, widgetId]);
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

    sealRegistration: () => {
        const { isRegistrationSealed, pendingAsyncWidgets } = get();
        if (!isRegistrationSealed) {
            console.log(`[HUD] Registration sealed with ${pendingAsyncWidgets.size} async widget(s)`);
            set({ isRegistrationSealed: true });
        }
    },

    resetRegistration: () => {
        console.log("[HUD] Registration reset");
        set({
            isRegistrationSealed: false,
            pendingAsyncWidgets: new Set(),
            readyAsyncWidgets: new Set(),
        });
    },

    areAllAsyncWidgetsReady: () => {
        const { isRegistrationSealed, pendingAsyncWidgets, readyAsyncWidgets } = get();

        // Must be sealed first - prevents premature "ready" before widgets register
        if (!isRegistrationSealed) return false;

        // If no async widgets registered, we're ready
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
export const useIsRegistrationSealed = () => useHUDGlobalStore((state) => state.isRegistrationSealed);
export const useAreAllAsyncWidgetsReady = () => useHUDGlobalStore((state) => state.areAllAsyncWidgetsReady());
