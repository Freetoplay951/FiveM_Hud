import { AnimatePresence, motion } from "framer-motion";
import { NotificationData } from "@/types/hud";
import { Notification } from "./Notification";

interface NotificationContainerProps {
    notifications: NotificationData[];
    onClose: (id: string) => void;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;

// Minimum size for widget measurement when no notifications are present
const PLACEHOLDER_HEIGHT = 60;

export const NotificationContainer = ({ notifications, onClose }: NotificationContainerProps) => {
    const orderedNotifications = [...notifications].slice(-MAX_VISIBLE_NOTIFICATIONS).reverse();
    const hasNotifications = orderedNotifications.length > 0;

    // When used as a widget, render notifications in a simple flex column
    // Notifications grow downward from the widget's set position
    // Always render a minimum-sized container for widget size measurement
    return (
        <div 
            className="flex flex-col gap-2 pointer-events-auto min-w-[280px]"
            style={{ minHeight: hasNotifications ? undefined : PLACEHOLDER_HEIGHT }}>
            <AnimatePresence mode="popLayout">
                {orderedNotifications.map((notification, index) => (
                    <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{ zIndex: MAX_VISIBLE_NOTIFICATIONS - index }}>
                        <Notification
                            notification={notification}
                            onClose={onClose}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
