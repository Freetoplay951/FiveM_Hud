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
  const fuelPercentage = vehicle.fuel;
  
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
          <div className="relative w-36 h-36">
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
              {/* Subtle glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background: `conic-gradient(from 135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${speedPercentage * 0.75}%, transparent ${speedPercentage * 0.75}%)`,
                  filter: 'blur(10px)',
                }}
              />
            </div>
            
            {/* SVG Arcs */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="60%" stopColor="hsl(var(--stamina))" />
                  <stop offset="100%" stopColor="hsl(var(--critical))" />
                </linearGradient>
                <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={fuelCritical ? "hsl(var(--critical))" : fuelWarning ? "hsl(var(--warning))" : "hsl(var(--stamina))"} />
                  <stop offset="100%" stopColor={fuelCritical ? "hsl(var(--critical))" : fuelWarning ? "hsl(var(--warning))" : "hsl(var(--primary))"} />
                </linearGradient>
              </defs>
              
              {/* Outer Speed Arc - Background */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="hsl(var(--muted) / 0.2)"
                strokeWidth="5"
                strokeDasharray="207 69"
                strokeLinecap="round"
              />
              
              {/* Outer Speed Arc - Progress */}
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="5"
                strokeDasharray={`${speedPercentage * 2.07} 276`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 276" }}
                animate={{ strokeDasharray: `${speedPercentage * 2.07} 276` }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))',
                }}
              />
              
              {/* Inner Fuel Arc - Background */}
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="hsl(var(--muted) / 0.15)"
                strokeWidth="3"
                strokeDasharray="170 56"
                strokeLinecap="round"
              />
              
              {/* Inner Fuel Arc - Progress */}
              <motion.circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="url(#fuelGradient)"
                strokeWidth="3"
                strokeDasharray={`${fuelPercentage * 1.7} 226`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 226" }}
                animate={{ strokeDasharray: `${fuelPercentage * 1.7} 226` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(fuelCritical && "critical-pulse")}
                style={{
                  filter: fuelCritical 
                    ? 'drop-shadow(0 0 6px hsl(var(--critical)))' 
                    : fuelWarning 
                      ? 'drop-shadow(0 0 4px hsl(var(--warning)))' 
                      : 'drop-shadow(0 0 3px hsl(var(--stamina) / 0.4))',
                }}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Speed */}
              <motion.span 
                className="hud-number text-3xl text-foreground leading-none"
                key={Math.round(vehicle.speed)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {Math.round(vehicle.speed)}
              </motion.span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                km/h
              </span>
              
              {/* Divider */}
              <div className="w-8 h-px bg-muted/30 my-1.5" />
              
              {/* Gear */}
              <div className="flex items-center gap-1.5">
                <span className="hud-number text-xl text-primary leading-none">
                  {vehicle.gear === 0 ? 'R' : vehicle.gear}
                </span>
              </div>
              
              {/* Fuel percentage - small */}
              <div className="flex items-center gap-1 mt-1">
                <Fuel 
                  size={10} 
                  className={cn(
                    "transition-colors",
                    fuelCritical ? "text-critical" : 
                    fuelWarning ? "text-warning" : 
                    "text-muted-foreground"
                  )} 
                />
                <span className={cn(
                  "text-[10px] hud-number",
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
