import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { NotificationData } from "@/types/hud";
import { cn } from "@/lib/utils";

interface NeonNotificationProps {
    notification: NotificationData;
    onClose: (id: string) => void;
}

const NOTIFICATION_CONFIG = {
    success: { icon: CheckCircle, color: "cash", label: "Erfolg" },
    error: { icon: XCircle, color: "critical", label: "Fehler" },
    warning: { icon: AlertTriangle, color: "warning", label: "Warnung" },
    info: { icon: Info, color: "armor", label: "Info" },
};

export const NeonNotification = ({ notification, onClose }: NeonNotificationProps) => {
    const config = NOTIFICATION_CONFIG[notification.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-panel rounded-lg p-3 min-w-[280px] max-w-[360px] relative overflow-hidden"
            style={{
                boxShadow: `0 0 20px hsl(var(--${config.color}) / 0.3), inset 0 0 10px hsl(var(--${config.color}) / 0.1)`,
            }}>
            {/* Glow line on left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                style={{
                    backgroundColor: `hsl(var(--${config.color}))`,
                    boxShadow: `0 0 10px hsl(var(--${config.color}) / 0.8)`,
                }}
            />

            <div className="flex items-start gap-3 ml-2">
                <Icon
                    size={20}
                    style={{
                        color: `hsl(var(--${config.color}))`,
                        filter: `drop-shadow(0 0 4px hsl(var(--${config.color}) / 0.6))`,
                    }}
                />

                <div className="flex-1">
                    <p
                        className="text-sm font-semibold text-foreground"
                        style={{ textShadow: `0 0 10px hsl(var(--${config.color}) / 0.3)` }}>
                        {notification.title}
                    </p>
                    {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                    )}
                </div>

                <button
                    onClick={() => onClose(notification.id)}
                    className="p-1 rounded hover:bg-muted/30 transition-colors">
                    <X
                        size={14}
                        className="text-muted-foreground"
                    />
                </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            {notification.duration != undefined && notification.duration > 0 && (
                <motion.div
                    className="absolute bottom-0 left-0 h-0.5 rounded-b-lg"
                    style={{ backgroundColor: `hsl(var(--${config.color}))` }}
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: notification.duration / 1000, ease: "linear" }}
                />
            )}
        </motion.div>
    );
};
