import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export const HUDLoadingSkeleton = () => {
    return (
        <motion.div 
            className="fixed inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Status Widget Skeleton - Bottom Left */}
            <div className="fixed bottom-4 left-4 flex gap-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton 
                        key={i} 
                        className="w-10 h-10 rounded-full bg-background/30" 
                    />
                ))}
            </div>

            {/* Location Widget Skeleton - Top Left */}
            <div className="fixed top-4 left-4 space-y-2">
                <Skeleton className="w-40 h-4 bg-background/30" />
                <Skeleton className="w-28 h-3 bg-background/30" />
            </div>

            {/* Money Widget Skeleton - Top Right */}
            <div className="fixed top-4 right-4 space-y-1.5">
                <Skeleton className="w-24 h-4 bg-background/30" />
                <Skeleton className="w-20 h-3 bg-background/30" />
            </div>

            {/* Voice Widget Skeleton - Bottom Center */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
                <Skeleton className="w-12 h-12 rounded-full bg-background/30" />
            </div>

            {/* Loading Indicator */}
            <div className="fixed inset-0 flex items-center justify-center">
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary/60"
                                animate={{
                                    y: [0, -8, 0],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground/70 ml-2">Laden...</span>
                </motion.div>
            </div>
        </motion.div>
    );
};
