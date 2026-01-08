import { motion } from "framer-motion";
import { VehicleState } from "@/types/hud";
import { useTranslation } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface HeliAltitudeWidgetProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const HeliAltitudeWidget = ({ vehicle, visible }: HeliAltitudeWidgetProps) => {
    const { t } = useTranslation();
    const altitude = vehicle.altitude || 0;
    const lowAltitude = altitude < 50;

    return (
        <motion.div
            initial={false}
            animate={{
                opacity: visible ? 1 : 0,
                scale: visible ? 1 : 0.9,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
