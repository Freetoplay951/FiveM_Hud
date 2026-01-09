import { motion } from "framer-motion";
import { Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarFuelWidgetProps {
    fuel: number;
    visible: boolean;
}

export const CarFuelWidget = ({ fuel, visible }: CarFuelWidgetProps) => {
    const fuelWarning = fuel <= 25;
    const fuelCritical = fuel <= 10;

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 min-w-[64px] whitespace-nowrap">
            <Fuel
                size={10}
                className={cn(
                    fuelCritical ? "text-critical critical-pulse" : fuelWarning ? "text-warning" : "text-stamina",
                    "flex-shrink-0"
                )}
                style={{
                    filter: `drop-shadow(0 0 3px hsl(var(--${
                        fuelCritical ? "critical" : fuelWarning ? "warning" : "stamina"
                    })))`,
                }}
            />
            <motion.span
                className={cn(
                    "hud-number text-[10px] tabular-nums text-right ml-auto",
                    fuelCritical ? "text-critical" : fuelWarning ? "text-warning" : "text-stamina"
                )}
                style={{
                    textShadow: `0 0 6px hsl(var(--${
                        fuelCritical ? "critical" : fuelWarning ? "warning" : "stamina"
                    }) / 0.5)`,
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {Math.round(fuel)}%
            </motion.span>
        </motion.div>
    );
};
