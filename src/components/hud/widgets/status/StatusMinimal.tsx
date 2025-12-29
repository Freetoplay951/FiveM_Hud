import { motion } from 'framer-motion';
import { LucideIcon, Heart, Shield, Utensils, Droplets, Zap, Brain, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusType } from '@/types/hud';

interface StatusMinimalProps {
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
  sm: { padding: 'px-2 py-1', icon: 10, fontSize: 'text-[9px]', gap: 'gap-1' },
  md: { padding: 'px-2.5 py-1.5', icon: 12, fontSize: 'text-[10px]', gap: 'gap-1.5' },
  lg: { padding: 'px-3 py-2', icon: 14, fontSize: 'text-[11px]', gap: 'gap-2' },
};

export const StatusMinimal = ({ type, value, size = 'md' }: StatusMinimalProps) => {
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
    <motion.div 
      className={cn(
        "glass-panel rounded-full flex items-center",
        sizeConfig.padding,
        sizeConfig.gap,
        isCritical && "critical-pulse"
      )}
      animate={{
        boxShadow: value <= 30 
          ? `0 0 ${isCritical ? 12 : 8}px hsl(var(--${colorVar}) / 0.4)`
          : `0 0 4px hsl(var(--${colorVar}) / 0.2)`,
      }}
    >
      <Icon 
        size={sizeConfig.icon} 
        style={{ 
          color: `hsl(var(--${colorVar}))`,
          filter: `drop-shadow(0 0 3px hsl(var(--${colorVar}) / 0.5))`,
        }}
      />
      
      <span 
        className={cn("hud-number", sizeConfig.fontSize)}
        style={{ 
          color: `hsl(var(--${colorVar}))`,
          textShadow: `0 0 6px hsl(var(--${colorVar}) / 0.5)`,
        }}
      >
        {Math.round(value)}
      </span>
    </motion.div>
  );
};
