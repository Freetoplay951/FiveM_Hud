import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface PlaneGearWidgetProps {
    landingGear: boolean;
    visible: boolean;
}

export const PlaneGearWidget = ({ landingGear, visible }: PlaneGearWidgetProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-background/85 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 min-w-[52px]",
                !landingGear && "border-critical/50"
            )}>
            <div
                className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    landingGear ? "bg-stamina" : "bg-critical critical-pulse"
                )}
                style={{
                    boxShadow: landingGear ? "0 0 6px hsl(var(--stamina))" : "0 0 6px hsl(var(--critical))",
                }}
            />
            <span className="text-[8px] text-muted-foreground">{t.vehicle.landingGear.toUpperCase()}</span>
        </motion.div>
    );
};
