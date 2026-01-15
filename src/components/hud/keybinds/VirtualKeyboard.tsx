import { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeybindsStore, useKeyboardExpanded, useSelectedKey } from "@/stores/keybindsStore";
import { useTranslation } from "@/contexts/LanguageContext";

// Keyboard layout definition
const keyboardRows = [
    ["ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BACK"],
    ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER"],
    ["LSHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RSHIFT"],
    ["LCTRL", "WIN", "LALT", "SPACE", "RALT", "FN", "RCTRL"],
];

// Key width mappings (relative units)
const keyWidths: Record<string, string> = {
    ESC: "w-12",
    BACK: "w-16",
    TAB: "w-14",
    "\\": "w-12",
    CAPS: "w-16",
    ENTER: "w-16",
    LSHIFT: "w-20",
    RSHIFT: "w-20",
    LCTRL: "w-14",
    WIN: "w-12",
    LALT: "w-12",
    SPACE: "w-48",
    RALT: "w-12",
    FN: "w-12",
    RCTRL: "w-14",
};

interface KeyProps {
    keyName: string;
    bindCount: number;
    isSelected: boolean;
    onClick: (key: string) => void;
}

const Key = memo(({ keyName, bindCount, isSelected, onClick }: KeyProps) => {
    const widthClass = keyWidths[keyName] || "w-10";

    // Determine color based on bind count
    const getKeyStyle = () => {
        if (isSelected) {
            return "bg-primary/30 border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]";
        }
        if (bindCount === 0) {
            return "bg-muted/50 border-border/50 text-muted-foreground hover:border-muted-foreground/50";
        }
        if (bindCount === 1) {
            return "bg-stamina/20 border-stamina/60 text-stamina hover:border-stamina shadow-[0_0_8px_hsl(var(--stamina)/0.3)]";
        }
        // 2 or more bindings - conflict
        return "bg-critical/20 border-critical/60 text-critical hover:border-critical shadow-[0_0_8px_hsl(var(--critical)/0.3)]";
    };

    const handleClick = useCallback(() => {
        onClick(keyName);
    }, [keyName, onClick]);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "relative h-9 rounded-md border transition-all duration-200 flex items-center justify-center",
                "text-xs font-medium hud-text uppercase tracking-wider",
                "hover:scale-105 active:scale-95",
                widthClass,
                getKeyStyle()
            )}>
            {keyName === "SPACE" ? "" : keyName}
            {bindCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-card border border-current text-[10px] flex items-center justify-center">
                    {bindCount}
                </span>
            )}
        </button>
    );
});

Key.displayName = "Key";

export const VirtualKeyboard = memo(() => {
    const { t } = useTranslation();
    const expanded = useKeyboardExpanded();
    const selectedKey = useSelectedKey();
    const toggleExpanded = useKeybindsStore((s) => s.toggleKeyboardExpanded);
    const setSelectedKey = useKeybindsStore((s) => s.setSelectedKey);
    const getKeyBindCount = useKeybindsStore((s) => s.getKeyBindCount);

    const handleKeyClick = useCallback(
        (key: string) => {
            if (selectedKey === key) {
                setSelectedKey(null);
            } else {
                setSelectedKey(key);
            }
        },
        [selectedKey, setSelectedKey]
    );

    // Pre-calculate all bind counts
    const bindCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        keyboardRows.flat().forEach((key) => {
            counts[key] = getKeyBindCount(key);
        });
        return counts;
    }, [getKeyBindCount]);

    // Fallback translations
    const translations = {
        keyboard: t?.keybinds?.keyboard ?? "Keyboard",
        noBinding: t?.keybinds?.noBinding ?? "No binding",
        oneBinding: t?.keybinds?.oneBinding ?? "One binding",
        conflict: t?.keybinds?.conflict ?? "Conflict (≥2)",
    };

    return (
        <div className="glass-panel rounded-lg overflow-hidden">
            {/* Header */}
            <button
                onClick={toggleExpanded}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider hud-text">
                    {translations.keyboard}
                </span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-primary" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-primary" />
                )}
            </button>

            {/* Keyboard */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5 items-center overflow-visible">
                            {keyboardRows.map((row, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className="flex gap-1 overflow-visible">
                                    {row.map((key) => (
                                        <Key
                                            key={key}
                                            keyName={key}
                                            bindCount={bindCounts[key] || 0}
                                            isSelected={selectedKey === key}
                                            onClick={handleKeyClick}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="px-4 pb-3 flex items-center justify-center gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-muted/50 border border-border/50" />
                                <span className="text-muted-foreground">{translations.noBinding}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-stamina/20 border border-stamina/60" />
                                <span className="text-muted-foreground">{translations.oneBinding}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-critical/20 border border-critical/60" />
                                <span className="text-muted-foreground">{translations.conflict}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

VirtualKeyboard.displayName = "VirtualKeyboard";
