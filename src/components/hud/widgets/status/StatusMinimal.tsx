import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

export const StatusMinimal = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const isWarning = value <= 30;
    const isCritical = value <= 15;

    const getColor = () => {
        if (isCritical) return "critical";
        if (isWarning) return "warning";
        return config.color;
    };

    const colorVar = getColor();

    return (
        <motion.div
            className={cn(
                "rounded-full flex items-center px-2.5 py-1.5 gap-1.5 bg-black/60 border border-white/10",
                isCritical && "critical-pulse"
            )}
            animate={{
                boxShadow:
                    value <= 30
                        ? `0 0 ${isCritical ? 12 : 8}px hsl(var(--${colorVar}) / 0.4)`
                        : `0 0 4px hsl(var(--${colorVar}) / 0.2)`,
            }}>
            <Icon
                size={12}
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    filter: `drop-shadow(0 0 3px hsl(var(--${colorVar}) / 0.5))`,
                }}
            />

            <span
                className="hud-number text-[10px] w-6 text-right tabular-nums"
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
                }}>
                {Math.round(value)}
            </span>
        </motion.div>
    );
};
