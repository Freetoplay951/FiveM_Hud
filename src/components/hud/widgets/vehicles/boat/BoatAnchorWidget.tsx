import { motion } from "framer-motion";
import { Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface BoatAnchorWidgetProps {
    anchor: boolean;
    visible: boolean;
}

export const BoatAnchorWidget = ({ anchor, visible }: BoatAnchorWidgetProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-background/85 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 min-w-[52px]",
                anchor && "border-warning/50"
            )}>
            <Anchor
                size={12}
                className={cn(anchor ? "text-warning flex-shrink-0" : "text-muted-foreground flex-shrink-0")}
                style={anchor ? { filter: "drop-shadow(0 0 4px hsl(var(--warning)))" } : {}}
            />
            <span className="text-[8px] text-muted-foreground">{t.vehicle.anchor?.toUpperCase?.() || "ANCHOR"}</span>
        </motion.div>
    );
};
