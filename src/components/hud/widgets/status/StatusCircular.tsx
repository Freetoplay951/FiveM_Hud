import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, StatusProps } from "./config";

export const StatusCircular = ({ type, value }: StatusProps) => {
    const config = STATUS_CONFIG[type];
    const Icon = config.icon;

    const radius = 23;
    const stroke = 3.5;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;

    const isWarning = value <= 30;
    const isCritical = value <= 15;

    const getColor = () => {
        if (isCritical) return "critical";
        if (isWarning) return "warning";
        return config.color;
    };

    const colorVar = getColor();

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
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--muted) / 0.15)"
                    strokeWidth={stroke}
                />

                <motion.circle
                    cx="30"
                    cy="30"
                    r={radius}
                    fill="none"
                    stroke={`hsl(var(--${colorVar}))`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
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
