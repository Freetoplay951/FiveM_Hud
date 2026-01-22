import { memo, useCallback, useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useKeybindsStore,
    useKeyboardExpanded,
    useSelectedKey,
    useLayoutOverride,
    useLoadedLayouts,
} from "@/stores/keybindsStore";
import { useTranslation } from "@/contexts/LanguageContext";
import { KeyboardLayoutData, LanguageConfig } from "@/types/translation";

// =============================================================================
// Constants
// =============================================================================

const KEY_WIDTHS: Record<string, string> = {
    "ESC": "w-12",
    "BACK": "w-16",
    "TAB": "w-14",
    "\\": "w-12",
    "#": "w-12",
    "CAPS": "w-16",
    "ENTER": "w-16",
    "LSHIFT": "w-20",
    "RSHIFT": "w-20",
    "<": "w-10",
    "LCTRL": "w-14",
    "WIN": "w-12",
    "LALT": "w-12",
    "SPACE": "w-48",
    "RALT": "w-12",
    "ALTGR": "w-12",
    "FN": "w-12",
    "RCTRL": "w-14",
};

// =============================================================================
// Helper: Extract unique keyboard layouts from language config
// =============================================================================

const getUniqueKeyboards = (languages: Record<string, LanguageConfig> | undefined): string[] => {
    if (!languages) return [];
    return [
        ...new Set(
            Object.values(languages)
                .map((l) => l.keyboard)
                .filter(Boolean),
        ),
    ];
};

// =============================================================================
// Sub-Components
// =============================================================================

interface KeyProps {
    keyName: string;
    bindCount: number;
    isSelected: boolean;
    onClick: (key: string) => void;
}

const Key = memo(({ keyName, bindCount, isSelected, onClick }: KeyProps) => {
    const widthClass = KEY_WIDTHS[keyName] || "w-10";

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
        return "bg-critical/20 border-critical/60 text-critical hover:border-critical shadow-[0_0_8px_hsl(var(--critical)/0.3)]";
    };

    const handleClick = useCallback(() => onClick(keyName), [keyName, onClick]);

    return (
        <button
            onClick={handleClick}
            className={cn(
                "relative h-9 rounded-md border transition-all duration-200 flex items-center justify-center",
                "text-xs font-medium hud-text uppercase tracking-wider",
                "hover:scale-105 active:scale-95",
                widthClass,
                getKeyStyle(),
            )}>
            {keyName !== "SPACE" && keyName}
            {bindCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-card border border-current text-[10px] flex items-center justify-center">
                    {bindCount}
                </span>
            )}
        </button>
    );
});

Key.displayName = "Key";

interface LayoutSelectorProps {
    currentLayout: string;
    availableLayouts: { id: string; name: string }[];
    onLayoutChange: (layout: string | null) => void;
}

const LayoutSelector = memo(({ currentLayout, availableLayouts, onLayoutChange }: LayoutSelectorProps) => (
    <div className="flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex rounded-md overflow-hidden border border-border/50">
            {availableLayouts.map((layout) => (
                <button
                    key={layout.id}
                    onClick={() => onLayoutChange(layout.id === currentLayout ? null : layout.id)}
                    className={cn(
                        "px-2 py-1 text-xs transition-colors",
                        currentLayout === layout.id
                            ? "bg-primary/20 text-primary"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
                    )}>
                    {layout.name}
                </button>
            ))}
        </div>
    </div>
));

LayoutSelector.displayName = "LayoutSelector";

const KeyboardLegend = memo(({ labels }: { labels: { none: string; one: string; conflict: string } }) => (
    <div className="px-4 pb-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted/50 border border-border/50" />
            <span className="text-muted-foreground">{labels.none}</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-stamina/20 border border-stamina/60" />
            <span className="text-muted-foreground">{labels.one}</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-critical/20 border border-critical/60" />
            <span className="text-muted-foreground">{labels.conflict}</span>
        </div>
    </div>
));
KeyboardLegend.displayName = "KeyboardLegend";

// =============================================================================
// Main Component
// =============================================================================

export const VirtualKeyboard = memo(() => {
    const { t, language, languages } = useTranslation();

    // Store
    const expanded = useKeyboardExpanded();
    const selectedKey = useSelectedKey();
    const layoutOverride = useLayoutOverride();
    const loadedLayouts = useLoadedLayouts();
    const toggleExpanded = useKeybindsStore((s) => s.toggleKeyboardExpanded);
    const setSelectedKey = useKeybindsStore((s) => s.setSelectedKey);
    const getKeyBindCount = useKeybindsStore((s) => s.getKeyBindCount);
    const setLayoutOverride = useKeybindsStore((s) => s.setLayoutOverride);
    const loadLayout = useKeybindsStore((s) => s.loadLayout);

    // Derived: effective layout
    const effectiveLayout: string = useMemo(() => {
        if (layoutOverride) return layoutOverride;
        return languages?.languages[language]?.keyboard || "qwerty";
    }, [layoutOverride, languages, language]);

    // Derived: available layouts with names
    const availableLayouts = useMemo(() => {
        const ids = getUniqueKeyboards(languages?.languages);
        return ids.map((id) => ({ id, name: loadedLayouts[id]?.name || id.toUpperCase() }));
    }, [languages, loadedLayouts]);

    const [keyboardData, setKeyboardData] = useState<KeyboardLayoutData | null>(null);

    // Preload all layouts once
    useEffect(() => {
        getUniqueKeyboards(languages?.languages).forEach(loadLayout);
    }, [languages, loadLayout]);

    // Set keyboard data when layout changes
    useEffect(() => {
        const cached = loadedLayouts[effectiveLayout];
        if (cached) {
            setKeyboardData(cached);
        } else {
            loadLayout(effectiveLayout).then(setKeyboardData);
        }
    }, [effectiveLayout, loadedLayouts, loadLayout]);

    const handleKeyClick = useCallback(
        (key: string) => setSelectedKey(selectedKey === key ? null : key),
        [selectedKey, setSelectedKey],
    );

    // Pre-calculate all bind counts
    const bindCounts = useMemo(() => {
        if (!keyboardData?.rows) return {};
        const counts: Record<string, number> = {};
        keyboardData.rows.flat().forEach((key) => {
            counts[key] = getKeyBindCount(key);
        });
        return counts;
    }, [getKeyBindCount, keyboardData]);

    // Translations with fallbacks
    const translations = {
        keyboard: t?.keybinds?.keyboard ?? "Keyboard",
        noBinding: t?.keybinds?.noBinding ?? "No binding",
        oneBinding: t?.keybinds?.oneBinding ?? "One binding",
        conflict: t?.keybinds?.conflict ?? "Conflict (≥2)",
    };

    if (!keyboardData) return null;

    return (
        <div className="glass-panel rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
                <button
                    onClick={toggleExpanded}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider hud-text">
                        {translations.keyboard}
                    </span>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-primary" />
                    )}
                </button>

                {expanded && availableLayouts.length > 1 && (
                    <LayoutSelector
                        currentLayout={effectiveLayout}
                        availableLayouts={availableLayouts}
                        onLayoutChange={setLayoutOverride}
                    />
                )}
            </div>

            {/* Keyboard Grid */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5 items-center">
                            {keyboardData.rows.map((row, i) => (
                                <div
                                    key={i}
                                    className="flex gap-1">
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
                        <KeyboardLegend
                            labels={{
                                none: translations.noBinding,
                                one: translations.oneBinding,
                                conflict: translations.conflict,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

VirtualKeyboard.displayName = "VirtualKeyboard";
