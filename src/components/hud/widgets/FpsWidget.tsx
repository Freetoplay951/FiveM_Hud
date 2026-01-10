import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface FpsWidgetProps {
    fps: number;
}

// Memoized static icon
const FpsIcon = memo(() => (
    <Activity
        size={12}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
FpsIcon.displayName = "FpsIcon";

// Static animation config
const motionConfig = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
} as const;

const FpsWidgetComponent = ({ fps }: FpsWidgetProps) => {
    useRenderLogger("FpsWidget", { fps });

    // Color based on FPS
    const fpsColor = useMemo(() => {
        if (fps >= 60) return "text-emerald-400";
        if (fps >= 30) return "text-yellow-400";
        return "text-red-400";
    }, [fps]);

    const textStyle = useMemo(
        () => ({
            textShadow: "0 0 8px hsl(var(--primary) / 0.4)",
        }),
        []
    );

    return (
        <motion.div
            className="glass-panel rounded-lg px-2.5 py-1 flex items-center gap-1.5"
            {...motionConfig}>
            <FpsIcon />
            <span
                className={`hud-number text-xs font-medium ${fpsColor}`}
                style={textStyle}>
                {fps}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">FPS</span>
        </motion.div>
    );
};

export const FpsWidget = memo(FpsWidgetComponent);
