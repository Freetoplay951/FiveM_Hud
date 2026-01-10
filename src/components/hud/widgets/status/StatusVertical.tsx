import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

const StatusVerticalComponent = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const { colorVar, isCritical } = useMemo(() => {
        const isWarning = value <= 30;
        const critical = value <= 15;
        const color = critical ? "critical" : isWarning ? "warning" : config.color;
        return { colorVar: color, isCritical: critical };
    }, [value, config.color]);

    return (
        <div className="rounded-lg flex flex-col items-center py-1.5 gap-1 w-7 h-20 bg-black/60 border border-white/10">
            <Icon
                size={12}
                className={cn(isCritical && "critical-pulse")}
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    filter: `drop-shadow(0 0 3px hsl(var(--${colorVar}) / 0.5))`,
                }}
            />

            <div className="flex-1 w-2 rounded-full bg-muted/30 overflow-hidden relative">
                <motion.div
                    className="absolute inset-x-0 bottom-0 rounded-full"
                    initial={{ height: 0 }}
                    animate={{ height: `${value}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                        backgroundColor: `hsl(var(--${colorVar}))`,
                        boxShadow: `0 0 8px hsl(var(--${colorVar}) / 0.6), inset 0 0 4px hsl(var(--${colorVar}) / 0.3)`,
                    }}
                />
            </div>

            <span
                className="hud-number text-[8px]"
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
                }}>
                {Math.round(value)}
            </span>
        </div>
    );
};

export const StatusVertical = memo(StatusVerticalComponent);
