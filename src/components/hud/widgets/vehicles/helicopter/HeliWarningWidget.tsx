import { motion } from "framer-motion";
import { BodyHealthIndicator } from "../shared/BodyHealthIndicator";

interface HeliWarningWidgetProps {
    bodyHealth?: number;
    visible: boolean;
}

export const HeliWarningWidget = ({ bodyHealth = 1000, visible }: HeliWarningWidgetProps) => {
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
