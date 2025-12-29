import { motion } from 'framer-motion';
import { Navigation2 } from 'lucide-react';

interface NeonMinimapWidgetProps {
  direction: string;
}

export const NeonMinimapWidget = ({ direction }: NeonMinimapWidgetProps) => {
  return (
    <div className="relative w-40 h-32">
      {/* Glass Frame */}
      <div 
        className="absolute inset-0 rounded-lg glass-panel overflow-hidden"
        style={{
          boxShadow: '0 0 20px hsl(var(--primary) / 0.1), inset 0 0 15px hsl(var(--background) / 0.5)',
        }}
      >
        {/* Map Placeholder Grid */}
        <div 
          className="absolute inset-2 rounded opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        
        {/* Fake Roads */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 160 128">
          <path
            d="M 0 64 L 160 64"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 80 0 L 80 128"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 40 0 L 40 50 Q 40 64, 54 64 L 106 64 Q 120 64, 120 78 L 120 128"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        
        {/* Player Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: direction === 'N' ? 0 : direction === 'NE' ? 45 : direction === 'E' ? 90 : direction === 'SE' ? 135 : direction === 'S' ? 180 : direction === 'SW' ? 225 : direction === 'W' ? 270 : 315 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Navigation2 
              size={24} 
              className="text-primary fill-primary"
              style={{ 
                filter: 'drop-shadow(0 0 8px hsl(var(--primary)))',
              }}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Compass Direction */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
        <div 
          className="glass-panel rounded px-2 py-0.5 flex items-center gap-1"
          style={{
            boxShadow: '0 0 10px hsl(var(--background) / 0.5)',
          }}
        >
          <span 
            className="hud-number text-xs text-primary"
            style={{ textShadow: '0 0 6px hsl(var(--primary) / 0.5)' }}
          >
            {direction}
          </span>
        </div>
      </div>
    </div>
  );
};
