import { memo, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";
import { useTranslation } from "@/contexts/LanguageContext";

// Memoized static icon
const CalendarIcon = memo(() => (
    <Calendar
        size={14}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
CalendarIcon.displayName = "CalendarIcon";

// Static animation config
const motionConfig = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
} as const;

const DateWidgetComponent = () => {
    const { languages, language } = useTranslation();
    
    const getLocale = () => languages?.locale ?? "de-DE";

    const getCurrentDate = () =>
        new Date().toLocaleDateString(getLocale(), {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });

    const [currentDate, setCurrentDate] = useState(getCurrentDate);

    useRenderLogger("DateWidget", { currentDate });

    useEffect(() => {
        // Update date at midnight
        const now = new Date();
        const msUntilMidnight =
            new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
            now.getTime();

        const midnightTimeout = setTimeout(() => {
            setCurrentDate(getCurrentDate());
            // After first midnight, update every 24 hours
            const interval = setInterval(() => {
                setCurrentDate(getCurrentDate());
            }, 86400000);
            return () => clearInterval(interval);
        }, msUntilMidnight);

        return () => clearTimeout(midnightTimeout);
    }, [language]);

    // Update when language changes
    useEffect(() => {
        setCurrentDate(getCurrentDate());
    }, [language]);

    const dateStyle = useMemo(
        () => ({
            textShadow: "0 0 8px hsl(var(--primary) / 0.4)",
        }),
        []
    );

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2"
            {...motionConfig}>
            <CalendarIcon />
            <span
                className="hud-number text-sm text-foreground"
                style={dateStyle}>
                {currentDate}
            </span>
        </motion.div>
    );
};

export const DateWidget = memo(DateWidgetComponent);
