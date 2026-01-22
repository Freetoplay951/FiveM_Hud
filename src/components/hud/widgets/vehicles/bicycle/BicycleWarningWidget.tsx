import { motion } from "framer-motion";
import { BodyHealthIndicator } from "../shared/BodyHealthIndicator";

interface BicycleWarningWidgetProps {
    bodyHealth?: number;
    visible: boolean;
}

export const BicycleWarningWidget = ({ bodyHealth = 1000, visible }: BicycleWarningWidgetProps) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-full glass-panel border-none">
            <BodyHealthIndicator bodyHealth={bodyHealth} />
        </motion.div>
    );
};
