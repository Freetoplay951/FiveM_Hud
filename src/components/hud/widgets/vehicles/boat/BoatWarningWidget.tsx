import { motion } from "framer-motion";
import { BodyHealthIndicator } from "../shared/BodyHealthIndicator";
import { VehicleHealthStatus } from "@/types/hud";

interface BoatWarningWidgetProps {
    healthStatus: VehicleHealthStatus;
    visible: boolean;
}

export const BoatWarningWidget = ({ healthStatus, visible }: BoatWarningWidgetProps) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-full glass-panel border-none">
            <BodyHealthIndicator status={healthStatus} />
        </motion.div>
    );
};
