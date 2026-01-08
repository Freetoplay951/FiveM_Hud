import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface HeliRotorWidgetProps {
    rotorRpm: number;
    visible: boolean;
}

export const HeliRotorWidget = ({ rotorRpm, visible }: HeliRotorWidgetProps) => {
    const { t } = useTranslation();
    const lowRpm = rotorRpm < 80;

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-background/85 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 min-w-[88px] whitespace-nowrap",
                lowRpm && "border-critical/50"
            )}>
            <Gauge
                size={10}
                className={cn(lowRpm ? "text-critical critical-pulse" : "text-primary", "flex-shrink-0")}
                style={{
                    filter: `drop-shadow(0 0 3px hsl(var(--${lowRpm ? "critical" : "primary"})))`,
                }}
            />
            <span className="text-[8px] text-muted-foreground">{t.vehicle.rotor}</span>
            <motion.span
                className={cn(
                    "hud-number text-[10px] tabular-nums text-right ml-auto",
                    lowRpm ? "text-critical" : "text-primary"
                )}
                style={{
                    textShadow: `0 0 6px hsl(var(--${lowRpm ? "critical" : "primary"}) / 0.5)`,
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {Math.round(rotorRpm)}%
            </motion.span>
        </motion.div>
    );
};
