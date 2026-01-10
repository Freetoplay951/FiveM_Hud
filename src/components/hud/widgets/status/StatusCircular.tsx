import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

// Pre-calculated constants
const RADIUS = 23;
const STROKE = 3.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const StatusCircularComponent = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const { colorVar, isCritical, progress } = useMemo(() => {
        const isWarning = value <= 30;
        const critical = value <= 15;
        const color = critical ? "critical" : isWarning ? "warning" : config.color;
        return {
            colorVar: color,
            isCritical: critical,
            progress: (value / 100) * CIRCUMFERENCE,
        };
    }, [value, config.color]);

    return (
        <div className="relative w-14 h-14">
            {/* Background for better contrast */}
            <div
                className="absolute inset-0 rounded-full bg-black/60 border-2 border-white/30"
                style={{ boxShadow: `0 0 15px hsl(var(--${colorVar}) / 0.4), inset 0 0 8px rgba(0,0,0,0.5)` }}
            />

            {/* Subtle glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: isCritical
                        ? [
                              `inset 0 0 15px hsl(var(--${colorVar}) / 0.3), 0 0 8px hsl(var(--${colorVar}) / 0.4)`,
                              `inset 0 0 25px hsl(var(--${colorVar}) / 0.45), 0 0 12px hsl(var(--${colorVar}) / 0.5)`,
                              `inset 0 0 15px hsl(var(--${colorVar}) / 0.3), 0 0 8px hsl(var(--${colorVar}) / 0.4)`,
                          ]
                        : `inset 0 0 10px hsl(var(--${colorVar}) / 0.15)`,
                }}
                transition={isCritical ? { duration: 0.5, repeat: Infinity } : {}}
            />

            {/* SVG Ring */}
            <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 60 60">
                <defs>
                    <filter
                        id={`glow-${type}`}
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%">
                        <feGaussianBlur
                            stdDeviation="2"
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <circle
                    cx="30"
                    cy="30"
                    r={RADIUS}
                    fill="none"
                    stroke="hsl(var(--muted) / 0.15)"
                    strokeWidth={STROKE}
                />

                <motion.circle
                    cx="30"
                    cy="30"
                    r={RADIUS}
                    fill="none"
                    stroke={`hsl(var(--${colorVar}))`}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
                    transition={{ duration: 0.3 }}
                    filter={`url(#glow-${type})`}
                    style={{
                        filter: `drop-shadow(0 0 6px hsl(var(--${colorVar}) / 0.6))`,
                    }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Icon
                    size={16}
                    className={cn("transition-colors", isCritical && "critical-pulse")}
                    style={{
                        color: `hsl(var(--${colorVar}))`,
                        filter: `drop-shadow(0 0 4px hsl(var(--${colorVar}) / 0.5))`,
                    }}
                />
                <span
                    className="hud-number mt-0.5 text-[9px]"
                    style={{
                        color: `hsl(var(--${colorVar}))`,
                        textShadow: `0 0 8px hsl(var(--${colorVar}) / 0.5)`,
                    }}>
                    {Math.round(value)}
                </span>
            </div>
        </div>
    );
};

export const StatusCircular = memo(StatusCircularComponent);
