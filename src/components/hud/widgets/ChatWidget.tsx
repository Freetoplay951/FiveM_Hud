import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatState } from "@/types/hud";
import { isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";
import { useChatHistory } from "@/hooks/useChatHistory";

interface ChatCommand {
    command: string;
    description: string;
    usage?: string;
}

const DEMO_COMMANDS: ChatCommand[] = [
    { command: "/me", description: "Aktion ausführen", usage: "/me [text]" },
    { command: "/do", description: "Umgebungsbeschreibung", usage: "/do [text]" },
    { command: "/ooc", description: "Out of Character", usage: "/ooc [text]" },
    { command: "/whisper", description: "Flüstern", usage: "/whisper [text]" },
    { command: "/shout", description: "Schreien", usage: "/shout [text]" },
    { command: "/tc", description: "Team Chat öffnen", usage: "/tc" },
    { command: "/clear", description: "Chat leeren", usage: "/clear" },
    { command: "/help", description: "Hilfe anzeigen", usage: "/help" },
    { command: "/report", description: "Report erstellen", usage: "/report [spieler] [grund]" },
    { command: "/pm", description: "Private Nachricht", usage: "/pm [id] [text]" },
    { command: "/hudedit", description: "HUD Editor öffnen", usage: "/hudedit" },
];

interface ChatWidgetProps {
    chat: ChatState;
    onSendMessage?: (message: string) => void;
    onClose?: () => void;
    editMode: boolean;
    autoHideDelay?: number; // Zeit in ms bis der Chat versteckt wird (default: 10000)
}

export const ChatWidget = ({ chat, onSendMessage, onClose, editMode, autoHideDelay = 10000 }: ChatWidgetProps) => {
    const [inputValue, setInputValue] = useState("");
    const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const [nuiCommands, setNuiCommands] = useState<ChatCommand[]>([]);
    const [isAutoHidden, setIsAutoHidden] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const commandListRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageCountRef = useRef(chat.messages.length);

    // Persistent chat history
    const { addToHistory, navigatePrevious, navigateNext, resetNavigation } = useChatHistory();

    const isVisible = chat.isVisible ?? true;
    const isInputActive = chat.isInputActive || editMode;
    const hasMessages = chat.messages.length > 0;

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

    // Load commands from FiveM
    useEffect(() => {
        if (isNuiEnvironment()) {
            sendNuiCallback<{ success: boolean; commands: ChatCommand[] }>("getCommands").then((response) => {
                if (response?.success && response.commands) {
                    setNuiCommands(response.commands);
                }
            });
        }

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;
            if (action === "updateCommands" && Array.isArray(data)) {
                setNuiCommands(data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const availableCommands = useMemo(() => {
        if (nuiCommands.length > 0) return nuiCommands;
        return DEMO_COMMANDS;
    }, [nuiCommands]);

    const filteredCommands = useMemo(() => {
        if (!inputValue.startsWith("/")) return [];
        const search = inputValue.toLowerCase();
        return availableCommands.filter((cmd) => cmd.command.toLowerCase().startsWith(search));
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

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, [chat.isInputActive]);

    // Focus input when chat opens - with recovery after tab-out
    useEffect(() => {
        if (!isInputActive) return;

        const focusInput = () => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        };

        // Initial focus
        focusInput();

        // Re-focus when window gains focus (after tab-out)
        const handleFocus = () => {
            if (isInputActive) {
                // Small delay to ensure DOM is ready
                setTimeout(focusInput, 50);
            }
        };

        // Re-focus when clicking container
        const handleContainerClick = (e: MouseEvent) => {
            // Don't steal focus from buttons
            if ((e.target as HTMLElement).tagName === "BUTTON") return;
            focusInput();
        };

        window.addEventListener("focus", handleFocus);
        containerRef.current?.addEventListener("click", handleContainerClick);

        return () => {
            window.removeEventListener("focus", handleFocus);
            containerRef.current?.removeEventListener("click", handleContainerClick);
        };
    }, [isInputActive]);

    // Scroll selected command into view
    useEffect(() => {
        if (showCommandSuggestions && commandListRef.current) {
            const selectedElement = commandListRef.current.querySelector(`[data-index="${selectedCommandIndex}"]`);
            selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedCommandIndex, showCommandSuggestions]);

    const selectCommand = useCallback(
        (command: string) => {
            const cmd = availableCommands.find((c) => c.command === command);
            if (cmd?.usage?.includes("[")) {
                setInputValue(command + " ");
            } else {
                setInputValue(command);
            }
            setShowCommandSuggestions(false);
            inputRef.current?.focus();
        },
        [availableCommands]
    );

    const closeChat = useCallback(() => {
        setShowCommandSuggestions(false);
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
        setShowCommandSuggestions(false);

        const isValidCommand =
            msg.startsWith("/") &&
            availableCommands.some((cmd) => cmd.command.toLowerCase() === msg.split(" ")[0].toLowerCase());

        if (isValidCommand) {
            onClose();
        }
    }, [inputValue, onSendMessage, addToHistory, closeChat]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // ESC closes the chat
            if (e.key === "Escape") {
                e.preventDefault();
                closeChat();
                return;
            }

            // Tab closes the chat
            if (e.key === "Tab") {
                e.preventDefault();
                closeChat();
                return;
            }

            // Command suggestions navigation
            if (showCommandSuggestions && filteredCommands.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
                    return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const exactMatch = availableCommands.find(
                        (cmd) => cmd.command.toLowerCase() === inputValue.toLowerCase()
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
            if (e.key === "ArrowUp" && !showCommandSuggestions) {
                e.preventDefault();
                const prev = navigatePrevious(inputValue);
                if (prev !== null) setInputValue(prev);
                return;
            }

            // Arrow down - newer message
            if (e.key === "ArrowDown" && !showCommandSuggestions) {
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
        ]
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

    // Auto-hide: Wenn Timer abgelaufen und Input nicht aktiv, verstecken
    if (isAutoHidden && !isInputActive) {
        return null;
    }

    if (!isVisible && !isInputActive && !hasMessages) {
        return null;
    }

    return (
        <AnimatePresence>
            {(isVisible || isInputActive || hasMessages) && (
                <motion.div
                    ref={containerRef}
                    className="glass-panel border border-border/30 rounded-lg overflow-hidden flex flex-col"
                    style={{ width: "320px", height: "280px" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/40">
                        <div className="flex items-center gap-2">
                            <MessageSquare
                                size={14}
                                className="text-primary"
                            />
                            <span className="text-xs font-medium text-foreground uppercase tracking-wider">Chat</span>
                            {chat.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary">
                                    {chat.unreadCount}
                                </span>
                            )}
                        </div>
                        {onClose && isInputActive && (
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
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
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
                                                msg.type === "system" ? "text-warning" : "text-primary"
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
                                                                : "hover:bg-accent/50"
                                                        )}>
                                                        <Terminal
                                                            size={12}
                                                            className={cn(
                                                                "shrink-0",
                                                                index === selectedCommandIndex
                                                                    ? "text-primary"
                                                                    : "text-muted-foreground"
                                                            )}
                                                        />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-medium",
                                                                    index === selectedCommandIndex
                                                                        ? "text-primary"
                                                                        : "text-foreground"
                                                                )}>
                                                                {cmd.command}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {cmd.description}
                                                            </span>
                                                        </div>
                                                        {cmd.usage && (
                                                            <span className="text-[9px] text-muted-foreground/60 shrink-0 font-mono">
                                                                {cmd.usage}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-2 py-1 border-t border-border/30 bg-background/30">
                                                <span className="text-[9px] text-muted-foreground">
                                                    ↑↓ navigieren • Tab/Enter auswählen • Esc schließen
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nachricht eingeben... (/ für Commands)"
                                    className="flex-1 bg-background/30 border border-border/30 rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        inputValue.trim()
                                            ? "bg-primary/20 text-primary hover:bg-primary/30"
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
