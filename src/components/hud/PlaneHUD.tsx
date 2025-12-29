import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, Thermometer, Plane, AlertTriangle } from 'lucide-react';
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
          className="flex items-center gap-3"
        >
          {/* Altitude Bar (Left) */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-muted-foreground uppercase">ALT</span>
            <div className="relative w-4 h-32 glass-panel rounded-lg overflow-hidden">
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-armor"
                animate={{ height: `${Math.min(100, (altitude / 2000) * 100)}%` }}
                style={{
                  boxShadow: '0 0 10px hsl(var(--armor) / 0.6)',
                }}
              />
              {/* Altitude markers */}
              {[0, 500, 1000, 1500, 2000].map((alt, i) => (
                <div 
                  key={alt}
                  className="absolute left-0 right-0 h-px bg-muted/30"
                  style={{ bottom: `${(alt / 2000) * 100}%` }}
                />
              ))}
            </div>
            <span 
              className={cn(
                "hud-number text-xs",
                lowAltitude ? "text-warning" : "text-armor"
              )}
              style={{ textShadow: `0 0 8px hsl(var(--${lowAltitude ? 'warning' : 'armor'}) / 0.5)` }}
            >
              {Math.round(altitude)}m
            </span>
          </div>

          {/* Main Instrument Panel */}
          <div className="relative w-48 h-48">
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden" />
            
            {/* Artificial Horizon */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <clipPath id="horizonClip">
                  <circle cx="50" cy="50" r="42" />
                </clipPath>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(210 80% 30%)" />
                  <stop offset="50%" stopColor="hsl(210 60% 50%)" />
                </linearGradient>
                <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="50%" stopColor="hsl(30 50% 30%)" />
                  <stop offset="100%" stopColor="hsl(30 40% 20%)" />
                </linearGradient>
              </defs>
              
              <g clipPath="url(#horizonClip)">
                <g transform={`rotate(${-roll}, 50, 50) translate(0, ${pitch * 0.5})`}>
                  {/* Sky */}
                  <rect x="-50" y="-50" width="200" height="100" fill="url(#skyGradient)" />
                  {/* Ground */}
                  <rect x="-50" y="50" width="200" height="100" fill="url(#groundGradient)" />
                  {/* Horizon line */}
                  <line x1="-50" y1="50" x2="150" y2="50" stroke="hsl(var(--primary))" strokeWidth="1" />
                  
                  {/* Pitch ladder */}
                  {[-20, -10, 10, 20].map((p) => (
                    <g key={p} transform={`translate(0, ${-p * 2})`}>
                      <line x1="35" y1="50" x2="45" y2="50" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                      <line x1="55" y1="50" x2="65" y2="50" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
                      <text x="50" y="52" textAnchor="middle" className="fill-foreground" style={{ fontSize: '4px' }}>
                        {Math.abs(p)}
                      </text>
                    </g>
                  ))}
                </g>
              </g>
              
              {/* Roll indicator arc */}
              <g transform="translate(50, 50)">
                {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((angle) => {
                  const x = 40 * Math.sin((angle * Math.PI) / 180);
                  const y = -40 * Math.cos((angle * Math.PI) / 180);
                  return (
                    <line
                      key={angle}
                      x1={x * 0.9}
                      y1={y * 0.9}
                      x2={x}
                      y2={y}
                      stroke="hsl(var(--primary))"
                      strokeWidth={angle === 0 ? 1.5 : 0.5}
                    />
                  );
                })}
                {/* Roll indicator */}
                <polygon
                  points="0,-38 -3,-44 3,-44"
                  fill="hsl(var(--warning))"
                  transform={`rotate(${roll})`}
                />
              </g>
              
              {/* Aircraft symbol */}
              <g transform="translate(50, 50)">
                <line x1="-20" y1="0" x2="-8" y2="0" stroke="hsl(var(--warning))" strokeWidth="2" />
                <line x1="8" y1="0" x2="20" y2="0" stroke="hsl(var(--warning))" strokeWidth="2" />
                <circle cx="0" cy="0" r="3" fill="none" stroke="hsl(var(--warning))" strokeWidth="2" />
              </g>
              
              {/* Compass ring */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="0.5" />
            </svg>
            
            {/* Digital readouts */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
              <div className="glass-panel rounded px-2 py-0.5 flex items-center gap-1">
                <Plane size={10} className="text-primary" />
                <span className="hud-number text-[10px] text-primary">
                  {Math.round(heading)}°
                </span>
              </div>
            </div>
          </div>

          {/* Airspeed Bar (Right) */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] text-muted-foreground uppercase">KTS</span>
            <div className="relative w-4 h-32 glass-panel rounded-lg overflow-hidden">
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-stamina"
                animate={{ height: `${Math.min(100, (airspeed / 400) * 100)}%` }}
                style={{
                  boxShadow: '0 0 10px hsl(var(--stamina) / 0.6)',
                }}
              />
            </div>
            <span 
              className="hud-number text-xs text-stamina"
              style={{ textShadow: '0 0 8px hsl(var(--stamina) / 0.5)' }}
            >
              {Math.round(airspeed)}
            </span>
          </div>

          {/* Status indicators */}
          <div className="flex flex-col gap-2">
            {/* Landing Gear */}
            <div 
              className={cn(
                "glass-panel rounded-lg px-2 py-1 flex items-center gap-1",
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
            <div className="glass-panel rounded-lg px-2 py-1">
              <span className="text-[8px] text-muted-foreground block">FLAPS</span>
              <span className="hud-number text-[10px] text-primary">{flaps}%</span>
            </div>
            
            {/* Fuel */}
            <div className="glass-panel rounded-lg px-2 py-1 flex items-center gap-1">
              <Fuel 
                size={10} 
                className={cn(
                  fuelCritical ? "text-critical critical-pulse" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
              />
              <span 
                className={cn(
                  "hud-number text-[10px]",
                  fuelCritical ? "text-critical" : 
                  fuelWarning ? "text-warning" : 
                  "text-stamina"
                )}
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
