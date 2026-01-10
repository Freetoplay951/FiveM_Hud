import { memo, useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertTriangle } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface SpeedLimitWidgetProps {
    currentSpeed: number;
    speedLimit: number;
    isActive: boolean; // Whether speed zone is active
}

// Static animation config
const containerMotion = {
    initial: { opacity: 0, scale: 0.8, y: -20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: -20 },
} as const;

const pulseAnimation = {
    opacity: [1, 0.3, 1],
    scale: [1, 1.05, 1],
};

const pulseTransition = {
    duration: 0.5,
    repeat: Infinity,
};

const SpeedLimitWidgetComponent = ({ currentSpeed, speedLimit, isActive }: SpeedLimitWidgetProps) => {
    useRenderLogger("SpeedLimitWidget", { currentSpeed, speedLimit, isActive });
    
    const [showFlash, setShowFlash] = useState(false);
    const isSpeeding = currentSpeed > speedLimit;
    const speedDiff = currentSpeed - speedLimit;

    // Flash effect when first entering speed zone while speeding
    useEffect(() => {
        if (isActive && isSpeeding) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // Determine severity
    const severity = useMemo(() => {
        if (!isSpeeding) return "normal";
        if (speedDiff > 30) return "critical";
        if (speedDiff > 15) return "warning";
        return "minor";
    }, [isSpeeding, speedDiff]);

    const containerClass = useMemo(() => {
        const base = "glass-panel rounded-lg px-3 py-2 flex items-center gap-3";
        if (severity === "critical") return `${base} border-2 border-red-500/60 bg-red-950/30`;
        if (severity === "warning") return `${base} border-2 border-yellow-500/60 bg-yellow-950/20`;
        if (severity === "minor") return `${base} border border-orange-500/40`;
        return base;
    }, [severity]);

    const speedColor = useMemo(() => {
        if (severity === "critical") return "text-red-400";
        if (severity === "warning") return "text-yellow-400";
        if (severity === "minor") return "text-orange-400";
        return "text-emerald-400";
    }, [severity]);

    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={containerClass}
                {...containerMotion}
                animate={isSpeeding && severity !== "normal" ? pulseAnimation : containerMotion.animate}
                transition={isSpeeding && severity !== "normal" ? pulseTransition : undefined}>
                {/* Speed Limit Sign */}
                <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-[3px] border-red-500 bg-white flex items-center justify-center">
                        <span className="text-black font-bold text-sm">{speedLimit}</span>
                    </div>
                </div>

                {/* Current Speed */}
                <div className="flex flex-col items-center">
                    <span className={`hud-number text-xl font-bold ${speedColor}`}>
                        {Math.floor(currentSpeed)}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase">KM/H</span>
                </div>

                {/* Warning Icon */}
                {isSpeeding && (
                    <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}>
                        {severity === "critical" ? (
                            <Camera size={20} className="text-red-400" />
                        ) : (
                            <AlertTriangle size={18} className="text-yellow-400" />
                        )}
                    </motion.div>
                )}

                {/* Speed Difference */}
                {isSpeeding && (
                    <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold ${speedColor}`}>
                            +{Math.floor(speedDiff)}
                        </span>
                    </div>
                )}

                {/* Flash overlay for camera effect */}
                <AnimatePresence>
                    {showFlash && isSpeeding && severity === "critical" && (
                        <motion.div
                            className="absolute inset-0 bg-white rounded-lg pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.8, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export const SpeedLimitWidget = memo(SpeedLimitWidgetComponent);
