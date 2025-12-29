import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, Heart, Shield, Utensils, Droplets, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeonStatusWidgetProps {
  type: 'health' | 'armor' | 'hunger' | 'thirst' | 'stamina';
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  health: { icon: Heart, color: 'health', label: 'HP' },
  armor: { icon: Shield, color: 'armor', label: 'ARM' },
  hunger: { icon: Utensils, color: 'hunger', label: 'HNG' },
  thirst: { icon: Droplets, color: 'thirst', label: 'THR' },
  stamina: { icon: Zap, color: 'stamina', label: 'STA' },
};

const SIZE_CONFIG = {
  sm: { container: 'w-12 h-12', icon: 14, stroke: 3, radius: 20, fontSize: 'text-[8px]' },
  md: { container: 'w-14 h-14', icon: 16, stroke: 3.5, radius: 23, fontSize: 'text-[9px]' },
  lg: { container: 'w-16 h-16', icon: 18, stroke: 4, radius: 26, fontSize: 'text-[10px]' },
};

export const NeonStatusWidget = ({ type, value, size = 'md' }: NeonStatusWidgetProps) => {
  const config = STATUS_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  
  const circumference = 2 * Math.PI * sizeConfig.radius;
  const progress = (value / 100) * circumference;
  
  const isWarning = value <= 30;
  const isCritical = value <= 15;
  
  const getColor = () => {
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return config.color;
  };
  
  const colorVar = getColor();

  return (
    <div className={cn("relative", sizeConfig.container)}>
      {/* Glass Background */}
      <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
        {/* Neon Glow Effect */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: isCritical 
              ? [
                  `inset 0 0 15px hsl(var(--${colorVar}) / 0.3)`,
                  `inset 0 0 25px hsl(var(--${colorVar}) / 0.5)`,
                  `inset 0 0 15px hsl(var(--${colorVar}) / 0.3)`,
                ]
              : `inset 0 0 15px hsl(var(--${colorVar}) / 0.2)`,
          }}
          transition={isCritical ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </div>
      
      {/* SVG Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
        <defs>
          <filter id={`neonGlow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background Ring */}
        <circle
          cx="30"
          cy="30"
          r={sizeConfig.radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.15)"
          strokeWidth={sizeConfig.stroke}
        />
        
        {/* Progress Ring */}
        <motion.circle
          cx="30"
          cy="30"
          r={sizeConfig.radius}
          fill="none"
          stroke={`hsl(var(--${colorVar}))`}
          strokeWidth={sizeConfig.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.3 }}
          filter={`url(#neonGlow-${type})`}
          style={{
            filter: `drop-shadow(0 0 6px hsl(var(--${colorVar}) / 0.6))`,
          }}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon 
          size={sizeConfig.icon} 
          className={cn(
            "transition-colors",
            `text-${colorVar}`,
            isCritical && "critical-pulse"
          )}
          style={{ 
            color: `hsl(var(--${colorVar}))`,
            filter: `drop-shadow(0 0 4px hsl(var(--${colorVar}) / 0.5))`,
          }}
        />
        <span 
          className={cn("hud-number mt-0.5", sizeConfig.fontSize)}
          style={{ 
            color: `hsl(var(--${colorVar}))`,
            textShadow: `0 0 8px hsl(var(--${colorVar}) / 0.5)`,
          }}
        >
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
};
