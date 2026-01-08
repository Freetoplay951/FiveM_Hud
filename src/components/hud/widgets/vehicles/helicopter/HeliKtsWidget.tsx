import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";

interface HeliKtsWidgetProps {
    airspeed: number;
    visible: boolean;
}

export const HeliKtsWidget = ({ airspeed, visible }: HeliKtsWidgetProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-1.5 py-0.5 w-[40px]">
            <span className="text-[6px] text-muted-foreground block text-center">{t.vehicle.kts}</span>
            <motion.span
                className="hud-number text-[10px] text-stamina tabular-nums block text-center"
                style={{
                    textShadow: "0 0 6px hsl(var(--stamina) / 0.6)",
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {String(Math.round(airspeed)).padStart(3, "0")}
            </motion.span>
        </motion.div>
    );
};
