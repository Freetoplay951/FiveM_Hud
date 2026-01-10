import { memo, useMemo } from "react";
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

// Blinking animation for evading state - stable reference
const blinkAnimation = {
    scale: 1,
    rotate: 0,
    opacity: [1, 0.3, 1] as number[],
    transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
    },
} as const;

const MAX_STARS = 5;

const WantedWidgetComponent = ({ wantedLevel, isEvading = false }: WantedWidgetProps) => {
    useRenderLogger("WantedWidget", { wantedLevel, isEvading });

    const stars = useMemo(() => {
        const level = Math.min(MAX_STARS, Math.max(0, wantedLevel));
        return Array.from({ length: MAX_STARS }, (_, i) => ({
            index: i,
            active: i < level,
        }));
    }, [wantedLevel]);

    // Should blink when evading and has wanted level
    const shouldBlink = isEvading && wantedLevel > 0;

    return (
        <motion.div
            className="glass-panel rounded-lg px-2.5 py-1.5 flex items-center gap-0.5"
            {...containerMotion}>
            <AnimatePresence mode="popLayout">
                {stars.map(({ index, active }) => (
                    <motion.div
                        key={index}
                        {...starMotion}
                        animate={active && shouldBlink ? blinkAnimation : staticStarAnimation}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                            delay: index * 0.05,
                        }}>
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
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export const WantedWidget = memo(WantedWidgetComponent);
