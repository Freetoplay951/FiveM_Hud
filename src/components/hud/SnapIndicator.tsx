import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Magnet } from "lucide-react";

interface SnapIndicatorProps {
    isShiftPressed: boolean;
    hasActiveSnap: boolean;
}

const SnapIndicatorComponent = ({ isShiftPressed, hasActiveSnap }: SnapIndicatorProps) => {
    return (
        <AnimatePresence>
            {isShiftPressed && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
                    <div
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg
                            border backdrop-blur-sm
                            ${
                                hasActiveSnap
                                    ? "bg-primary/20 border-primary/60 text-primary"
                                    : "bg-muted/60 border-border/50 text-muted-foreground"
                            }
                            transition-colors duration-150
                        `}>
                        <Magnet
                            size={14}
                            className={hasActiveSnap ? "text-primary" : "text-muted-foreground"}
                            style={
                                hasActiveSnap
                                    ? { filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }
                                    : undefined
                            }
                        />
                        <span className="text-xs font-medium uppercase tracking-wider">
                            {hasActiveSnap ? "Snap" : "Shift"}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const SnapIndicator = memo(SnapIndicatorComponent);
