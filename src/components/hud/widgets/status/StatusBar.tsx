import { motion } from "framer-motion";
import { LucideIcon, Heart, Shield, Utensils, Droplets, Zap, Brain, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusType } from "@/types/hud";

interface StatusBarProps {
    type: StatusType;
    value: number;
    size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<StatusType, { icon: LucideIcon; color: string; label: string }> = {
    health: { icon: Heart, color: "health", label: "HP" },
    armor: { icon: Shield, color: "armor", label: "ARM" },
    hunger: { icon: Utensils, color: "hunger", label: "HNG" },
    thirst: { icon: Droplets, color: "thirst", label: "THR" },
    stamina: { icon: Zap, color: "stamina", label: "STA" },
    stress: { icon: Brain, color: "stress", label: "STR" },
    oxygen: { icon: Wind, color: "oxygen", label: "O2" },
};

const SIZE_CONFIG = {
    sm: { width: "w-24", height: "h-5", icon: 12, fontSize: "text-[8px]" },
    md: { width: "w-28", height: "h-6", icon: 14, fontSize: "text-[9px]" },
    lg: { width: "w-32", height: "h-7", icon: 16, fontSize: "text-[10px]" },
};

export const StatusBar = ({ type, value, size = "md" }: StatusBarProps) => {
    const config = STATUS_CONFIG[type];
    const sizeConfig = SIZE_CONFIG[size];
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
        <div
            className={cn(
                "glass-panel rounded-full flex items-center gap-2 px-2",
                sizeConfig.width,
                sizeConfig.height
            )}>
            <Icon
                size={sizeConfig.icon}
                className={cn(isCritical && "critical-pulse")}
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    filter: `drop-shadow(0 0 4px hsl(var(--${colorVar}) / 0.5))`,
                }}
            />

            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden relative">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                        backgroundColor: `hsl(var(--${colorVar}))`,
                        boxShadow: `0 0 8px hsl(var(--${colorVar}) / 0.6), inset 0 0 4px hsl(var(--${colorVar}) / 0.3)`,
                    }}
                />
            </div>

            <span
                className={cn("hud-number min-w-[20px] text-right", sizeConfig.fontSize)}
                style={{
                    color: `hsl(var(--${colorVar}))`,
                    textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
                }}>
                {Math.round(value)}
            </span>
        </div>
    );
};
