import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

export const ClockWidget = () => {
    const getCurrentTime = () =>
        new Date().toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
        });

    const [currentTime, setCurrentTime] = useState(getCurrentTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}>
            <Clock
                size={14}
                className="text-primary"
                style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
            />
            <span
                className="hud-number text-sm text-foreground"
                style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.4)" }}>
                {currentTime}
            </span>
        </motion.div>
    );
};
