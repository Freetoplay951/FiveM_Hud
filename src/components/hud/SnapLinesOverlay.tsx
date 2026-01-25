import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SnapLine } from "@/lib/snapLineUtils";

interface SnapLinesOverlayProps {
    snapLines: SnapLine[];
    isActive: boolean;
}

/** Deduplicate snap lines by position, type, and snapType */
const deduplicateSnapLines = (lines: SnapLine[]): SnapLine[] => {
    return lines.reduce<SnapLine[]>((acc, line) => {
        const exists = acc.some(
            (l) =>
                l.type === line.type &&
                l.snapType === line.snapType &&
                Math.abs(l.position - line.position) < 1
        );
        if (!exists) acc.push(line);
        return acc;
    }, []);
};

/** Snap line visual component */
const SnapLineVisual = memo(({ line, index }: { line: SnapLine; index: number }) => {
    const isGapSnap = line.snapType === "gap";
    const lineColor = "hsl(var(--primary))";

    const style = useMemo(() => {
        if (line.type === "vertical") {
            return {
                left: line.position,
                top: 0,
                width: 1,
                height: "100vh",
                background: isGapSnap
                    ? `repeating-linear-gradient(to bottom, ${lineColor} 0px, ${lineColor} 4px, transparent 4px, transparent 8px)`
                    : lineColor,
                boxShadow: isGapSnap
                    ? `0 0 6px ${lineColor}`
                    : `0 0 8px ${lineColor}, 0 0 16px hsl(var(--primary) / 0.5)`,
            };
        }
        return {
            left: 0,
            top: line.position,
            width: "100vw",
            height: 1,
            background: isGapSnap
                ? `repeating-linear-gradient(to right, ${lineColor} 0px, ${lineColor} 4px, transparent 4px, transparent 8px)`
                : lineColor,
            boxShadow: isGapSnap
                ? `0 0 6px ${lineColor}`
                : `0 0 8px ${lineColor}, 0 0 16px hsl(var(--primary) / 0.5)`,
        };
    }, [line.type, line.position, isGapSnap, lineColor]);

    return (
        <motion.div
            key={`${line.type}-${line.snapType}-${line.position}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute"
            style={style}
        />
    );
});

SnapLineVisual.displayName = "SnapLineVisual";

const SnapLinesOverlayComponent = ({ snapLines, isActive }: SnapLinesOverlayProps) => {
    const uniqueLines = useMemo(() => deduplicateSnapLines(snapLines), [snapLines]);

    if (!isActive || snapLines.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[55]">
            <AnimatePresence>
                {/* Snap lines */}
                {uniqueLines.map((line, index) => (
                    <SnapLineVisual key={`line-${line.type}-${line.position}-${index}`} line={line} index={index} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export const SnapLinesOverlay = memo(SnapLinesOverlayComponent);