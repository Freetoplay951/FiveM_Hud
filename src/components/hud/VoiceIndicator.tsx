import { Mic, MicOff } from 'lucide-react';
import { VoiceState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
  voice: VoiceState;
}

const getRangeConfig = (range: VoiceState['range']) => {
  switch (range) {
    case 'whisper':
      return {
        bars: 1,
        color: 'bg-voice-whisper',
        glowColor: 'hsl(var(--voice-whisper))',
        label: 'Flüstern',
      };
    case 'normal':
      return {
        bars: 2,
        color: 'bg-voice-normal',
        glowColor: 'hsl(var(--voice-normal))',
        label: 'Normal',
      };
    case 'shout':
      return {
        bars: 3,
        color: 'bg-voice-shout',
        glowColor: 'hsl(var(--voice-shout))',
        label: 'Schreien',
      };
  }
};

export const VoiceIndicator = ({ voice }: VoiceIndicatorProps) => {
  if (!voice.active) return null;

  const config = getRangeConfig(voice.range);

  return (
    <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-3 animate-fade-in-up">
      {/* Mic Icon */}
      <div className="relative">
        <Mic 
          className="text-foreground transition-colors"
          size={18}
          style={{
            filter: `drop-shadow(0 0 6px ${config.glowColor})`,
          }}
        />
        {voice.active && (
          <span 
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{
              boxShadow: `0 0 8px ${config.glowColor}`,
            }}
          />
        )}
      </div>

      {/* Voice Bars */}
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-1 rounded-full transition-all duration-200",
              bar <= config.bars ? config.color : "bg-muted/30",
              bar <= config.bars && voice.active && "voice-active"
            )}
            style={{
              height: `${bar * 5 + 2}px`,
              boxShadow: bar <= config.bars ? `0 0 6px ${config.glowColor}` : 'none',
              animationDelay: `${bar * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Range Label */}
      <span 
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: config.glowColor }}
      >
        {config.label}
      </span>
    </div>
  );
};
