import { motion } from 'framer-motion';
import { LucideIcon, Heart, Shield, Utensils, Droplets, Zap, Brain, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusType } from '@/types/hud';

interface StatusVerticalProps {
  type: StatusType;
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<StatusType, { icon: LucideIcon; color: string; label: string }> = {
  health: { icon: Heart, color: 'health', label: 'HP' },
  armor: { icon: Shield, color: 'armor', label: 'ARM' },
  hunger: { icon: Utensils, color: 'hunger', label: 'HNG' },
  thirst: { icon: Droplets, color: 'thirst', label: 'THR' },
  stamina: { icon: Zap, color: 'stamina', label: 'STA' },
  stress: { icon: Brain, color: 'stress', label: 'STR' },
  oxygen: { icon: Wind, color: 'oxygen', label: 'O2' },
};

const SIZE_CONFIG = {
  sm: { width: 'w-6', height: 'h-16', icon: 10, fontSize: 'text-[7px]' },
  md: { width: 'w-7', height: 'h-20', icon: 12, fontSize: 'text-[8px]' },
  lg: { width: 'w-8', height: 'h-24', icon: 14, fontSize: 'text-[9px]' },
};

export const StatusVertical = ({ type, value, size = 'md' }: StatusVerticalProps) => {
  const config = STATUS_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  
  const isWarning = value <= 30;
  const isCritical = value <= 15;
  
  const getColor = () => {
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return config.color;
  };
  
  const colorVar = getColor();

  return (
    <div className={cn("glass-panel rounded-lg flex flex-col items-center py-1.5 gap-1", sizeConfig.width, sizeConfig.height)}>
      <Icon 
        size={sizeConfig.icon} 
        className={cn(isCritical && "critical-pulse")}
        style={{ 
          color: `hsl(var(--${colorVar}))`,
          filter: `drop-shadow(0 0 3px hsl(var(--${colorVar}) / 0.5))`,
        }}
      />
      
      <div className="flex-1 w-2 rounded-full bg-muted/30 overflow-hidden relative">
        <motion.div
          className="absolute inset-x-0 bottom-0 rounded-full"
          initial={{ height: 0 }}
          animate={{ height: `${value}%` }}
          transition={{ duration: 0.3 }}
          style={{ 
            backgroundColor: `hsl(var(--${colorVar}))`,
            boxShadow: `0 0 8px hsl(var(--${colorVar}) / 0.6), inset 0 0 4px hsl(var(--${colorVar}) / 0.3)`,
          }}
        />
      </div>
      
      <span 
        className={cn("hud-number", sizeConfig.fontSize)}
        style={{ 
          color: `hsl(var(--${colorVar}))`,
          textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
        }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
};
