import { AnimatePresence } from 'framer-motion';
import { NotificationData } from '@/types/hud';
import { NeonNotification } from './NeonNotification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
  isWidget?: boolean;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;
const NOTIFICATION_HEIGHT = 70; // Approximate height of each notification
const NOTIFICATION_GAP = 8; // Gap between notifications

export const NotificationContainer = ({ notifications, onClose, isWidget = false }: NotificationContainerProps) => {
  // Keep notifications in order: oldest first, newest last
  // Newest notification is always at the configured Y position (top of container)
  // Older notifications get pushed down
  const orderedNotifications = [...notifications].reverse();
  
  // If more than MAX_VISIBLE_NOTIFICATIONS, stack older ones
  const shouldStack = orderedNotifications.length > MAX_VISIBLE_NOTIFICATIONS;
  
  return (
    <div className={isWidget ? "relative pointer-events-auto" : "fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto"}>
      <AnimatePresence mode="popLayout">
        {orderedNotifications.map((notification, index) => {
          // Newest notification (index 0) is at top (y=0)
          // Older notifications stack below
          const isStacked = shouldStack && index >= MAX_VISIBLE_NOTIFICATIONS;
          
          // Calculate Y offset: each notification pushes older ones down
          const yOffset = index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP);
          
          // Stacked notifications (beyond MAX) get compressed
          const stackOffset = isStacked 
            ? MAX_VISIBLE_NOTIFICATIONS * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP) + (index - MAX_VISIBLE_NOTIFICATIONS) * 4
            : yOffset;
          
          return (
            <div
              key={notification.id}
              style={{
                position: isWidget ? 'absolute' : undefined,
                top: isWidget ? `${stackOffset}px` : undefined,
                left: isWidget ? 0 : undefined,
                right: isWidget ? 0 : undefined,
                zIndex: isStacked ? -index : orderedNotifications.length - index,
                opacity: isStacked ? 0.7 : 1,
              }}
            >
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
