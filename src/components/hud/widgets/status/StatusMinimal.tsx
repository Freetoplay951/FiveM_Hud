import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

const StatusMinimalComponent = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const { colorVar, isCritical, isWarning } = useMemo(() => {
        const warning = value <= 30;
        const critical = value <= 15;
        const color = critical ? "critical" : warning ? "warning" : config.color;
        return { colorVar: color, isCritical: critical, isWarning: warning };
    }, [value, config.color]);

    return (
        <motion.div
            className={cn(
                "rounded-full flex items-center px-2.5 py-1.5 gap-1.5 bg-black/60 border border-white/10",
                isCritical && "critical-pulse"
            )}
            animate={{
                boxShadow: isWarning
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

export const StatusMinimal = memo(StatusMinimalComponent);
