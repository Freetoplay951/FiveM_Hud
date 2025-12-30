import { AnimatePresence, motion } from "framer-motion";
import { NotificationData } from "@/types/hud";
import { NeonNotification } from "./Notification";

interface NotificationContainerProps {
    notifications: NotificationData[];
    onClose: (id: string) => void;
    isWidget?: boolean;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;
const NOTIFICATION_GAP = 8; // Gap between notifications

export const NotificationContainer = ({ notifications, onClose, isWidget = false }: NotificationContainerProps) => {
    const orderedNotifications = [...notifications].reverse().slice(0, MAX_VISIBLE_NOTIFICATIONS);

    // When used as a widget, render notifications in a simple flex column
    // so the HUDWidget can properly measure and position the container
    if (isWidget) {
        return (
            <div className="flex flex-col gap-2 pointer-events-auto min-w-[280px]">
                <AnimatePresence>
                    {orderedNotifications.map((notification, index) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{ zIndex: orderedNotifications.length - index }}>
                            <NeonNotification
                                notification={notification}
                                onClose={onClose}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    }

    // Non-widget mode: fixed position with absolute notification stacking
    return (
        <div className="fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto">
            <AnimatePresence>
                {orderedNotifications.map((notification, index) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{ zIndex: orderedNotifications.length - index }}>
                        <NeonNotification
                            notification={notification}
                            onClose={onClose}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
