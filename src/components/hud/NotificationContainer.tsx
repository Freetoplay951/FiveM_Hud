import { AnimatePresence } from 'framer-motion';
import { NotificationData } from '@/types/hud';
import { NeonNotification } from './NeonNotification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onClose }: NotificationContainerProps) => {
  return (
    <div className="fixed top-4 right-16 z-50 flex flex-col gap-2 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NeonNotification
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
