import { AnimatePresence, motion } from "framer-motion";
import { NotificationData } from "@/types/hud";
import { NeonNotification } from "./Notification";

interface NotificationContainerProps {
    notifications: NotificationData[];
    onClose: (id: string) => void;
    isWidget?: boolean;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;
const NOTIFICATION_HEIGHT = 70; // Approximate height of each notification
const NOTIFICATION_GAP = 8; // Gap between notifications

export const NotificationContainer = ({ notifications, onClose, isWidget = false }: NotificationContainerProps) => {
    const orderedNotifications = [...notifications].reverse().slice(0, MAX_VISIBLE_NOTIFICATIONS);

    return (
        <div
            className={
                isWidget
                    ? "relative pointer-events-auto"
                    : "fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto"
            }>
            <AnimatePresence>
                {orderedNotifications.map((notification, index) => {
                    // Calculate Y offset: each notification pushes older ones down
                    const yOffset = index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP);

                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20, top: yOffset }}
                            animate={{ opacity: 1, x: 0, top: yOffset }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{
                                position: isWidget ? "absolute" : undefined,
                                left: isWidget ? 0 : undefined,
                                right: isWidget ? 0 : undefined,
                                zIndex: orderedNotifications.length - index,
                            }}>
                            <NeonNotification
                                notification={notification}
                                onClose={onClose}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
