import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Anchor, Navigation, Waves } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface BoatHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const BoatHUD = ({ vehicle, visible }: BoatHUDProps) => {
  const speed = vehicle.speed;
  const heading = vehicle.heading || 0;
  const anchor = vehicle.anchor || false;
  const pitch = vehicle.pitch || 0;
  
  const maxSpeed = 80; // Knots for boats
  const speedPercentage = Math.min(100, (speed / maxSpeed) * 100);
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;

  // Compass directions
  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-end gap-3"
        >
          {/* Status Panel */}
          <div className="flex flex-col gap-2">
            {/* Anchor Status */}
            <motion.div 
              className={cn(
                "glass-panel rounded-lg px-3 py-2 flex items-center gap-2",
                anchor && "border border-warning/50"
              )}
              animate={{
                boxShadow: anchor ? '0 0 12px hsl(var(--warning) / 0.4)' : 'none',
              }}
            >
              <Anchor 
                size={16} 
                className={anchor ? "text-warning" : "text-muted-foreground"}
                style={anchor ? { filter: 'drop-shadow(0 0 4px hsl(var(--warning)))' } : {}}
              />
              <span className={cn(
                "text-xs font-medium",
                anchor ? "text-warning" : "text-muted-foreground"
              )}>
                {anchor ? 'ANCHORED' : 'SAILING'}
              </span>
            </motion.div>
            
            {/* Fuel */}
            <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2">
              <Fuel 
                size={14} 
                className={cn(
                  fuelCritical ? "text-critical critical-pulse" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
              />
              <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full rounded-full",
                    fuelCritical ? "bg-critical" : 
                    fuelWarning ? "bg-warning" : 
                    "bg-stamina"
                  )}
                  animate={{ width: `${vehicle.fuel}%` }}
                  style={{
                    boxShadow: `0 0 8px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.6)`,
                  }}
                />
              </div>
              <span className={cn(
                "hud-number text-xs min-w-[28px]",
                fuelCritical ? "text-critical" : 
                fuelWarning ? "text-warning" : 
                "text-stamina"
              )}>
                {Math.round(vehicle.fuel)}%
              </span>
            </div>
          </div>

          {/* Main Speedometer */}
          <div className="relative w-44 h-44">
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from -225deg, 
                    hsl(var(--thirst) / 0.3) 0%, 
                    hsl(var(--primary) / 0.2) ${speedPercentage * 0.75}%, 
                    transparent ${speedPercentage * 0.75}%)`,
                  filter: 'blur(15px)',
                }}
              />
            </div>
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="boatSpeedGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--thirst))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--stamina))" />
                </linearGradient>
                <filter id="boatNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Speed ticks */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((s) => {
                const percentage = s / maxSpeed;
                const angle = -225 + (percentage * 270);
                const radians = (angle * Math.PI) / 180;
                const outerR = 44;
                const innerR = 38;
                const labelR = 32;
                const isMajor = s % 20 === 0;
                const isActive = speed >= s;
                
                return (
                  <g key={s}>
                    <line
                      x1={50 + innerR * Math.cos(radians)}
                      y1={50 + innerR * Math.sin(radians)}
                      x2={50 + outerR * Math.cos(radians)}
                      y2={50 + outerR * Math.sin(radians)}
                      stroke={isActive ? "hsl(var(--thirst))" : "hsl(var(--muted) / 0.3)"}
                      strokeWidth={isMajor ? 1.5 : 0.8}
                      strokeLinecap="round"
                      style={isActive ? { filter: 'drop-shadow(0 0 2px hsl(var(--thirst)))' } : {}}
                    />
                    {isMajor && (
                      <text
                        x={50 + labelR * Math.cos(radians)}
                        y={50 + labelR * Math.sin(radians)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground"
                        style={{ fontSize: '4px', fontFamily: 'Orbitron' }}
                      >
                        {s}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Background arc */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="hsl(var(--muted) / 0.1)"
                strokeWidth="3"
                strokeDasharray="233 81"
                strokeDashoffset="-139.5"
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#boatSpeedGradient)"
                strokeWidth="3"
                strokeDasharray={`${speedPercentage * 2.33} 314`}
                strokeDashoffset="-139.5"
                strokeLinecap="round"
                filter="url(#boatNeonGlow)"
                initial={{ strokeDasharray: "0 314" }}
                animate={{ strokeDasharray: `${speedPercentage * 2.33} 314` }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              />
              
              {/* Wave decoration */}
              <Waves 
                x={42} 
                y={70} 
                width={16} 
                height={16} 
                className="text-thirst" 
                style={{ opacity: 0.3 }}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">
                KNOTS
              </span>
              
              <motion.span 
                className="hud-number text-4xl text-foreground leading-none"
                key={Math.round(speed)}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
                style={{ textShadow: '0 0 20px hsl(var(--thirst) / 0.5)' }}
              >
                {String(Math.round(speed)).padStart(2, '0')}
              </motion.span>
              
              {/* Heading */}
              <div className="flex items-center gap-2 mt-2">
                <Navigation 
                  size={12} 
                  className="text-primary"
                  style={{ 
                    transform: `rotate(${heading}deg)`,
                    filter: 'drop-shadow(0 0 4px hsl(var(--primary)))',
                  }}
                />
                <span className="hud-number text-sm text-primary">
                  {getCompassDirection(heading)} {Math.round(heading)}°
                </span>
              </div>
            </div>
          </div>

          {/* Pitch Indicator */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-muted-foreground uppercase">PITCH</span>
            <div className="glass-panel rounded-lg p-2 w-12 h-20 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Horizon line */}
                <motion.div 
                  className="w-8 h-0.5 bg-primary absolute"
                  animate={{ rotate: pitch }}
                  style={{
                    boxShadow: '0 0 6px hsl(var(--primary))',
                  }}
                />
                {/* Center marker */}
                <div className="w-1.5 h-1.5 rounded-full bg-warning" 
                  style={{ boxShadow: '0 0 4px hsl(var(--warning))' }}
                />
              </div>
              {/* Degree markers */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[6px] text-muted-foreground">+{Math.abs(Math.round(pitch > 0 ? pitch : 0))}°</div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[6px] text-muted-foreground">-{Math.abs(Math.round(pitch < 0 ? pitch : 0))}°</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
