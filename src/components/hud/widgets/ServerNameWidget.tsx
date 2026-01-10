import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Server } from "lucide-react";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface ServerNameWidgetProps {
    serverName: string;
}

// Memoized static icon
const ServerIcon = memo(() => (
    <Server
        size={12}
        className="text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))" }}
    />
));
ServerIcon.displayName = "ServerIcon";

// Static animation config
const motionConfig = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
} as const;

const ServerNameWidgetComponent = ({ serverName }: ServerNameWidgetProps) => {
    useRenderLogger("ServerNameWidget", { serverName });

    const textStyle = useMemo(
        () => ({
            textShadow: "0 0 8px hsl(var(--primary) / 0.4)",
        }),
        []
    );

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2"
            {...motionConfig}>
            <ServerIcon />
            <span
                className="hud-number text-sm text-foreground font-medium tracking-wide"
                style={textStyle}>
                {serverName}
            </span>
        </motion.div>
    );
};

export const ServerNameWidget = memo(ServerNameWidgetComponent);
