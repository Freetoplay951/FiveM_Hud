import { motion } from "framer-motion";
import { BodyHealthIndicator } from "../shared/BodyHealthIndicator";

interface CarWarningWidgetProps {
    bodyHealth?: number;
    visible: boolean;
}

export const CarWarningWidget = ({ bodyHealth, visible }: CarWarningWidgetProps) => {
    if (bodyHealth === undefined) return null;

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
