import { create } from "zustand";
import { NotificationData } from "@/types/hud";

let notificationId = 0;

interface NotificationStore {
    notifications: NotificationData[];
    
    // Actions
    addNotification: (type: NotificationData["type"], title: string, message?: string, duration?: number) => string;
    removeNotification: (id: string) => void;
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],

    addNotification: (type, title, message, duration = 5000) => {
        const id = `notification-${notificationId++}`;
        const notification: NotificationData = {
            id,
            type,
            title,
            message,
            duration,
        };

        set((state) => ({
            notifications: [...state.notifications, notification],
        }));

        if (duration > 0) {
            setTimeout(() => {
                get().removeNotification(id);
            }, duration);
        }

        return id;
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },

    success: (title, message, duration) => {
        return get().addNotification("success", title, message, duration);
    },

    error: (title, message, duration) => {
        return get().addNotification("error", title, message, duration);
    },

    warning: (title, message, duration) => {
        return get().addNotification("warning", title, message, duration);
    },

    info: (title, message, duration) => {
        return get().addNotification("info", title, message, duration);
    },
}));

// Selectors - these are stable and won't cause re-renders in non-subscribed components
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useRemoveNotification = () => useNotificationStore((state) => state.removeNotification);

// Action-only selectors (stable references)
export const useNotificationActions = () => {
    const success = useNotificationStore((state) => state.success);
    const error = useNotificationStore((state) => state.error);
    const warning = useNotificationStore((state) => state.warning);
    const info = useNotificationStore((state) => state.info);
    
    return { success, error, warning, info };
};
