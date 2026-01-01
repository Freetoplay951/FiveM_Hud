import { useState, useCallback, useRef } from 'react';

const STORAGE_KEY = 'hud-chat-history';
const MAX_HISTORY = 50;

/**
 * Hook to persist and manage chat input history across sessions.
 * History persists even when the chat is closed and reopened.
 */
export const useChatHistory = () => {
    // Initialize from localStorage
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [historyIndex, setHistoryIndex] = useState(-1);
    const tempInputRef = useRef('');

    // Add message to history
    const addToHistory = useCallback((message: string) => {
        if (!message.trim()) return;
        
        setHistory(prev => {
            // Avoid consecutive duplicates
            if (prev[prev.length - 1] === message) return prev;
            
            const newHistory = [...prev, message].slice(-MAX_HISTORY);
            
            // Persist to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            } catch {
                // Ignore storage errors
            }
            
            return newHistory;
        });
        
        // Reset index after adding
        setHistoryIndex(-1);
        tempInputRef.current = '';
    }, []);

    // Navigate to previous message (Arrow Up)
    const navigatePrevious = useCallback((currentInput: string): string | null => {
        if (history.length === 0) return null;
        
        if (historyIndex === -1) {
            // Save current input before navigating
            tempInputRef.current = currentInput;
            const newIndex = history.length - 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        } else if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        }
        
        return null;
    }, [history, historyIndex]);

    // Navigate to next message (Arrow Down)
    const navigateNext = useCallback((): string | null => {
        if (historyIndex === -1) return null;
        
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            return history[newIndex];
        } else {
            // Return to temp input
            setHistoryIndex(-1);
            return tempInputRef.current;
        }
    }, [history, historyIndex]);

    // Reset navigation state (call when chat closes)
    const resetNavigation = useCallback(() => {
        setHistoryIndex(-1);
        tempInputRef.current = '';
    }, []);

    return {
        history,
        historyIndex,
        addToHistory,
        navigatePrevious,
        navigateNext,
        resetNavigation,
    };
};
