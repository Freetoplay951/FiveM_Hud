import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface PlaneAltitudeWidgetProps {
    altitude: number;
    visible: boolean;
}

export const PlaneAltitudeWidget = ({ altitude, visible }: PlaneAltitudeWidgetProps) => {
    const { t } = useTranslation();
    const lowAltitude = altitude < 100;

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-1.5 py-0.5 w-[44px]">
            <span className="text-[6px] text-muted-foreground block text-center">{t.vehicle.alt}</span>
            <motion.span
                className={cn(
                    "hud-number text-[10px] tabular-nums block text-center",
                    lowAltitude ? "text-warning" : "text-armor"
                )}
                style={{
                    textShadow: `0 0 6px hsl(var(--${lowAltitude ? "warning" : "armor"}) / 0.6)`,
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {String(Math.round(altitude)).padStart(4, "0")}
            </motion.span>
        </motion.div>
    );
};
