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
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;
  const lowAltitude = altitude < 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
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
              
              {/* Roll indicator arc */}
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
              
              {/* Aircraft symbol */}
              <g transform="translate(50, 50)" filter="url(#planeNeonGlow)">
                <line x1="-18" y1="0" x2="-6" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <line x1="6" y1="0" x2="18" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.5" fill="none" stroke="hsl(var(--warning))" strokeWidth="2.5" />
              </g>
              
              {/* Outer ring */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
            </svg>
            
            {/* Speed overlay left */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 glass-panel rounded px-1.5 py-0.5">
              <span className="text-[6px] text-muted-foreground block">KTS</span>
              <span 
                className="hud-number text-[10px] text-stamina"
                style={{ textShadow: '0 0 6px hsl(var(--stamina) / 0.6)' }}
              >
                {Math.round(airspeed)}
              </span>
            </div>
            
            {/* Altitude overlay right */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 glass-panel rounded px-1.5 py-0.5">
              <span className="text-[6px] text-muted-foreground block">ALT</span>
              <span 
                className={cn(
                  "hud-number text-[10px]",
                  lowAltitude ? "text-warning" : "text-armor"
                )}
                style={{ textShadow: `0 0 6px hsl(var(--${lowAltitude ? 'warning' : 'armor'}) / 0.6)` }}
              >
                {Math.round(altitude)}
              </span>
            </div>
            
            {/* Heading bottom */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="glass-panel rounded px-2 py-0.5 flex items-center gap-1">
                <Plane size={10} className="text-primary" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--primary)))' }} />
                <span className="hud-number text-[10px] text-primary" style={{ textShadow: '0 0 6px hsl(var(--primary) / 0.6)' }}>
                  {Math.round(heading)}°
                </span>
              </div>
            </div>
          </div>

          {/* Status Row - Gear, Flaps, Fuel */}
          <motion.div
            className="flex items-center gap-3 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Landing Gear */}
            <div 
              className={cn(
                "glass-panel rounded px-2 py-1 flex items-center gap-1.5",
                !landingGear && "border border-critical/50"
              )}
            >
              <div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  landingGear ? "bg-stamina" : "bg-critical critical-pulse"
                )}
                style={{
                  boxShadow: landingGear 
                    ? '0 0 6px hsl(var(--stamina))' 
                    : '0 0 6px hsl(var(--critical))',
                }}
              />
              <span className="text-[8px] text-muted-foreground">GEAR</span>
            </div>
            
            {/* Flaps */}
            <div className="glass-panel rounded px-2 py-1 flex items-center gap-1.5">
              <span className="text-[8px] text-muted-foreground">FLAPS</span>
              <span 
                className="hud-number text-[10px] text-primary"
                style={{ textShadow: '0 0 6px hsl(var(--primary) / 0.5)' }}
              >
                {flaps}%
              </span>
            </div>
            
            {/* Fuel */}
            <div className="glass-panel rounded px-2 py-1 flex items-center gap-1.5">
              <Fuel 
                size={10} 
                className={cn(
                  fuelCritical ? "text-critical critical-pulse" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
                style={{
                  filter: `drop-shadow(0 0 3px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'})))`,
                }}
              />
              <span 
                className={cn(
                  "hud-number text-[10px]",
                  fuelCritical ? "text-critical" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
                style={{
                  textShadow: `0 0 6px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.5)`,
                }}
              >
                {Math.round(vehicle.fuel)}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};