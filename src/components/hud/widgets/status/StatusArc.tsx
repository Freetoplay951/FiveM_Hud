import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

export const StatusArc = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const isWarning = value <= 30;
    const isCritical = value <= 15;

    const getColor = () => {
        if (isCritical) return "critical";
        if (isWarning) return "warning";
        return config.color;
    };

    const stroke = 3.5;
    const radius = 18;
    const colorVar = getColor();

    // Arc calculations (180 degree arc)
    const circumference = Math.PI * radius;
    const progress = (value / 100) * circumference;

    // Tick marks for the arc
    const ticks = [0, 25, 50, 75, 100];
    const getTickPosition = (percent: number) => {
        const angle = Math.PI * (1 - percent / 100);
        return {
            x: 25 + radius * Math.cos(angle),
            y: 25 - radius * Math.sin(angle),
        };
    };

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

                {/* Tick marks */}
                {ticks.map((tick) => {
                    const pos = getTickPosition(tick);
                    const innerPos = getTickPosition(tick);
                    const outerRadius = radius + 3;
                    const outerX = 25 + outerRadius * Math.cos(Math.PI * (1 - tick / 100));
                    const outerY = 25 - outerRadius * Math.sin(Math.PI * (1 - tick / 100));
                    const isActive = value >= tick;

                    return (
                        <line
                            key={tick}
                            x1={pos.x}
                            y1={pos.y}
                            x2={outerX}
                            y2={outerY}
                            stroke={isActive ? `hsl(var(--${colorVar}))` : "hsl(var(--muted) / 0.3)"}
                            strokeWidth={0.8}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Background arc */}
                <path
                    d={`M ${25 - radius} 25 A ${radius} ${radius} 0 0 1 ${25 + radius} 25`}
                    fill="none"
                    stroke="hsl(var(--muted) / 0.15)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />

                {/* Progress arc */}
                <motion.path
                    d={`M ${25 - radius} 25 A ${radius} ${radius} 0 0 1 ${25 + radius} 25`}
                    fill="none"
                    stroke={`hsl(var(--${colorVar}))`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
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
