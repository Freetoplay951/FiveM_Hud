import { memo, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
import { useProgressbarStore, ProgressbarColor } from "@/stores/progressbarStore";
import { useRenderLogger } from "@/hooks/useRenderLogger";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { DEMO_PROGRESSBAR } from "@/components/hud/data/demoData";
import { cn } from "@/lib/utils";

// Color configuration
const COLOR_CONFIG: Record<ProgressbarColor, { 
    cssVar: string; 
    icon: typeof Loader2;
    glowIntensity: number;
}> = {
    primary: { cssVar: "primary", icon: Loader2, glowIntensity: 0.6 },
    success: { cssVar: "health", icon: CheckCircle2, glowIntensity: 0.7 },
    warning: { cssVar: "warning", icon: AlertTriangle, glowIntensity: 0.6 },
    critical: { cssVar: "critical", icon: AlertTriangle, glowIntensity: 0.8 },
    info: { cssVar: "info", icon: Info, glowIntensity: 0.5 },
};

// Static animation config
const containerMotion = {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 },
    transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8,
    },
} as const;

interface ProgressbarWidgetProps {
    isEditMode?: boolean;
}

const ProgressbarWidgetComponent = ({ isEditMode = false }: ProgressbarWidgetProps) => {
    const storeData = useProgressbarStore();
    const updateProgress = useProgressbarStore((state) => state.updateProgress);
    const finishProgressbar = useProgressbarStore((state) => state.finishProgressbar);
    const cancelProgressbar = useProgressbarStore((state) => state.cancelProgressbar);
    const animationRef = useRef<number | null>(null);

    // Use demo data in edit mode when progressbar is not active
    const { isActive, label, progress, duration, startTime, canCancel, color } = 
        isEditMode && !storeData.isActive 
            ? DEMO_PROGRESSBAR 
            : storeData;

    const colorConfig = COLOR_CONFIG[color];
    const Icon = colorConfig.icon;

    useRenderLogger("ProgressbarWidget", { isActive, progress, label, color });

    // Memoized styles
    const progressBarStyle = useMemo(() => ({
        backgroundColor: `hsl(var(--${colorConfig.cssVar}))`,
        boxShadow: `
            0 0 20px hsl(var(--${colorConfig.cssVar}) / ${colorConfig.glowIntensity}),
            0 0 40px hsl(var(--${colorConfig.cssVar}) / ${colorConfig.glowIntensity * 0.5}),
            inset 0 1px 0 hsl(var(--${colorConfig.cssVar}) / 0.3)
        `,
    }), [colorConfig]);

    const iconStyle = useMemo(() => ({
        filter: `drop-shadow(0 0 8px hsl(var(--${colorConfig.cssVar}) / 0.8))`,
        color: `hsl(var(--${colorConfig.cssVar}))`,
    }), [colorConfig]);

    const labelStyle = useMemo(() => ({
        textShadow: `0 0 10px hsl(var(--${colorConfig.cssVar}) / 0.4)`,
    }), [colorConfig]);

    const percentStyle = useMemo(() => ({
        color: `hsl(var(--${colorConfig.cssVar}))`,
        textShadow: `0 0 8px hsl(var(--${colorConfig.cssVar}) / 0.5)`,
    }), [colorConfig]);

    // Animation loop using requestAnimationFrame - no Lua loops needed
    useEffect(() => {
        // Don't run animation in edit mode with demo data
        if (isEditMode && !storeData.isActive) return;
        if (!isActive || duration <= 0) return;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / duration) * 100);
            
            updateProgress(newProgress);

            if (newProgress >= 100) {
                finishProgressbar();
                sendNuiCallback("progressbar:finish");
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, duration, startTime, updateProgress, finishProgressbar, isEditMode, storeData.isActive]);

    const handleCancel = useCallback(() => {
        if (canCancel && !isEditMode) {
            cancelProgressbar();
            sendNuiCallback("progressbar:cancel");
        }
    }, [canCancel, cancelProgressbar, isEditMode]);

    if (!isActive && !isEditMode) return null;

    return (
        <AnimatePresence mode="wait">
            {(isActive || isEditMode) && (
                <motion.div
                    key="progressbar"
                    className="glass-panel rounded-xl px-5 py-3 flex flex-col gap-2 min-w-[280px] max-w-[320px] backdrop-blur-xl border border-white/10"
                    style={{
                        boxShadow: `
                            0 4px 30px hsl(var(--${colorConfig.cssVar}) / 0.15),
                            0 0 0 1px hsl(var(--${colorConfig.cssVar}) / 0.1),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                        `,
                    }}
                    {...containerMotion}>
                    
                    {/* Header with label and cancel button */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <motion.div
                                animate={{ 
                                    rotate: color === "primary" ? 360 : 0,
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{ 
                                    rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                                }}>
                                <Icon
                                    size={18}
                                    style={iconStyle}
                                    className={cn(
                                        color === "critical" && "animate-pulse",
                                        color === "warning" && "animate-pulse"
                                    )}
                                />
                            </motion.div>
                            <span
                                className="text-sm text-foreground font-medium truncate"
                                style={labelStyle}>
                                {label}
                            </span>
                        </div>
                        
                        {canCancel && (
                            <motion.button
                                onClick={handleCancel}
                                className="p-1 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Cancel">
                                <X 
                                    size={14} 
                                    className="text-muted-foreground group-hover:text-critical transition-colors" 
                                />
                            </motion.button>
                        )}
                    </div>

                    {/* Progress bar container */}
                    <div className="relative h-3 rounded-full bg-black/40 overflow-hidden border border-white/5">
                        {/* Animated background shimmer */}
                        <motion.div
                            className="absolute inset-0 opacity-20"
                            style={{
                                background: `linear-gradient(90deg, transparent, hsl(var(--${colorConfig.cssVar}) / 0.3), transparent)`,
                            }}
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Progress fill */}
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                            style={progressBarStyle}
                        />
                        
                        {/* Glowing edge effect */}
                        <motion.div
                            className="absolute inset-y-0 w-4 rounded-full blur-sm"
                            style={{
                                left: `calc(${progress}% - 8px)`,
                                background: `hsl(var(--${colorConfig.cssVar}))`,
                                opacity: progress > 0 ? 0.8 : 0,
                            }}
                            animate={{ opacity: progress > 0 ? [0.5, 1, 0.5] : 0 }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    </div>

                    {/* Percentage with animated counter */}
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {color === "success" ? "Abgeschlossen" : 
                             color === "critical" ? "Kritisch" : 
                             color === "warning" ? "Warnung" : "Fortschritt"}
                        </span>
                        <motion.span
                            className="hud-number text-sm font-bold"
                            style={percentStyle}
                            key={Math.round(progress)}
                            initial={{ scale: 1.2, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.1 }}>
                            {Math.round(progress)}%
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const ProgressbarWidget = memo(ProgressbarWidgetComponent);
