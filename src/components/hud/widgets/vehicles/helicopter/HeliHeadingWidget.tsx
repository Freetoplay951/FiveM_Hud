import { motion } from "framer-motion";

interface HeliHeadingWidgetProps {
    heading: number;
    visible: boolean;
}

export const HeliHeadingWidget = ({ heading, visible }: HeliHeadingWidgetProps) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-2 py-0.5 flex items-center gap-1 w-[48px] justify-center">
            <motion.span
                className="hud-number text-[10px] text-primary tabular-nums"
                style={{
                    textShadow: "0 0 6px hsl(var(--primary) / 0.6)",
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {String(Math.round(heading)).padStart(3, "0")}°
            </motion.span>
        </motion.div>
    );
};
