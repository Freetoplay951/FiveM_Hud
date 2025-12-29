import { motion, AnimatePresence } from 'framer-motion';
import { Fuel } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface VehicleHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const VehicleHUD = ({ vehicle, visible }: VehicleHUDProps) => {
  const maxSpeed = 280;
  const speedPercentage = Math.min(100, (vehicle.speed / maxSpeed) * 100);
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {/* Speedometer Circle */}
          <div className="relative w-32 h-32">
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
              {/* Subtle glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-15"
                style={{
                  background: `conic-gradient(from 135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${speedPercentage * 0.75}%, transparent ${speedPercentage * 0.75}%)`,
                  filter: 'blur(12px)',
                }}
              />
            </div>
            
            {/* SVG Arc */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="60%" stopColor="hsl(var(--stamina))" />
                  <stop offset="100%" stopColor="hsl(var(--critical))" />
                </linearGradient>
              </defs>
              
              {/* Speed Arc - Background */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="hsl(var(--muted) / 0.15)"
                strokeWidth="4"
                strokeDasharray="207 69"
                strokeLinecap="round"
              />
              
              {/* Speed Arc - Progress */}
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="4"
                strokeDasharray={`${speedPercentage * 2.07} 276`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 276" }}
                animate={{ strokeDasharray: `${speedPercentage * 2.07} 276` }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))',
                }}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Speed */}
              <motion.span 
                className="hud-number text-2xl text-foreground leading-none"
                key={Math.round(vehicle.speed)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {Math.round(vehicle.speed)}
              </motion.span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">
                km/h
              </span>
              
              {/* Divider */}
              <div className="w-6 h-px bg-border/30 my-1" />
              
              {/* Gear */}
              <span className="hud-number text-lg text-primary leading-none">
                {vehicle.gear === 0 ? 'R' : vehicle.gear}
              </span>
              
              {/* Fuel */}
              <div className="flex items-center gap-1 mt-0.5">
                <Fuel 
                  size={9} 
                  className={cn(
                    "transition-colors",
                    fuelCritical ? "text-critical critical-pulse" : 
                    fuelWarning ? "text-warning warning-pulse" : 
                    "text-muted-foreground"
                  )} 
                />
                <span className={cn(
                  "text-[9px] hud-number",
                  fuelCritical ? "text-critical" : 
                  fuelWarning ? "text-warning" : 
                  "text-muted-foreground"
                )}>
                  {Math.round(vehicle.fuel)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
