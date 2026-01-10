import { memo, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

// Memoized static icon to prevent re-renders
const ClockIcon = memo(() => (
    <Clock
        size={14}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
ClockIcon.displayName = "ClockIcon";

// Static animation config - defined outside component
const motionConfig = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
} as const;

const getCurrentTime = () =>
    new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });

const ClockWidgetComponent = () => {
    const [currentTime, setCurrentTime] = useState(getCurrentTime);
    
    // Performance logging
    useRenderLogger("ClockWidget", { currentTime });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Memoize the time style to prevent object recreation
    const timeStyle = useMemo(() => ({
        textShadow: "0 0 8px hsl(var(--primary) / 0.4)"
    }), []);

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2"
            {...motionConfig}>
            <ClockIcon />
            <span className="hud-number text-sm text-foreground" style={timeStyle}>
                {currentTime}
            </span>
        </motion.div>
    );
};

export const ClockWidget = memo(ClockWidgetComponent);
