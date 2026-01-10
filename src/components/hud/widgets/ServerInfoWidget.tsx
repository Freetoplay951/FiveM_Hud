import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface ServerInfoWidgetProps {
    playerCount: number;
    maxPlayers: number;
}

// Memoized static icon
const UsersIcon = memo(() => (
    <Users
        size={12}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
UsersIcon.displayName = "UsersIcon";

// Static animation config
const motionConfig = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
} as const;

const ServerInfoWidgetComponent = ({ playerCount, maxPlayers }: ServerInfoWidgetProps) => {
    useRenderLogger("ServerInfoWidget", { playerCount, maxPlayers });

    // Color based on server load
    const loadColor = useMemo(() => {
        const load = playerCount / maxPlayers;
        if (load >= 0.9) return "text-red-400";
        if (load >= 0.7) return "text-yellow-400";
        return "text-emerald-400";
    }, [playerCount, maxPlayers]);

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
            <UsersIcon />
            <span
                className={`hud-number text-xs font-medium ${loadColor}`}
                style={textStyle}>
                {playerCount}
            </span>
            <span className="text-[10px] text-muted-foreground">/</span>
            <span className="text-[10px] text-muted-foreground">{maxPlayers}</span>
        </motion.div>
    );
};

export const ServerInfoWidget = memo(ServerInfoWidgetComponent);
