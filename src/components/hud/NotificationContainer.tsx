import { AnimatePresence } from "framer-motion";
import { NotificationData } from "@/types/hud";
import { NeonNotification } from "./NeonNotification";

interface NotificationContainerProps {
    notifications: NotificationData[];
    onClose: (id: string) => void;
    isWidget?: boolean;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;

export const NotificationContainer = ({ notifications, onClose, isWidget = false }: NotificationContainerProps) => {
    // Neueste zuerst anzeigen
    const orderedNotifications = [...notifications].reverse().slice(0, MAX_VISIBLE_NOTIFICATIONS);

    return (
        <div
            className={
                isWidget
                    ? "flex flex-col gap-2 pointer-events-auto"
                    : "fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto"
            }>
            <AnimatePresence mode="popLayout">
                {orderedNotifications.map((notification, index) => {
                    return (
                        <div key={notification.id}>
                            <NeonNotification
                                notification={notification}
                                onClose={onClose}
                            />
                        </div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
