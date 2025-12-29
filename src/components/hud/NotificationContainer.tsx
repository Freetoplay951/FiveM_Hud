import { AnimatePresence } from 'framer-motion';
import { NotificationData } from '@/types/hud';
import { NeonNotification } from './NeonNotification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
  isWidget?: boolean;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;
const STACK_OFFSET = 4; // pixels between stacked notifications

export const NotificationContainer = ({ notifications, onClose, isWidget = false }: NotificationContainerProps) => {
  // Reverse so newest is first (will be at top)
  const orderedNotifications = [...notifications].reverse();
  
  // If more than MAX_VISIBLE_NOTIFICATIONS, stack older ones
  const shouldStack = orderedNotifications.length > MAX_VISIBLE_NOTIFICATIONS;
  
  return (
    <div className={isWidget ? "flex flex-col gap-2 pointer-events-auto" : "fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto"}>
      <AnimatePresence mode="popLayout">
        {orderedNotifications.map((notification, index) => {
          // Stacking logic: if more than MAX, stack the older ones
          const isStacked = shouldStack && index >= MAX_VISIBLE_NOTIFICATIONS;
          const stackIndex = isStacked ? index - MAX_VISIBLE_NOTIFICATIONS : 0;
          
          return (
            <div
              key={notification.id}
              style={isStacked ? {
                position: 'absolute',
                top: `${(MAX_VISIBLE_NOTIFICATIONS) * 70 + stackIndex * STACK_OFFSET}px`,
                left: 0,
                right: 0,
                zIndex: -stackIndex,
              } : undefined}
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
