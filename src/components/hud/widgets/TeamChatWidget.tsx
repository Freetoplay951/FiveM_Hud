import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, X, Shield, Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamChatMessage, TeamChatState } from '@/types/hud';

interface TeamChatWidgetProps {
  teamChat: TeamChatState;
  onSendMessage?: (message: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

// Staff rank colors
const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof Shield }> = {
  supporter: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: Shield },
  moderator: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: Shield },
  admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: Shield },
  superadmin: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: Crown },
  owner: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: Crown },
  default: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30', icon: Shield },
};

export const TeamChatWidget = ({ teamChat, onSendMessage, onClose, isOpen = true }: TeamChatWidgetProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const teamColor = TEAM_COLORS[teamChat.teamType] || TEAM_COLORS.default;
  
  // Bestimme ob Chat sichtbar sein soll
  const isVisible = teamChat.isVisible ?? true;
  const isInputActive = teamChat.isInputActive ?? isOpen;
  const hasMessages = teamChat.messages.length > 0;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamChat.messages]);

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

  // Access check - show locked state if user doesn't have permission
  if (!teamChat.hasAccess) {
    return (
      <motion.div
        className="glass-panel rounded-lg overflow-hidden flex flex-col items-center justify-center"
        style={{
          width: '320px',
          height: '280px',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Lock size={32} className="text-muted-foreground/50 mb-2" />
        <span className="text-xs text-muted-foreground">Kein Zugriff</span>
        <span className="text-[10px] text-muted-foreground/70 mt-1 text-center px-4">
          Nur für Team-Mitglieder (Supporter, Admin, etc.)
        </span>
      </motion.div>
    );
  }

  // Wenn nicht sichtbar und keine Eingabe aktiv, ausblenden
  if (!isVisible && !isInputActive && !hasMessages) {
    return null;
  }

  const TeamIcon = teamColor.icon;

  return (
    <AnimatePresence>
      {(isVisible || isInputActive || hasMessages) && (
        <motion.div
          className={cn(
            "rounded-lg overflow-hidden flex flex-col border",
            teamColor.border,
            "bg-background/80 backdrop-blur-md"
          )}
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
          <div className={cn(
            "flex items-center justify-between px-3 py-2 border-b",
            teamColor.border,
            teamColor.bg
          )}>
          <div className="flex items-center gap-2">
              <TeamIcon size={14} className={teamColor.text} />
              <span className={cn("text-xs font-medium uppercase tracking-wider", teamColor.text)}>
                {teamChat.teamName}
              </span>
              {teamChat.isAdmin && (
                <Shield size={10} className="text-warning" />
              )}
              {teamChat.unreadCount > 0 && (
                <span className={cn("px-1.5 py-0.5 text-[10px] rounded-full", teamColor.bg, teamColor.text)}>
                  {teamChat.unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {teamChat.onlineMembers} online
              </span>
              {onClose && isInputActive && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-background/50 transition-colors ml-1"
                >
                  <X size={12} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {teamChat.messages.map((msg) => (
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
                  
                  {/* Rank Badge */}
                  {msg.rank && (
                    <span className={cn(
                      "text-[9px] px-1 py-0.5 rounded mr-1",
                      teamColor.bg,
                      teamColor.text
                    )}>
                      {msg.rank}
                    </span>
                  )}
                  
                  {/* Sender */}
                  <span className={cn("font-medium mr-1", teamColor.text)}>
                    {msg.sender}:
                  </span>
                  
                  {/* Message */}
                  <span className={cn(
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

          {/* Input - nur anzeigen wenn Eingabe aktiv */}
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
                    teamColor.border,
                    `focus:${teamColor.border}`
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
