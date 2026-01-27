import { memo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeybindsStore, useKeybindsVisible, useKeybindsSearch, useSelectedKey } from "@/stores/keybindsStore";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { KeybindsList } from "./KeybindsList";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { useTranslation } from "@/contexts/LanguageContext";

export const KeybindsOverlay = memo(() => {
    const { t, isLoaded } = useTranslation();

    // Fallback translations (only used before translations are loaded)
    const translations = {
        title: t?.keybinds?.title ?? "Keybindings",
        subtitle: t?.keybinds?.subtitle ?? "All available commands and keybinds",
        search: t?.keybinds?.search ?? "Search...",
        filter: t?.keybinds?.filter ?? "Filter",
        closeHint: t?.keybinds?.closeHint ?? "Press <esc>ESC</esc> or <key>K</key> to close",
    };
    const isVisible = useKeybindsVisible();
    const searchQuery = useKeybindsSearch();
    const selectedKey = useSelectedKey();
    const setVisible = useKeybindsStore((s) => s.setVisible);
    const setSearchQuery = useKeybindsStore((s) => s.setSearchQuery);
    const setSelectedKey = useKeybindsStore((s) => s.setSelectedKey);

    // Handle escape key to close
    const handleClose = useCallback(() => {
        setVisible(false);
        setSearchQuery("");
        setSelectedKey(null);
        sendNuiCallback("closeKeybinds");
    }, [setVisible, setSearchQuery, setSelectedKey]);

    // Keyboard event listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isVisible) {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isVisible, handleClose]);

    // Handle backdrop click
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                handleClose();
            }
        },
        [handleClose]
    );

    // Clear key filter
    const handleClearKeyFilter = useCallback(() => {
        setSelectedKey(null);
    }, [setSelectedKey]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 pointer-events-auto"
                    onClick={handleBackdropClick}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2, type: "spring", damping: 25 }}
                        className={cn(
                            "w-[90vw] max-w-5xl max-h-[90vh] flex flex-col",
                            "glass-panel rounded-xl border border-primary/20",
                            "shadow-[0_0_50px_hsl(var(--primary)/0.15)]"
                        )}
                        onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                                    <Keyboard className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground hud-text">{translations.title}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {translations.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={translations.search}
                                        className={cn(
                                            "w-64 h-9 pl-9 pr-4 rounded-lg",
                                            "bg-muted/50 border border-border/50",
                                            "text-sm text-foreground placeholder:text-muted-foreground",
                                            "focus:outline-none focus:border-primary/50 focus:bg-muted/70",
                                            "transition-all duration-200"
                                        )}
                                    />
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={handleClose}
                                    className={cn(
                                        "p-2 rounded-lg",
                                        "bg-muted/50 border border-border/50",
                                        "text-muted-foreground hover:text-foreground",
                                        "hover:border-destructive/50 hover:bg-destructive/10",
                                        "transition-all duration-200"
                                    )}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Fixed Keyboard Section */}
                        <div className="p-6 pb-0 shrink-0">
                            <VirtualKeyboard />

                            {/* Active filter indicator */}
                            {selectedKey && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-sm text-muted-foreground">{translations.filter}:</span>
                                    <button
                                        onClick={handleClearKeyFilter}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-sm",
                                            "bg-primary/20 border border-primary/40 text-primary",
                                            "hover:bg-primary/30 transition-colors",
                                            "flex items-center gap-2"
                                        )}>
                                        <span className="font-semibold uppercase hud-text">{selectedKey}</span>
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Keybinds List */}
                        <div className="px-6 pb-6 pt-4 flex-1 min-h-0 overflow-y-auto">
                            <KeybindsList />
                        </div>

                        {/* Footer hint */}
                        <div className="px-6 py-3 border-t border-border/50 flex items-center justify-center shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {translations.closeHint.split(/<esc>|<\/esc>|<key>|<\/key>/).map((part, i) => {
                                    if (i === 1) return <kbd key={i} className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">{part}</kbd>;
                                    if (i === 3) return <kbd key={i} className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">{part}</kbd>;
                                    return part;
                                })}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

KeybindsOverlay.displayName = "KeybindsOverlay";
