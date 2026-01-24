import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/hud";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { isNuiEnvironment } from "@/lib/nuiUtils";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useChatStore, useChatData, useChatCommands, ChatCommand } from "@/stores/chatStore";
import { useIsDemoMode } from "@/stores/hudStore";
import { useTranslation } from "@/contexts/LanguageContext";
import { useNotificationStore } from "@/stores/notificationStore";

const DEMO_COMMANDS: ChatCommand[] = [
    { command: "/me", description: "Aktion ausführen" },
    { command: "/do", description: "Umgebungsbeschreibung" },
    { command: "/ooc", description: "Out of Character" },
    { command: "/whisper", description: "Flüstern" },
    { command: "/shout", description: "Schreien" },
    { command: "/tc", description: "Team Chat öffnen" },
    { command: "/clear", description: "Chat leeren" },
    { command: "/help", description: "Hilfe anzeigen" },
    { command: "/report", description: "Report erstellen" },
    { command: "/pm", description: "Private Nachricht" },
    { command: "/hudedit", description: "HUD Editor öffnen" },
];

interface ChatWidgetProps {
    editMode: boolean;
    autoHideDelay?: number; // Zeit in ms bis der Chat versteckt wird (default: 10000)
}

export const ChatWidget = ({ editMode, autoHideDelay = 10000 }: ChatWidgetProps) => {
    // Zustand store access
    const { t } = useTranslation();

    const chat = useChatData();
    const isDemoMode = useIsDemoMode();
    const nuiCommands = useChatCommands();
    const setChatInputActive = useChatStore((s) => s.setChatInputActive);
    const addChatMessage = useChatStore((s) => s.addChatMessage);
    const showWarning = useNotificationStore((s) => s.warning);

    const [inputValue, setInputValue] = useState(chat.commandOnly ? "/" : "");
    const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const [isAutoHidden, setIsAutoHidden] = useState(false);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const commandListRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageCountRef = useRef(chat.messages.length);

    // Persistent chat history
    const { addToHistory, navigatePrevious, navigateNext, resetNavigation } = useChatHistory();

    const isVisible = chat.isVisible ?? true;
    const isInputActive = chat.isInputActive || editMode;
    const hasMessages = chat.messages.length > 0;

    // Auto-prefix "/" when commandOnly mode is enabled and input becomes active
    useEffect(() => {
        if (chat.isInputActive && chat.commandOnly && !inputValue.startsWith("/")) {
            setInputValue("/");
        }
    }, [chat.isInputActive, chat.commandOnly, inputValue]);

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
        if (chat.messages.length > lastMessageCountRef.current) {
            resetAutoHideTimer();
        }
        lastMessageCountRef.current = chat.messages.length;
    }, [chat.messages.length, resetAutoHideTimer]);

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

    // Request commands on mount (initial load)
    useEffect(() => {
        if (isNuiEnvironment()) {
            sendNuiCallback("getCommands");
        }
    }, []);

    const availableCommands = useMemo(() => {
        if (nuiCommands.length > 0) return nuiCommands;
        return DEMO_COMMANDS;
    }, [nuiCommands]);

    const filteredCommands = useMemo(() => {
        if (!inputValue.startsWith("/")) return [];
        const search = inputValue.toLowerCase().slice(1); // Remove the leading "/"
        return availableCommands.filter((cmd) => cmd.command.toLowerCase().slice(1).includes(search));
    }, [inputValue, availableCommands]);

    // Show suggestions when typing a command
    useEffect(() => {
        if (inputValue.startsWith("/") && filteredCommands.length > 0) {
            setShowCommandSuggestions(true);
            setSelectedCommandIndex(0);
        } else {
            setShowCommandSuggestions(false);
        }
    }, [inputValue, filteredCommands.length]);

    // Smart auto-scroll: only scroll if user is at bottom
    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = "smooth") => {
            if (!isUserScrolled) {
                messagesEndRef.current?.scrollIntoView({ behavior });
            }
        },
        [isUserScrolled],
    );

    // Handle scroll to detect if user manually scrolled up
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 30; // 30px threshold
        setIsUserScrolled(!isAtBottom);
    }, []);

    // Auto-scroll to bottom when new messages arrive (if not manually scrolled)
    useEffect(() => {
        scrollToBottom("smooth");
    }, [chat.messages, scrollToBottom]);

    // Scroll to bottom when input becomes active
    useEffect(() => {
        if (chat.isInputActive) {
            setIsUserScrolled(false); // Reset scroll state when opening input
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        }
    }, [chat.isInputActive]);

    // Scroll selected command into view
    useEffect(() => {
        if (showCommandSuggestions && commandListRef.current) {
            const selectedElement = commandListRef.current.querySelector(`[data-index="${selectedCommandIndex}"]`);
            selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedCommandIndex, showCommandSuggestions]);

    const selectCommand = useCallback((commandName: string) => {
        setInputValue(commandName);
        setShowCommandSuggestions(false);
    }, []);

    const closeChat = useCallback(() => {
        setShowCommandSuggestions(false);
        setInputValue("");
        resetNavigation();
        if (isDemoMode) {
            setChatInputActive(false);
        } else {
            sendNuiCallback("closeChat");
        }
    }, [isDemoMode, setChatInputActive, resetNavigation]);

    const handleSend = useCallback(() => {
        if (!inputValue.trim()) return;

        const msg = inputValue.trim();

        // Command-Only: Block non-command messages
        if (chat.commandOnly && !msg.startsWith("/")) {
            return;
        }

        addToHistory(msg);

        if (isDemoMode) {
            // In Demo-Mode with Command-Only, only allow commands
            if (chat.commandOnly && !msg.startsWith("/")) {
                return;
            }

            addChatMessage({
                id: Date.now().toString(),
                type: "normal",
                sender: "Du",
                message: msg,
                timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            });
            setChatInputActive(false);
        } else {
            sendNuiCallback("sendChatMessage", { message: msg });
        }

        setInputValue(chat.commandOnly ? "/" : "");
        setShowCommandSuggestions(false);

        const isValidCommand =
            msg.startsWith("/") &&
            availableCommands.some((cmd) => cmd.command.toLowerCase() === msg.split(" ")[0].toLowerCase());

        if (isValidCommand) {
            setChatInputActive(false);
        }
    }, [inputValue, addToHistory, isDemoMode, addChatMessage, setChatInputActive, availableCommands, chat.commandOnly]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // ESC closes the chat
            if (e.key === "Escape") {
                e.preventDefault();
                closeChat();
                return;
            }

            const filteredCmds = filteredCommands.length;

            // Tab navigates commands when suggestions are open, otherwise closes chat
            if (e.key === "Tab") {
                e.preventDefault();
                if (showCommandSuggestions && filteredCmds > 0) {
                    // Navigate through commands with Tab (forward) and Shift+Tab (backward)
                    if (e.shiftKey) {
                        setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : filteredCmds - 1));
                    } else {
                        setSelectedCommandIndex((prev) => (prev < filteredCmds - 1 ? prev + 1 : 0));
                    }
                    return;
                }
                closeChat();
                return;
            }

            // Command suggestions navigation
            if (showCommandSuggestions && filteredCmds > 0) {
                if (e.key === "ArrowDown" && filteredCmds > 1) {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev < filteredCmds - 1 ? prev + 1 : 0));
                    return;
                }
                if (e.key === "ArrowUp" && filteredCmds > 1) {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : filteredCmds - 1));
                    return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const exactMatch = availableCommands.find(
                        (cmd) => cmd.command.toLowerCase() === inputValue.toLowerCase(),
                    );
                    if (exactMatch) {
                        handleSend();
                    } else {
                        selectCommand(filteredCommands[selectedCommandIndex].command);
                    }
                    return;
                }
            }

            // Enter to send
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                return;
            }

            // Arrow up - previous message
            if (e.key === "ArrowUp") {
                e.preventDefault();
                const prev = navigatePrevious(inputValue);
                if (prev !== null) setInputValue(prev);
                return;
            }

            // Arrow down - newer message
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = navigateNext();
                if (next !== null) setInputValue(next);
            }
        },
        [
            showCommandSuggestions,
            filteredCommands,
            inputValue,
            availableCommands,
            selectedCommandIndex,
            handleSend,
            selectCommand,
            closeChat,
            navigatePrevious,
            navigateNext,
        ],
    );

    const getMessageColor = (type: ChatMessage["type"]) => {
        switch (type) {
            case "system":
                return "text-warning";
            case "action":
                return "text-primary";
            case "ooc":
                return "text-muted-foreground";
            case "whisper":
                return "text-muted-foreground/70 italic";
            case "shout":
                return "text-critical font-semibold";
            case "radio":
                return "text-info";
            default:
                return "text-foreground";
        }
    };

    // Visibility state for opacity-based hiding
    const shouldShow = !((isAutoHidden && !isInputActive) || (!isVisible && !isInputActive && !hasMessages));

    // Always render for size measurement
    const shouldRender = isVisible || isInputActive || hasMessages || editMode;

    return (
        <motion.div
            initial={false}
            animate={{
                opacity: shouldShow ? 1 : 0,
                pointerEvents: shouldShow ? "auto" : "none",
            }}
            transition={{ duration: 0.3 }}>
            <motion.div
                ref={containerRef}
                className="glass-panel border border-border/30 rounded-lg overflow-hidden flex flex-col"
                style={{
                    width: "320px",
                    height: "280px",
                    visibility: shouldRender ? "visible" : "hidden",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: shouldRender ? 1 : 0, y: shouldRender ? 0 : 20 }}
                transition={{ duration: 0.3 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/40">
                    <div className="flex items-center gap-2">
                        <MessageSquare
                            size={14}
                            className="text-primary"
                        />
                        <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                            {t.chat.title}
                        </span>
                        {/* Command-Only Indicator */}
                        {chat.commandOnly && (
                            <div
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/20 border border-warning/30"
                                title={t.chat.commandOnlyHint}>
                                <Terminal
                                    size={10}
                                    className="text-warning"
                                />
                            </div>
                        )}
                        {chat.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary">
                                {chat.unreadCount}
                            </span>
                        )}
                    </div>
                    {isInputActive && (
                        <button
                            onClick={closeChat}
                            className="p-1 rounded hover:bg-background/50 transition-colors">
                            <X
                                size={12}
                                className="text-muted-foreground"
                            />
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                    <AnimatePresence initial={false}>
                        {chat.messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="text-xs leading-relaxed">
                                <span className="text-[10px] text-muted-foreground/50 mr-1.5">{msg.timestamp}</span>
                                {msg.sender && (
                                    <span
                                        className={cn(
                                            "font-medium mr-1",
                                            msg.type === "system" ? "text-warning" : "text-primary",
                                        )}>
                                        {msg.sender}:
                                    </span>
                                )}
                                <span className={getMessageColor(msg.type)}>{msg.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isInputActive && (
                    <div className="relative px-3 py-2 border-t border-border/30 bg-background/40">
                        {/* Command Suggestions Popup */}
                        <AnimatePresence>
                            {showCommandSuggestions && filteredCommands.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-3 right-3 mb-1 z-50">
                                    <div className="rounded-lg border border-border/50 bg-card shadow-lg overflow-hidden">
                                        <div className="px-2 py-1.5 border-b border-border/30">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                Commands
                                            </span>
                                        </div>
                                        <div
                                            ref={commandListRef}
                                            className="max-h-[150px] overflow-y-auto py-1">
                                            {filteredCommands.map((cmd, index) => (
                                                <div
                                                    key={cmd.command}
                                                    data-index={index}
                                                    onClick={() => selectCommand(cmd.command)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors",
                                                        index === selectedCommandIndex
                                                            ? "bg-primary/20 text-foreground"
                                                            : "hover:bg-accent/50",
                                                    )}>
                                                    <Terminal
                                                        size={12}
                                                        className={cn(
                                                            "shrink-0",
                                                            index === selectedCommandIndex
                                                                ? "text-primary"
                                                                : "text-muted-foreground",
                                                        )}
                                                    />
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span
                                                            className={cn(
                                                                "text-xs font-medium",
                                                                index === selectedCommandIndex
                                                                    ? "text-primary"
                                                                    : "text-foreground",
                                                            )}>
                                                            {cmd.command}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {cmd.description}
                                                        </span>
                                                    </div>
                                                    {/*                                                     
                                                    {cmd.usage && (
                                                        <span className="text-[9px] text-muted-foreground/60 shrink-0 font-mono">
                                                            {cmd.usage}
                                                        </span>
                                                    )} */}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-2 py-1 border-t border-border/30 bg-background/30">
                                            <span className="text-[9px] text-muted-foreground">
                                                {t.chat.navigation}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Command-Only Hint */}
                        {chat.commandOnly && (
                            <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-warning/10 border border-warning/20">
                                <Terminal
                                    size={10}
                                    className="text-warning shrink-0"
                                />
                                <span className="text-[10px] text-warning">{t.chat.commandOnlyHint}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                autoFocus={!editMode && isInputActive}
                                onBlur={(e) => {
                                    if (editMode) return;
                                    e.target.focus();
                                }}
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    // Im Command-Only Modus "/" nicht entfernbar
                                    if (chat.commandOnly && !newValue.startsWith("/")) {
                                        setInputValue("/" + newValue.replace(/^\/+/, ""));
                                        showWarning(t.chat.commandOnlyHint, t.chat.commandOnlyError, 3000);
                                        return;
                                    }
                                    setInputValue(newValue);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={chat.commandOnly ? t.chat.commandOnlyPlaceholder : t.chat.placeholder}
                                className="flex-1 bg-background/30 border border-border/30 rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className={cn(
                                    "p-1.5 rounded transition-colors",
                                    inputValue.trim()
                                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                                        : "bg-background/20 text-muted-foreground/50 cursor-not-allowed",
                                )}>
                                <Send size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
