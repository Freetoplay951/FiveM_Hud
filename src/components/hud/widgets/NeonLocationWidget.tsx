import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { LocationState } from '@/types/hud';

interface NeonLocationWidgetProps {
  location: LocationState;
}

export const NeonLocationWidget = ({ location }: NeonLocationWidgetProps) => {
  return (
    <motion.div 
      className="glass-panel rounded-lg px-3 py-2 flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Direction Badge */}
      <div 
        className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center"
        style={{
          boxShadow: 'inset 0 0 10px hsl(var(--primary) / 0.2)',
        }}
      >
        <span 
          className="hud-number text-sm text-primary"
          style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.6)' }}
        >
          {location.direction}
        </span>
      </div>
      
      {/* Location Info */}
      <div className="flex flex-col">
        <span 
          className="text-sm text-foreground font-medium"
          style={{ textShadow: '0 0 8px hsl(var(--foreground) / 0.2)' }}
        >
          {location.street}
        </span>
        {location.area && (
          <span className="text-[10px] text-muted-foreground">
            {location.area}
          </span>
        )}
      </div>
      
      {/* Pin Icon */}
      <MapPin 
        size={14} 
        className="text-critical ml-auto"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--critical) / 0.5))' }}
      />
    </motion.div>
  );
};
