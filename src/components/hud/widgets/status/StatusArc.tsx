import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

// Pre-calculated constants
const STROKE = 3.5;
const RADIUS = 18;
const CIRCUMFERENCE = Math.PI * RADIUS;

// Arc path (calculated once)
const ARC_PATH = `M ${25 - RADIUS} 25 A ${RADIUS} ${RADIUS} 0 0 1 ${25 + RADIUS} 25`;

// Static tick positions (calculated once)
const TICKS = [0, 25, 50, 75, 100];
const TICK_POSITIONS = TICKS.map((tick) => {
    const angle = Math.PI * (1 - tick / 100);
    const outerRadius = RADIUS + 3;
    return {
        tick,
        x: 25 + RADIUS * Math.cos(angle),
        y: 25 - RADIUS * Math.sin(angle),
        outerX: 25 + outerRadius * Math.cos(angle),
        outerY: 25 - outerRadius * Math.sin(angle),
    };
});

const StatusArcComponent = ({ type, value }: StatusProps) => {
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
        <div className="relative rounded-lg w-16 h-12 bg-black/60 border border-white/10">
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 50 30">
                <defs>
                    <filter
                        id={`arcGlow-${type}`}
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%">
                        <feGaussianBlur
                            stdDeviation="1.5"
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Tick marks - using pre-calculated positions */}
                {TICK_POSITIONS.map(({ tick, x, y, outerX, outerY }) => (
                    <line
                        key={tick}
                        x1={x}
                        y1={y}
                        x2={outerX}
                        y2={outerY}
                        stroke={value >= tick ? `hsl(var(--${colorVar}))` : "hsl(var(--muted) / 0.3)"}
                        strokeWidth={0.8}
                        strokeLinecap="round"
                    />
                ))}

                {/* Background arc */}
                <path
                    d={ARC_PATH}
                    fill="none"
                    stroke="hsl(var(--muted) / 0.15)"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />

                {/* Progress arc */}
                <motion.path
                    d={ARC_PATH}
                    fill="none"
                    stroke={`hsl(var(--${colorVar}))`}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    initial={{ strokeDashoffset: CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
                    transition={{ duration: 0.3 }}
                    filter={`url(#arcGlow-${type})`}
                    style={{
                        filter: `drop-shadow(0 0 4px hsl(var(--${colorVar}) / 0.6))`,
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <div className="flex items-center gap-0.5">
                    <Icon
                        size={12}
                        className={cn(isCritical && "critical-pulse")}
                        style={{
                            color: `hsl(var(--${colorVar}))`,
                            filter: `drop-shadow(0 0 3px hsl(var(--${colorVar}) / 0.5))`,
                        }}
                    />
                    <span
                        className={"hud-number text-[8px]"}
                        style={{
                            color: `hsl(var(--${colorVar}))`,
                            textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
                        }}>
                        {Math.round(value)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const StatusArc = memo(StatusArcComponent);
