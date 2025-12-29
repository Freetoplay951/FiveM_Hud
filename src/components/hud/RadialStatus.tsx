import { useMemo } from 'react';
import { Heart, Shield, Apple, Droplets, Zap } from 'lucide-react';
import { StatusType } from '@/types/hud';
import { cn } from '@/lib/utils';

interface RadialStatusProps {
  type: StatusType;
  value: number;
  size?: number;
}

const statusConfig: Record<StatusType, {
  icon: typeof Heart;
  colorClass: string;
  glowClass: string;
}> = {
  health: {
    icon: Heart,
    colorClass: 'text-health',
    glowClass: 'shadow-glow-health',
  },
  armor: {
    icon: Shield,
    colorClass: 'text-armor',
    glowClass: 'shadow-glow-armor',
  },
  hunger: {
    icon: Apple,
    colorClass: 'text-hunger',
    glowClass: 'shadow-glow-hunger',
  },
  thirst: {
    icon: Droplets,
    colorClass: 'text-thirst',
    glowClass: 'shadow-glow-thirst',
  },
  stamina: {
    icon: Zap,
    colorClass: 'text-stamina',
    glowClass: 'shadow-glow-stamina',
  },
};

const getStatusColor = (type: StatusType): string => {
  const colors: Record<StatusType, string> = {
    health: 'hsl(var(--health))',
    armor: 'hsl(var(--armor))',
    hunger: 'hsl(var(--hunger))',
    thirst: 'hsl(var(--thirst))',
    stamina: 'hsl(var(--stamina))',
  };
  return colors[type];
};

const getWarningColor = (): string => 'hsl(var(--warning))';
const getCriticalColor = (): string => 'hsl(var(--critical))';

export const RadialStatus = ({ type, value, size = 48 }: RadialStatusProps) => {
  const config = statusConfig[type];
  const Icon = config.icon;
  
  const isWarning = value <= 30 && value > 15;
  const isCritical = value <= 15;
  
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const strokeColor = useMemo(() => {
    if (isCritical) return getCriticalColor();
    if (isWarning) return getWarningColor();
    return getStatusColor(type);
  }, [type, isWarning, isCritical]);

  const pulseClass = isCritical ? 'critical-pulse' : isWarning ? 'warning-pulse' : '';

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center",
        pulseClass
      )}
      style={{ width: size, height: size }}
    >
      {/* Background ring */}
      <svg
        className="absolute transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColor})`,
          }}
        />
      </svg>
      
      {/* Icon */}
      <Icon 
        className={cn(
          "relative z-10 transition-colors duration-300",
          isCritical ? 'text-critical' : isWarning ? 'text-warning' : config.colorClass
        )}
        size={size * 0.4}
        strokeWidth={2}
      />
    </div>
  );
};
