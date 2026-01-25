import { motion } from "framer-motion";
import { BodyHealthIndicator } from "./BodyHealthIndicator";
import { VehicleHealthStatus } from "@/types/hud";

interface VehicleWarningWidgetProps {
    healthStatus: VehicleHealthStatus;
    visible: boolean;
}

/**
 * Shared warning widget for all vehicle types.
 * Displays the vehicle body health indicator with fade animation.
 */
export const VehicleWarningWidget = ({ healthStatus, visible }: VehicleWarningWidgetProps) => {
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
