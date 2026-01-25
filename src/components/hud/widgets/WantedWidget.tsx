import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface WantedWidgetProps {
    wantedLevel: number; // 0-5
    isEvading?: boolean; // When true and level > 0, stars blink (cops lost sight)
}

// Static animation config - defined outside component for stable references
const containerMotion = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
} as const;

const starMotion = {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    exit: { scale: 0, rotate: 180 },
} as const;

// Static animation for non-blinking state
const staticStarAnimation = { scale: 1, rotate: 0, opacity: 1 } as const;

/**
 * Synchronized blink animation for all stars.
 * Using a single shared animation object ensures all stars animate in sync.
 * The animation is defined outside the component so all instances share the same timing.
 */
const syncedBlinkAnimation = {
    scale: 1,
    rotate: 0,
    opacity: [1, 0.4, 1],
    transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: [0.45, 0.05, 0.55, 0.95] as [number, number, number, number],
        repeatType: "loop" as const,
    },
};

const MAX_STARS = 5;

// Pre-computed star array to avoid recreation
const STAR_INDICES = Array.from({ length: MAX_STARS }, (_, i) => i);

const WantedWidgetComponent = ({ wantedLevel, isEvading = false }: WantedWidgetProps) => {
    useRenderLogger("WantedWidget", { wantedLevel, isEvading });

    const level = Math.min(MAX_STARS, Math.max(0, wantedLevel));
    const shouldBlink = isEvading && level > 0;

    return (
        <motion.div
            className="glass-panel rounded-lg px-2.5 py-1.5 flex items-center gap-0.5"
            {...containerMotion}>
            <AnimatePresence mode="popLayout">
                {STAR_INDICES.map((index) => {
                    const active = index < level;
                    return (
                        <motion.div
                            key={index}
                            {...starMotion}
                            animate={active && shouldBlink ? syncedBlinkAnimation : staticStarAnimation}
                            transition={
                                active && shouldBlink
                                    ? undefined
                                    : {
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 15,
                                          delay: index * 0.05,
                                      }
                            }>
                            <Star
                                size={14}
                                className={active ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
                                style={
                                    active
                                        ? {
                                              filter: "drop-shadow(0 0 6px rgb(250 204 21 / 0.8))",
                                          }
                                        : undefined
                                }
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
};

export const WantedWidget = memo(WantedWidgetComponent);
