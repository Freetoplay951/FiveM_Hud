import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface PingWidgetProps {
    ping: number;
}

// Memoized static icon
const PingIcon = memo(() => (
    <Wifi
        size={12}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
PingIcon.displayName = "PingIcon";

// Static animation config
const motionConfig = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
} as const;

const PingWidgetComponent = ({ ping }: PingWidgetProps) => {
    useRenderLogger("PingWidget", { ping });

    // Color based on ping
    const pingColor = useMemo(() => {
        if (ping <= 50) return "text-emerald-400";
        if (ping <= 100) return "text-yellow-400";
        if (ping <= 150) return "text-orange-400";
        return "text-red-400";
    }, [ping]);

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
            <PingIcon />
            <span
                className={`hud-number text-xs font-medium ${pingColor}`}
                style={textStyle}>
                {ping}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">MS</span>
        </motion.div>
    );
};

export const PingWidget = memo(PingWidgetComponent);
