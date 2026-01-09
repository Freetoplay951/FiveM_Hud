import { motion } from "framer-motion";
import { Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoatFuelWidgetProps {
    fuel: number;
    visible: boolean;
}

export const BoatFuelWidget = ({ fuel, visible }: BoatFuelWidgetProps) => {
    const fuelWarning = fuel <= 25;
    const fuelCritical = fuel <= 10;

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2">
            <Fuel
                size={12}
                className={cn(
                    fuelCritical
                        ? "text-critical critical-pulse"
                        : fuelWarning
                        ? "text-warning warning-pulse"
                        : "text-stamina"
                )}
            />
            <div className="relative w-24 h-2 rounded-full glass-panel overflow-hidden">
                <motion.div
                    className={cn(
                        "absolute top-0 left-0 bottom-0 rounded-full",
                        fuelCritical ? "bg-critical" : fuelWarning ? "bg-warning" : "bg-stamina"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${fuel}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                        boxShadow: fuelCritical
                            ? "0 0 12px hsl(var(--critical)), inset 0 0 8px hsl(var(--critical) / 0.5)"
                            : fuelWarning
                            ? "0 0 10px hsl(var(--warning))"
                            : "0 0 8px hsl(var(--stamina) / 0.6)",
                    }}
                />
            </div>
            <span
                className={cn(
                    "text-[10px] hud-number tabular-nums min-w-[28px] text-right",
                    fuelCritical ? "text-critical" : fuelWarning ? "text-warning" : "text-muted-foreground"
                )}>
                {Math.round(fuel)}%
            </span>
        </motion.div>
    );
};
