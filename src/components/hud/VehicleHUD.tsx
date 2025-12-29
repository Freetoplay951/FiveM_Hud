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
          className="flex items-end gap-3"
        >
          {/* Speedometer */}
          <div className="relative">
            {/* Background glass panel */}
            <div className="relative w-32 h-32 rounded-full glass-panel overflow-hidden">
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                  background: `conic-gradient(from 135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${speedPercentage * 0.75}%, transparent ${speedPercentage * 0.75}%)`,
                  filter: 'blur(8px)',
                }}
              />
              
              {/* Speed arc background */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(var(--stamina))" />
                    <stop offset="100%" stopColor="hsl(var(--critical))" />
                  </linearGradient>
                </defs>
                
                {/* Background arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(var(--muted) / 0.3)"
                  strokeWidth="6"
                  strokeDasharray="198 264"
                  strokeDashoffset="-33"
                  strokeLinecap="round"
                />
                
                {/* Progress arc */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#speedGradient)"
                  strokeWidth="6"
                  strokeDasharray={`${speedPercentage * 1.98} 264`}
                  strokeDashoffset="-33"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${speedPercentage * 1.98} 264` }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.6))',
                  }}
                />
              </svg>
              
              {/* Speed display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className="hud-number text-3xl text-foreground leading-none"
                  key={Math.round(vehicle.speed)}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  {Math.round(vehicle.speed)}
                </motion.span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  km/h
                </span>
              </div>
            </div>
            
            {/* Gear indicator */}
            <motion.div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center border border-primary/30">
                <span className="hud-number text-lg text-primary">
                  {vehicle.gear === 0 ? 'R' : vehicle.gear}
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* Fuel gauge */}
          <motion.div 
            className="flex items-center gap-2 glass-panel rounded-lg px-3 py-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Fuel 
              size={16} 
              className={cn(
                "transition-colors",
                fuelCritical ? "text-critical critical-pulse" : 
                fuelWarning ? "text-warning warning-pulse" : 
                "text-muted-foreground"
              )} 
            />
            <span className={cn(
              "hud-number text-sm",
              fuelCritical ? "text-critical" : 
              fuelWarning ? "text-warning" : 
              "text-foreground"
            )}>
              {Math.round(vehicle.fuel)}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
