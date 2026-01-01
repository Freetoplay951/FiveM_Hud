import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Send, X, Shield, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamChatState } from "@/types/hud";
import { useChatHistory } from "@/hooks/useChatHistory";

interface TeamChatWidgetProps {
    teamChat: TeamChatState;
    onSendMessage?: (message: string) => void;
    onClose?: () => void;
    editMode: boolean;
    autoHideDelay?: number; // Zeit in ms bis der Chat versteckt wird (default: 10000)
}

const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof Shield }> = {
    supporter: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", icon: Shield },
    moderator: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: Shield },
    admin: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", icon: Shield },
    superadmin: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: Crown },
    owner: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", icon: Crown },
    default: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30", icon: Shield },
};

export const TeamChatWidget = ({
    teamChat,
    onSendMessage,
    onClose,
    editMode,
    autoHideDelay = 10000,
}: TeamChatWidgetProps) => {
    const [inputValue, setInputValue] = useState("");
    const [isAutoHidden, setIsAutoHidden] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageCountRef = useRef(teamChat.messages.length);

    const { addToHistory, navigatePrevious, navigateNext, resetNavigation } = useChatHistory();

    const teamColor = TEAM_COLORS[teamChat.teamType] || TEAM_COLORS.default;

    const isVisible = teamChat.isVisible ?? true;
    const isInputActive = teamChat.isInputActive || editMode;
    const hasMessages = teamChat.messages.length > 0;

    // Auto-hide Timer Logic
    const resetAutoHideTimer = useCallback(() => {
        if (autoHideTimerRef.current) {
            clearTimeout(autoHideTimerRef.current);
        }
        setIsAutoHidden(false);

        // Nur Timer starten wenn Input nicht aktiv ist
        if (!isInputActive && !editMode) {
            autoHideTimerRef.current = setTimeout(() => {
                setIsAutoHidden(true);
            }, autoHideDelay);
        }
    }, [autoHideDelay, isInputActive, editMode]);

    // Reset timer wenn neue Nachrichten kommen
    useEffect(() => {
        if (teamChat.messages.length > lastMessageCountRef.current) {
            resetAutoHideTimer();
        }
        lastMessageCountRef.current = teamChat.messages.length;
    }, [teamChat.messages.length, resetAutoHideTimer]);

    // Reset timer wenn Input aktiv wird oder editMode sich ändert
    useEffect(() => {
        if (isInputActive || editMode) {
            if (autoHideTimerRef.current) {
                clearTimeout(autoHideTimerRef.current);
            }
            setIsAutoHidden(false);
        } else if (hasMessages) {
            resetAutoHideTimer();
        }
    }, [isInputActive, editMode, hasMessages, resetAutoHideTimer]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autoHideTimerRef.current) {
                clearTimeout(autoHideTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [teamChat.messages]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, [teamChat.isInputActive]);

    useEffect(() => {
        if (!isInputActive) return;

        const focusInput = () => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        };

        focusInput();

        const handleFocus = () => {
            if (isInputActive) {
                setTimeout(focusInput, 50);
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [isInputActive]);

    const closeChat = useCallback(() => {
        setInputValue("");
        resetNavigation();
        onClose?.();
    }, [onClose, resetNavigation]);

    const handleSend = useCallback(() => {
        if (!inputValue.trim() || !onSendMessage) return;

        const msg = inputValue.trim();
        addToHistory(msg);
        onSendMessage(msg);
        setInputValue("");
        closeChat();
    }, [inputValue, onSendMessage, addToHistory, closeChat]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
            if (e.key === "Escape") {
                closeChat();
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                const prev = navigatePrevious(inputValue);
                if (prev !== null) setInputValue(prev);
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = navigateNext();
                if (next !== null) setInputValue(next);
            }
        },
        [handleSend, closeChat, navigatePrevious, navigateNext, inputValue]
    );

    if (!teamChat.hasAccess) {
        return (
            <motion.div
                className="glass-panel rounded-lg overflow-hidden flex flex-col items-center justify-center"
                style={{ width: "320px", height: "280px" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}>
                <Lock
                    size={32}
                    className="text-muted-foreground/50 mb-2"
                />
                <span className="text-xs text-muted-foreground">Kein Zugriff</span>
                <span className="text-[10px] text-muted-foreground/70 mt-1 text-center px-4">
                    Nur für Team-Mitglieder
                </span>
            </motion.div>
        );
    }

    // Auto-hide: Wenn Timer abgelaufen und Input nicht aktiv, verstecken
    if (isAutoHidden && !isInputActive) {
        return null;
    }

    if (!isVisible && !isInputActive && !hasMessages) return null;

    const TeamIcon = teamColor.icon;

    return (
        <AnimatePresence>
            {(isVisible || isInputActive || hasMessages) && (
                <motion.div
                    ref={containerRef}
                    className="glass-panel rounded-lg overflow-hidden flex flex-col border"
                    style={{ width: "320px", height: "280px" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}>
                    {/* Header */}
                    <div
                        className={cn(
                            "flex items-center justify-between px-3 py-2 border-b",
                            teamColor.border,
                            teamColor.bg
                        )}>
                        <div className="flex items-center gap-2">
                            <TeamIcon
                                size={14}
                                className={teamColor.text}
                            />
                            <span className={cn("text-xs font-medium uppercase tracking-wider", teamColor.text)}>
                                {teamChat.teamName}
                            </span>
                            {teamChat.isAdmin && (
                                <Shield
                                    size={10}
                                    className="text-warning"
                                />
                            )}
                            {teamChat.unreadCount > 0 && (
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 text-[10px] rounded-full",
                                        teamColor.bg,
                                        teamColor.text
                                    )}>
                                    {teamChat.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{teamChat.onlineMembers} online</span>
                            {onClose && isInputActive && (
                                <button
                                    onClick={closeChat}
                                    className="p-1 rounded hover:bg-background/50 transition-colors ml-1">
                                    <X
                                        size={12}
                                        className="text-muted-foreground"
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
                        <AnimatePresence initial={false}>
                            {teamChat.messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="text-xs leading-relaxed">
                                    <span className="text-[10px] text-muted-foreground/50 mr-1.5">{msg.timestamp}</span>
                                    {msg.rank && (
                                        <span
                                            className={cn(
                                                "text-[9px] px-1 py-0.5 rounded mr-1",
                                                teamColor.bg,
                                                teamColor.text
                                            )}>
                                            {msg.rank}
                                        </span>
                                    )}
                                    <span className={cn("font-medium mr-1", teamColor.text)}>{msg.sender}:</span>
                                    <span
                                        className={cn(
                                            "text-foreground",
                                            msg.isImportant && "font-semibold text-warning"
                                        )}>
                                        {msg.message}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    {isInputActive && (
                        <div className={cn("px-3 py-2 border-t", teamColor.border, "bg-background/40")}>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Team-Nachricht..."
                                    className={cn(
                                        "flex-1 bg-background/30 border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
                                        teamColor.border
                                    )}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        inputValue.trim()
                                            ? cn(teamColor.bg, teamColor.text, "hover:opacity-80")
                                            : "bg-background/20 text-muted-foreground/50 cursor-not-allowed"
                                    )}>
                                    <Send size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
