import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface SpeedLimitWidgetProps {
    currentSpeed: number;
    speedLimit: number;
    isActive: boolean;
}

// Static animation config
const containerMotion = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 10 },
} as const;

const SpeedLimitWidgetComponent = ({ currentSpeed, speedLimit, isActive }: SpeedLimitWidgetProps) => {
    useRenderLogger("SpeedLimitWidget", { currentSpeed, speedLimit, isActive });

    const isSpeeding = currentSpeed > speedLimit;
    const speedDiff = currentSpeed - speedLimit;

    // Determine severity level
    const severity = useMemo(() => {
        if (!isSpeeding) return "normal";
        if (speedDiff > 30) return "critical";
        if (speedDiff > 15) return "warning";
        return "minor";
    }, [isSpeeding, speedDiff]);

    // Dynamic styling based on severity
    const limitColor = useMemo(() => {
        if (severity === "critical") return "text-red-400";
        if (severity === "warning") return "text-yellow-400";
        if (severity === "minor") return "text-orange-400";
        return "text-muted-foreground";
    }, [severity]);

    const speedColor = useMemo(() => {
        if (severity === "critical") return "text-red-400";
        if (severity === "warning") return "text-yellow-400";
        if (severity === "minor") return "text-orange-400";
        return "text-primary";
    }, [severity]);

    const borderClass = useMemo(() => {
        if (severity === "critical") return "border-red-500/50";
        if (severity === "warning") return "border-yellow-500/40";
        if (severity === "minor") return "border-orange-500/30";
        return "border-white/10";
    }, [severity]);

    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={`glass-panel rounded-lg px-3 py-2 flex items-center gap-3 border ${borderClass}`}
                {...containerMotion}
                animate={
                    isSpeeding && severity === "critical"
                        ? { ...containerMotion.animate, scale: [1, 1.02, 1] }
                        : containerMotion.animate
                }
                transition={
                    isSpeeding && severity === "critical"
                        ? { scale: { duration: 0.4, repeat: Infinity } }
                        : undefined
                }>
                {/* Speed Limit Sign - Minimalist circle */}
                <div className="relative flex items-center justify-center">
                    <div
                        className={`w-9 h-9 rounded-full border-2 ${
                            isSpeeding ? "border-red-500" : "border-muted-foreground/50"
                        } bg-background/80 flex items-center justify-center`}>
                        <span className={`font-bold text-xs ${limitColor}`}>{speedLimit}</span>
                    </div>
                </div>

                {/* Current Speed Display */}
                <div className="flex flex-col items-center min-w-[50px]">
                    <span
                        className={`hud-number text-lg font-bold ${speedColor}`}
                        style={{
                            textShadow: isSpeeding ? `0 0 10px currentColor` : undefined,
                        }}>
                        {Math.floor(currentSpeed)}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">KM/H</span>
                </div>

                {/* Warning indicator + Speed difference */}
                {isSpeeding && (
                    <div className="flex items-center gap-1.5">
                        <motion.div
                            animate={{ opacity: severity === "critical" ? [1, 0.4, 1] : 1 }}
                            transition={severity === "critical" ? { duration: 0.5, repeat: Infinity } : undefined}>
                            <AlertTriangle
                                size={16}
                                className={
                                    severity === "critical"
                                        ? "text-red-400"
                                        : severity === "warning"
                                          ? "text-yellow-400"
                                          : "text-orange-400"
                                }
                            />
                        </motion.div>
                        <span className={`text-xs font-semibold ${speedColor}`}>+{Math.floor(speedDiff)}</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export const SpeedLimitWidget = memo(SpeedLimitWidgetComponent);
