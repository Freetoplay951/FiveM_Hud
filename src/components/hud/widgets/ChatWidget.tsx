import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatState } from "@/types/hud";
import { isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";

interface ChatCommand {
    command: string;
    description: string;
    usage?: string;
}

// Fallback Commands für Demo-Modus
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
];

interface ChatWidgetProps {
    chat: ChatState;
    onSendMessage?: (message: string) => void;
    onClose?: () => void;
    isOpen?: boolean;
    registeredCommands?: ChatCommand[];
}

export const ChatWidget = ({ chat, onSendMessage, onClose, isOpen = true, registeredCommands }: ChatWidgetProps) => {
    const [inputValue, setInputValue] = useState("");
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempInput, setTempInput] = useState("");
    const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
    const [nuiCommands, setNuiCommands] = useState<ChatCommand[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const commandListRef = useRef<HTMLDivElement>(null);

    // Bestimme ob Chat sichtbar sein soll
    const isVisible = chat.isVisible ?? true;
    const isInputActive = chat.isInputActive || isOpen;
    const hasMessages = chat.messages.length > 0;

    // Load commands from FiveM in production
    useEffect(() => {
        if (isNuiEnvironment()) {
            sendNuiCallback<{ success: boolean; commands: ChatCommand[] }>("getCommands").then((response) => {
                if (response?.success && response.commands) {
                    setNuiCommands(response.commands);
                }
            });
        }

        // Listen for updateCommands events from Lua
        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;
            if (action === "updateCommands" && Array.isArray(data)) {
                setNuiCommands(data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // Use registered commands from props, NUI, or fallback to demo
    const availableCommands = useMemo(() => {
        if (registeredCommands && registeredCommands.length > 0) {
            return registeredCommands;
        }
        if (nuiCommands.length > 0) {
            return nuiCommands;
        }
        return DEMO_COMMANDS;
    }, [registeredCommands, nuiCommands]);

    // Gefilterte Commands basierend auf Input
    const filteredCommands = useMemo(() => {
        if (!inputValue.startsWith("/")) return [];
        const search = inputValue.toLowerCase();
        return availableCommands.filter((cmd) =>
            cmd.command.toLowerCase().startsWith(search)
        );
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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages]);

    // Focus input when chat opens with input active
    useEffect(() => {
        if (isInputActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isInputActive]);

    // Scroll selected command into view
    useEffect(() => {
        if (showCommandSuggestions && commandListRef.current) {
            const selectedElement = commandListRef.current.querySelector(`[data-index="${selectedCommandIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }
    }, [selectedCommandIndex, showCommandSuggestions]);

    const selectCommand = (command: string) => {
        // Wenn Command Parameter hat, füge Leerzeichen hinzu
        const cmd = availableCommands.find((c) => c.command === command);
        if (cmd && cmd.usage && cmd.usage.includes("[")) {
            setInputValue(command + " ");
        } else {
            setInputValue(command);
        }
        setShowCommandSuggestions(false);
        inputRef.current?.focus();
    };

    const handleSend = () => {
        if (inputValue.trim() && onSendMessage) {
            const msg = inputValue.trim();
            // Add to history (avoid duplicates at the end)
            setMessageHistory((prev) => {
                if (prev[prev.length - 1] === msg) return prev;
                return [...prev, msg];
            });
            onSendMessage(msg);
            setInputValue("");
            setHistoryIndex(-1);
            setTempInput("");
            setShowCommandSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Command suggestions navigation
        if (showCommandSuggestions && filteredCommands.length > 0) {
            if (e.key === "Tab" || (e.key === "ArrowDown" && !e.shiftKey)) {
                e.preventDefault();
                setSelectedCommandIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                );
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedCommandIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                );
                return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                selectCommand(filteredCommands[selectedCommandIndex].command);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowCommandSuggestions(false);
                return;
            }
        }

        // Normal behavior when no suggestions
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === "Escape" && onClose) {
            onClose();
        }
        // Arrow up - previous message (nur wenn keine Suggestions)
        if (e.key === "ArrowUp" && messageHistory.length > 0 && !showCommandSuggestions) {
            e.preventDefault();
            if (historyIndex === -1) {
                setTempInput(inputValue);
                setHistoryIndex(messageHistory.length - 1);
                setInputValue(messageHistory[messageHistory.length - 1]);
            } else if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setInputValue(messageHistory[historyIndex - 1]);
            }
        }
        // Arrow down - newer message (nur wenn keine Suggestions)
        if (e.key === "ArrowDown" && historyIndex !== -1 && !showCommandSuggestions) {
            e.preventDefault();
            if (historyIndex < messageHistory.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setInputValue(messageHistory[historyIndex + 1]);
            } else {
                setHistoryIndex(-1);
                setInputValue(tempInput);
            }
        }
    };

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

    // Wenn nicht sichtbar und keine Eingabe aktiv, ausblenden
    if (!isVisible && !isInputActive && !hasMessages) {
        return null;
    }

    return (
        <AnimatePresence>
            {(isVisible || isInputActive || hasMessages) && (
                <motion.div
                    className="glass-panel border border-border/30 rounded-lg overflow-hidden flex flex-col"
                    style={{
                        width: "320px",
                        height: "280px",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isVisible || isInputActive ? 1 : 0.3, y: 0 }}
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
                                onClick={onClose}
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
                                    {/* Timestamp */}
                                    <span className="text-[10px] text-muted-foreground/50 mr-1.5">{msg.timestamp}</span>

                                    {/* Sender */}
                                    {msg.sender && (
                                        <span
                                            className={cn(
                                                "font-medium mr-1",
                                                msg.type === "system" ? "text-warning" : "text-primary"
                                            )}>
                                            {msg.sender}:
                                        </span>
                                    )}

                                    {/* Message */}
                                    <span className={getMessageColor(msg.type)}>{msg.message}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input - nur anzeigen wenn Eingabe aktiv */}
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
                                                className="max-h-[150px] overflow-y-auto py-1"
                                            >
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
                                                                index === selectedCommandIndex ? "text-primary" : "text-muted-foreground"
                                                            )} 
                                                        />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className={cn(
                                                                "text-xs font-medium",
                                                                index === selectedCommandIndex ? "text-primary" : "text-foreground"
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