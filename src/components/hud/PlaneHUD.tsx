import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Plane } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface PlaneHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const PlaneHUD = ({ vehicle, visible }: PlaneHUDProps) => {
  const pitch = vehicle.pitch || 0;
  const roll = vehicle.roll || 0;
  const altitude = vehicle.altitude || 0;
  const airspeed = vehicle.airspeed || vehicle.speed;
  const heading = vehicle.heading || 0;
  const landingGear = vehicle.landingGear ?? true;
  const flaps = vehicle.flaps || 0;
  
  const maxAltitude = 2000;
  const maxAirspeed = 400;
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;
  const lowAltitude = altitude < 100;

  // Calculate arc positions for neon gauges
  const getArcPath = (percentage: number, radius: number = 44) => {
    const startAngle = -225;
    const endAngle = startAngle + (percentage * 270);
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    
    const largeArc = percentage > 0.5 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          {/* Altitude Gauge (Left) - Neon Style */}
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from -225deg, 
                    hsl(var(--armor) / 0.2) 0%, 
                    hsl(var(--armor) / 0.1) ${(altitude / maxAltitude) * 75}%, 
                    transparent ${(altitude / maxAltitude) * 75}%)`,
                  filter: 'blur(10px)',
                }}
              />
            </div>
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="altGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--armor))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
                <filter id="altGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background arc */}
              <path
                d={getArcPath(1, 40)}
                fill="none"
                stroke="hsl(var(--muted) / 0.2)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <motion.path
                d={getArcPath(Math.min(1, altitude / maxAltitude), 40)}
                fill="none"
                stroke="url(#altGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#altGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[8px] text-muted-foreground uppercase">ALT</span>
              <span 
                className={cn(
                  "hud-number text-xl",
                  lowAltitude ? "text-warning" : "text-armor"
                )}
                style={{ textShadow: `0 0 12px hsl(var(--${lowAltitude ? 'warning' : 'armor'}) / 0.6)` }}
              >
                {Math.round(altitude)}
              </span>
              <span className="text-[7px] text-muted-foreground">METERS</span>
            </div>
          </div>

          {/* Main Instrument Panel - Artificial Horizon */}
          <div className="relative w-44 h-44">
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden" />
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <clipPath id="horizonClip">
                  <circle cx="50" cy="50" r="40" />
                </clipPath>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(210 80% 30%)" />
                  <stop offset="50%" stopColor="hsl(210 60% 50%)" />
                </linearGradient>
                <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="50%" stopColor="hsl(30 50% 30%)" />
                  <stop offset="100%" stopColor="hsl(30 40% 20%)" />
                </linearGradient>
                <filter id="planeNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <g clipPath="url(#horizonClip)">
                <g transform={`rotate(${-roll}, 50, 50) translate(0, ${pitch * 0.5})`}>
                  <rect x="-50" y="-50" width="200" height="100" fill="url(#skyGradient)" />
                  <rect x="-50" y="50" width="200" height="100" fill="url(#groundGradient)" />
                  <line x1="-50" y1="50" x2="150" y2="50" stroke="hsl(var(--primary))" strokeWidth="1.5" filter="url(#planeNeonGlow)" />
                  
                  {[-20, -10, 10, 20].map((p) => (
                    <g key={p} transform={`translate(0, ${-p * 2})`}>
                      <line x1="35" y1="50" x2="45" y2="50" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                      <line x1="55" y1="50" x2="65" y2="50" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                    </g>
                  ))}
                </g>
              </g>
              
              {/* Neon roll indicator arc */}
              <g transform="translate(50, 50)">
                {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((angle) => {
                  const x = 38 * Math.sin((angle * Math.PI) / 180);
                  const y = -38 * Math.cos((angle * Math.PI) / 180);
                  return (
                    <line
                      key={angle}
                      x1={x * 0.9}
                      y1={y * 0.9}
                      x2={x}
                      y2={y}
                      stroke="hsl(var(--primary))"
                      strokeWidth={angle === 0 ? 2 : 0.8}
                      filter={angle === 0 ? "url(#planeNeonGlow)" : undefined}
                    />
                  );
                })}
                <polygon
                  points="0,-36 -3,-42 3,-42"
                  fill="hsl(var(--warning))"
                  transform={`rotate(${roll})`}
                  filter="url(#planeNeonGlow)"
                />
              </g>
              
              {/* Aircraft symbol with neon glow */}
              <g transform="translate(50, 50)" filter="url(#planeNeonGlow)">
                <line x1="-18" y1="0" x2="-6" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <line x1="6" y1="0" x2="18" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.5" fill="none" stroke="hsl(var(--warning))" strokeWidth="2.5" />
              </g>
              
              {/* Outer neon ring */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
            </svg>
            
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              <div className="glass-panel rounded px-2 py-0.5 flex items-center gap-1">
                <Plane size={10} className="text-primary" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--primary)))' }} />
                <span className="hud-number text-[10px] text-primary" style={{ textShadow: '0 0 6px hsl(var(--primary) / 0.6)' }}>
                  {Math.round(heading)}°
                </span>
              </div>
            </div>
          </div>

          {/* Airspeed Gauge (Right) - Neon Style */}
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from -225deg, 
                    hsl(var(--stamina) / 0.2) 0%, 
                    hsl(var(--stamina) / 0.1) ${(airspeed / maxAirspeed) * 75}%, 
                    transparent ${(airspeed / maxAirspeed) * 75}%)`,
                  filter: 'blur(10px)',
                }}
              />
            </div>
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="speedPlaneGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--stamina))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
                <filter id="speedPlaneGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <path
                d={getArcPath(1, 40)}
                fill="none"
                stroke="hsl(var(--muted) / 0.2)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              <motion.path
                d={getArcPath(Math.min(1, airspeed / maxAirspeed), 40)}
                fill="none"
                stroke="url(#speedPlaneGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#speedPlaneGlow)"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[8px] text-muted-foreground uppercase">KTS</span>
              <span 
                className="hud-number text-xl text-stamina"
                style={{ textShadow: '0 0 12px hsl(var(--stamina) / 0.6)' }}
              >
                {Math.round(airspeed)}
              </span>
              <span className="text-[7px] text-muted-foreground">KNOTS</span>
            </div>
          </div>

          {/* Status Panel */}
          <div className="flex flex-col gap-2">
            {/* Landing Gear */}
            <div 
              className={cn(
                "glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2",
                !landingGear && "border border-critical/50"
              )}
            >
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  landingGear ? "bg-stamina" : "bg-critical critical-pulse"
                )}
                style={{
                  boxShadow: landingGear 
                    ? '0 0 8px hsl(var(--stamina))' 
                    : '0 0 8px hsl(var(--critical))',
                }}
              />
              <span className="text-[9px] text-muted-foreground">GEAR</span>
            </div>
            
            {/* Flaps */}
            <div className="glass-panel rounded-lg px-3 py-1.5">
              <span className="text-[8px] text-muted-foreground block">FLAPS</span>
              <span 
                className="hud-number text-sm text-primary"
                style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.5)' }}
              >
                {flaps}%
              </span>
            </div>
            
            {/* Fuel */}
            <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Fuel 
                size={12} 
                className={cn(
                  fuelCritical ? "text-critical critical-pulse" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
                style={{
                  filter: `drop-shadow(0 0 4px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'})))`,
                }}
              />
              <span 
                className={cn(
                  "hud-number text-sm",
                  fuelCritical ? "text-critical" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
                style={{
                  textShadow: `0 0 8px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.5)`,
                }}
              >
                {Math.round(vehicle.fuel)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
