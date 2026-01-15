import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Command, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeybinds, useKeybindsSearch, useSelectedKey, Keybind } from "@/stores/keybindsStore";
import { useTranslation } from "@/contexts/LanguageContext";

interface KeybindCardProps {
    keybind: Keybind;
    index: number;
    actionLabel: string;
}

const KeybindCard = memo(({ keybind, index, actionLabel }: KeybindCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={cn(
                "glass-panel rounded-lg p-3",
                "hover:border-primary/40 transition-all duration-200",
                "group cursor-default"
            )}>
            <div className="flex items-start justify-between gap-3">
                {/* Left: Command info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Command className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground truncate hud-text">
                            {keybind.command}
                        </span>
                        {keybind.isAction && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                                {actionLabel}
                            </span>
                        )}
                    </div>
                    {keybind.description && (
                        <p className="text-xs text-muted-foreground truncate">{keybind.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                        <Gamepad2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {keybind.resource}
                        </span>
                    </div>
                </div>

                {/* Right: Key badge */}
                <div
                    className={cn(
                        "px-3 py-1.5 rounded-md border text-sm font-bold uppercase",
                        "bg-card border-primary/40 text-primary hud-text",
                        "shadow-[0_0_10px_hsl(var(--primary)/0.2)]",
                        "group-hover:border-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]",
                        "transition-all duration-200"
                    )}>
                    {keybind.key}
                </div>
            </div>
        </motion.div>
    );
});

KeybindCard.displayName = "KeybindCard";

export const KeybindsList = memo(() => {
    const { t } = useTranslation();
    const keybinds = useKeybinds();
    const searchQuery = useKeybindsSearch();
    const selectedKey = useSelectedKey();

    // Fallback translations
    const translations = {
        noKeybindsFound: t?.keybinds?.noKeybindsFound ?? "No keybinds found",
        key: t?.keybinds?.key ?? "Key",
        action: t?.keybinds?.action ?? "Action",
    };

    // Filter keybinds based on search and selected key
    const filteredKeybinds = useMemo(() => {
        let result = keybinds;

        // Filter by selected key
        if (selectedKey) {
            result = result.filter((kb) => kb.key.toUpperCase() === selectedKey.toUpperCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (kb) =>
                    kb.command.toLowerCase().includes(query) ||
                    kb.resource.toLowerCase().includes(query) ||
                    kb.description?.toLowerCase().includes(query) ||
                    kb.key.toLowerCase().includes(query)
            );
        }

        return result;
    }, [keybinds, searchQuery, selectedKey]);

    // Group by resource
    const groupedKeybinds = useMemo(() => {
        const groups: Record<string, Keybind[]> = {};
        filteredKeybinds.forEach((kb) => {
            if (!groups[kb.resource]) {
                groups[kb.resource] = [];
            }
            groups[kb.resource].push(kb);
        });
        return groups;
    }, [filteredKeybinds]);

    if (filteredKeybinds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Command className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{translations.noKeybindsFound}</p>
                {selectedKey && <p className="text-xs text-muted-foreground/70 mt-1">{translations.key}: {selectedKey}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {Object.entries(groupedKeybinds).map(([resource, binds]) => (
                <div key={resource}>
                    {/* Resource header */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider hud-text px-2">
                            {resource}
                        </span>
                        <span className="text-xs text-muted-foreground/50">({binds.length})</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                    </div>

                    {/* Keybind cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {binds.map((keybind, index) => (
                            <KeybindCard
                                key={keybind.id}
                                keybind={keybind}
                                index={index}
                                actionLabel={translations.action}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
});

KeybindsList.displayName = "KeybindsList";
