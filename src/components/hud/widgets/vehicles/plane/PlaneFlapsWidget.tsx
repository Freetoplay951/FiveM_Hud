import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface PlaneFlapsWidgetProps {
    flaps: number;
    visible: boolean;
}

export const PlaneFlapsWidget = ({ flaps, visible }: PlaneFlapsWidgetProps) => {
    const { t } = useTranslation();
    const flapsOpen = flaps === 1;
    const flapsClosed = flaps === 0;
    const flapsChanging = !flapsClosed && !flapsOpen;

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-background/85 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 min-w-[52px]",
                flapsClosed && "border-critical/50",
                flapsOpen && "border-stamina/50",
                flapsChanging && "border-warning/50"
            )}>
            <div
                className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    flapsClosed ? "bg-critical" : !flapsOpen ? "bg-warning" : "bg-stamina"
                )}
                style={{
                    boxShadow: `0 0 6px hsl(var(--${flapsClosed ? "critical" : flapsChanging ? "warning" : "stamina"}))`,
                }}
            />
            <span className="text-[8px] text-muted-foreground">{t.vehicle.flaps.toUpperCase()}</span>
        </motion.div>
    );
};
