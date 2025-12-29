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
  
  const maxSpeed = 80; // Knots for boats
  const speedPercentage = Math.min(100, (speed / maxSpeed) * 100);
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;

  // Compass directions
  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  // Speed ticks for boat - every 10 knots
  const speedTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80];

  // Calculate position for each tick on a 270-degree arc starting from bottom-left
  const getTickPosition = (tickSpeed: number, radius: number) => {
    const percentage = tickSpeed / maxSpeed;
    const angle = -225 + (percentage * 270); // Start at -225deg (bottom-left), sweep 270deg
    const radians = (angle * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
      angle: angle + 90,
    };
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
          {/* Fuel Bar - Vertical on Left (like Car HUD) */}
          <motion.div 
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative w-3 h-24 rounded-full glass-panel overflow-hidden">
              <motion.div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 rounded-full",
                  fuelCritical ? "bg-critical" : fuelWarning ? "bg-warning" : "bg-stamina"
                )}
                initial={{ height: 0 }}
                animate={{ height: `${vehicle.fuel}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  boxShadow: fuelCritical 
                    ? '0 0 12px hsl(var(--critical)), inset 0 0 8px hsl(var(--critical) / 0.5)' 
                    : fuelWarning 
                      ? '0 0 10px hsl(var(--warning))' 
                      : '0 0 8px hsl(var(--stamina) / 0.6)',
                }}
              />
            </div>
            <div className="flex items-center gap-0.5">
              <Fuel 
                size={10} 
                className={cn(
                  fuelCritical ? "text-critical" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
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
          </motion.div>

          {/* Main Speedometer - Neon Style */}
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
              
              {/* Speed ticks and labels */}
              {speedTicks.map((s) => {
                const outerPos = getTickPosition(s, 44);
                const innerPos = getTickPosition(s, 38);
                const labelPos = getTickPosition(s, 32);
                const isMajor = s % 20 === 0;
                const isActive = speed >= s;
                
                return (
                  <g key={s}>
                    {/* Tick line */}
                    <line
                      x1={innerPos.x}
                      y1={innerPos.y}
                      x2={outerPos.x}
                      y2={outerPos.y}
                      stroke={isActive ? "hsl(var(--thirst))" : "hsl(var(--muted) / 0.3)"}
                      strokeWidth={isMajor ? 1.5 : 0.8}
                      strokeLinecap="round"
                      style={isActive ? { filter: 'drop-shadow(0 0 2px hsl(var(--thirst)))' } : {}}
                    />
                    {/* Speed label for major ticks */}
                    {isMajor && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground"
                        style={{ 
                          fontSize: '4px', 
                          fontFamily: 'Orbitron, sans-serif',
                          opacity: isActive ? 1 : 0.4,
                        }}
                      >
                        {s}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Arc Background */}
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
              
              {/* Arc Progress with Neon Effect */}
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
              
              {/* Heading & Anchor Status */}
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
                <Anchor 
                  size={12} 
                  className={anchor ? "text-warning" : "text-muted-foreground"}
                  style={anchor ? { filter: 'drop-shadow(0 0 4px hsl(var(--warning)))' } : {}}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};