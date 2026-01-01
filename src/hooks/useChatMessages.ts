import { useState, useCallback, useRef, useEffect } from "react";
import { ChatMessage, TeamChatMessage } from "@/types/hud";

const MAX_MESSAGES = 50;
const AUTO_CLOSE_DELAY = 10000; // 10 seconds

interface ChatMessagesState {
    messages: ChatMessage[];
    isInputActive: boolean;
}

interface TeamChatMessagesState {
    messages: TeamChatMessage[];
    isInputActive: boolean;
    hasAccess: boolean;
    teamType: string;
    teamName: string;
    onlineMembers: number;
    isAdmin: boolean;
}

/**
 * Hook to manage chat messages in NUI.
 * Lua sends createMessage events, NUI manages the full message history.
 */
export const useChatMessages = () => {
    const [state, setState] = useState<ChatMessagesState>({
        messages: [],
        isInputActive: false,
    });

    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAutoCloseTimer = useCallback(() => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    }, []);

    const startAutoCloseTimer = useCallback(() => {
        clearAutoCloseTimer();
        autoCloseTimerRef.current = setTimeout(() => {
            setState((prev) => ({
                ...prev,
                isInputActive: false,
            }));
        }, AUTO_CLOSE_DELAY);
    }, [clearAutoCloseTimer]);

    // Add a new message
    const addMessage = useCallback(
        (message: ChatMessage) => {
            setState((prev) => {
                const newMessages = [...prev.messages, message].slice(-MAX_MESSAGES);
                return {
                    ...prev,
                    messages: newMessages,
                };
            });
            // Start auto-close timer only if input is not active
            setState((prev) => {
                if (!prev.isInputActive) {
                    startAutoCloseTimer();
                }
                return prev;
            });
        },
        [startAutoCloseTimer]
    );

    // Open chat (with or without input)
    const openChat = useCallback(
        (withInput: boolean) => {
            clearAutoCloseTimer();
            setState((prev) => ({
                ...prev,
                isInputActive: withInput,
            }));
        },
        [clearAutoCloseTimer]
    );

    // Close chat
    const closeChat = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isInputActive: false,
        }));
        startAutoCloseTimer();
    }, [startAutoCloseTimer]);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setState((prev) => ({
            ...prev,
            messages: [],
        }));
    }, []);

    // Get unread count (messages since input was last active)
    const getUnreadCount = useCallback(() => {
        if (state.isInputActive) return 0;
        // For simplicity, return 0 - unread logic can be enhanced later
        return 0;
    }, [state.isInputActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAutoCloseTimer();
        };
    }, [clearAutoCloseTimer]);

    return {
        messages: state.messages,
        isInputActive: state.isInputActive,
        addMessage,
        openChat,
        closeChat,
        clearMessages,
        getUnreadCount,
    };
};

/**
 * Hook to manage team chat messages in NUI.
 * Lua sends createMessage events, NUI manages the full message history.
 */
export const useTeamChatMessages = () => {
    const [state, setState] = useState<TeamChatMessagesState>({
        messages: [],
        isInputActive: false,
        hasAccess: false,
        teamType: "supporter",
        teamName: "Team-Chat",
        onlineMembers: 0,
        isAdmin: false,
    });

    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAutoCloseTimer = useCallback(() => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
    }, []);

    const startAutoCloseTimer = useCallback(() => {
        clearAutoCloseTimer();
        autoCloseTimerRef.current = setTimeout(() => {
            setState((prev) => ({
                ...prev,
                isInputActive: false,
            }));
        }, AUTO_CLOSE_DELAY);
    }, [clearAutoCloseTimer]);

    // Add a new message
    const addMessage = useCallback(
        (message: TeamChatMessage) => {
            setState((prev) => {
                const newMessages = [...prev.messages, message].slice(-MAX_MESSAGES);
                return {
                    ...prev,
                    messages: newMessages,
                };
            });
            // Start auto-close timer only if input is not active
            setState((prev) => {
                if (!prev.isInputActive) {
                    startAutoCloseTimer();
                }
                return prev;
            });
        },
        [startAutoCloseTimer]
    );

    // Open team chat (with or without input)
    const openChat = useCallback(
        (data: {
            withInput: boolean;
            hasAccess: boolean;
            teamType: string;
            teamName: string;
            onlineMembers: number;
            isAdmin: boolean;
        }) => {
            clearAutoCloseTimer();
            setState((prev) => ({
                ...prev,
                isInputActive: data.withInput,
                hasAccess: data.hasAccess,
                teamType: data.teamType,
                teamName: data.teamName,
                onlineMembers: data.onlineMembers,
                isAdmin: data.isAdmin,
            }));
        },
        [clearAutoCloseTimer]
    );

    // Close team chat
    const closeChat = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isInputActive: false,
        }));
        startAutoCloseTimer();
    }, [startAutoCloseTimer]);

    // Update metadata without affecting messages
    const updateMetadata = useCallback((data: Partial<Omit<TeamChatMessagesState, "messages">>) => {
        setState((prev) => ({
            ...prev,
            ...data,
        }));
    }, []);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setState((prev) => ({
            ...prev,
            messages: [],
        }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAutoCloseTimer();
        };
    }, [clearAutoCloseTimer]);

    return {
        messages: state.messages,
        isInputActive: state.isInputActive,
        hasAccess: state.hasAccess,
        teamType: state.teamType,
        teamName: state.teamName,
        onlineMembers: state.onlineMembers,
        isAdmin: state.isAdmin,
        addMessage,
        openChat,
        closeChat,
        updateMetadata,
        clearMessages,
    };
};
