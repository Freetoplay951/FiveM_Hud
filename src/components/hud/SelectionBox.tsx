import { motion } from "framer-motion";

interface SelectionBoxProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isActive: boolean;
}

export const SelectionBox = ({ startX, startY, endX, endY, isActive }: SelectionBoxProps) => {
    if (!isActive) return null;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[60]"
            style={{
                left,
                top,
                width,
                height,
                border: "2px dashed hsl(var(--primary))",
                backgroundColor: "hsl(var(--primary) / 0.1)",
                boxShadow: "0 0 10px hsl(var(--primary) / 0.3)",
            }}
        />
    );
};
