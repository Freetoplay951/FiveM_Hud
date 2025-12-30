import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatState } from '@/types/hud';

interface ChatWidgetProps {
  chat: ChatState;
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const ChatWidget = ({ chat, onSendMessage, onClose, isOpen = true }: ChatWidgetProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bestimme ob Chat sichtbar sein soll
  const isVisible = chat.isVisible ?? true;
  const isInputActive = chat.isInputActive ?? isOpen;
  const hasMessages = chat.messages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // Focus input when chat opens with input active
  useEffect(() => {
    if (isInputActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputActive]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  const getMessageColor = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system':
        return 'text-warning';
      case 'action':
        return 'text-primary';
      case 'ooc':
        return 'text-muted-foreground';
      case 'whisper':
        return 'text-muted-foreground/70 italic';
      case 'shout':
        return 'text-critical font-semibold';
      case 'radio':
        return 'text-info';
      default:
        return 'text-foreground';
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
          className="bg-background/90 border border-border/30 rounded-lg overflow-hidden flex flex-col"
          style={{
            width: '320px',
            height: '280px',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible || isInputActive ? 1 : 0.3, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/40">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-primary" />
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
                className="p-1 rounded hover:bg-background/50 transition-colors"
              >
                <X size={12} className="text-muted-foreground" />
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
                  className="text-xs leading-relaxed"
                >
                  {/* Timestamp */}
                  <span className="text-[10px] text-muted-foreground/50 mr-1.5">
                    {msg.timestamp}
                  </span>
                  
                  {/* Sender */}
                  {msg.sender && (
                    <span 
                      className={cn(
                        "font-medium mr-1",
                        msg.type === 'system' ? 'text-warning' : 'text-primary'
                      )}
                    >
                      {msg.sender}:
                    </span>
                  )}
                  
                  {/* Message */}
                  <span className={getMessageColor(msg.type)}>
                    {msg.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input - nur anzeigen wenn Eingabe aktiv */}
          {isInputActive && (
            <div className="px-3 py-2 border-t border-border/30 bg-background/40">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben..."
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
                  )}
                >
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
