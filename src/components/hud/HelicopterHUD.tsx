import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, ArrowUp, ArrowDown, Gauge } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface HelicopterHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const HelicopterHUD = ({ vehicle, visible }: HelicopterHUDProps) => {
  const pitch = vehicle.pitch || 0;
  const roll = vehicle.roll || 0;
  const altitude = vehicle.altitude || 0;
  const airspeed = vehicle.airspeed || vehicle.speed;
  const verticalSpeed = vehicle.verticalSpeed || 0;
  const rotorRpm = vehicle.rotorRpm || 100;
  const heading = vehicle.heading || 0;
  
  const maxAltitude = 1000;
  const maxAirspeed = 200;
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;
  const lowRpm = rotorRpm < 80;

  // Calculate arc positions for neon gauges
  const getArcPath = (percentage: number, radius: number = 40) => {
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    if (clampedPercentage === 0) return '';
    
    const startAngle = -225;
    const endAngle = startAngle + (clampedPercentage * 270);
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    
    const largeArc = clampedPercentage > 0.5 ? 1 : 0;
    
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
          {/* Altitude Gauge - Neon Style */}
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
                <linearGradient id="heliAltGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--armor))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
                <filter id="heliAltGlow" x="-50%" y="-50%" width="200%" height="200%">
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
              {altitude > 0 && (
                <motion.path
                  d={getArcPath(altitude / maxAltitude, 40)}
                  fill="none"
                  stroke="url(#heliAltGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#heliAltGlow)"
                />
              )}
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[8px] text-muted-foreground uppercase">ALT</span>
              <span 
                className="hud-number text-xl text-armor"
                style={{ textShadow: '0 0 12px hsl(var(--armor) / 0.6)' }}
              >
                {Math.round(altitude)}
              </span>
              <span className="text-[7px] text-muted-foreground">METERS</span>
            </div>
          </div>

          {/* Main Attitude Indicator - Enhanced Neon */}
          <div className="relative w-44 h-44">
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden" />
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <clipPath id="heliHorizonClip">
                  <circle cx="50" cy="50" r="40" />
                </clipPath>
                <linearGradient id="heliSkyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(210 70% 25%)" />
                  <stop offset="50%" stopColor="hsl(210 50% 45%)" />
                </linearGradient>
                <linearGradient id="heliGroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="50%" stopColor="hsl(25 45% 25%)" />
                  <stop offset="100%" stopColor="hsl(25 35% 15%)" />
                </linearGradient>
                <filter id="heliNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <g clipPath="url(#heliHorizonClip)">
                <g transform={`rotate(${-roll}, 50, 50) translate(0, ${pitch * 0.6})`}>
                  <rect x="-50" y="-50" width="200" height="100" fill="url(#heliSkyGradient)" />
                  <rect x="-50" y="50" width="200" height="100" fill="url(#heliGroundGradient)" />
                  <line x1="-50" y1="50" x2="150" y2="50" stroke="hsl(var(--primary))" strokeWidth="1.5" filter="url(#heliNeonGlow)" />
                  
                  {/* Pitch ladder */}
                  {[-30, -20, -10, 10, 20, 30].map((p) => (
                    <g key={p} transform={`translate(0, ${-p * 1.5})`}>
                      <line x1="30" y1="50" x2="42" y2="50" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="0.5" />
                      <line x1="58" y1="50" x2="70" y2="50" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="0.5" />
                    </g>
                  ))}
                </g>
              </g>
              
              {/* Neon Roll scale */}
              <g transform="translate(50, 50)">
                {[-45, -30, -15, 0, 15, 30, 45].map((angle) => {
                  const x = 38 * Math.sin((angle * Math.PI) / 180);
                  const y = -38 * Math.cos((angle * Math.PI) / 180);
                  return (
                    <line
                      key={angle}
                      x1={x * 0.92}
                      y1={y * 0.92}
                      x2={x}
                      y2={y}
                      stroke="hsl(var(--primary))"
                      strokeWidth={angle === 0 ? 2 : 0.8}
                      filter={angle === 0 ? "url(#heliNeonGlow)" : undefined}
                    />
                  );
                })}
                <polygon
                  points="0,-36 -2.5,-41 2.5,-41"
                  fill="hsl(var(--warning))"
                  transform={`rotate(${roll})`}
                  filter="url(#heliNeonGlow)"
                />
              </g>
              
              {/* Aircraft symbol with neon glow */}
              <g transform="translate(50, 50)" filter="url(#heliNeonGlow)">
                <line x1="-18" y1="0" x2="-6" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <line x1="6" y1="0" x2="18" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.5" fill="none" stroke="hsl(var(--warning))" strokeWidth="2.5" />
              </g>
              
              {/* Outer neon ring */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
              
              {/* Heading */}
              <text x="50" y="92" textAnchor="middle" fill="hsl(var(--primary))" style={{ fontSize: '6px', fontFamily: 'Orbitron' }} filter="url(#heliNeonGlow)">
                {Math.round(heading)}°
              </text>
            </svg>
            
            {/* Airspeed overlay with neon */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 glass-panel rounded px-1.5 py-0.5">
              <span 
                className="hud-number text-[10px] text-stamina"
                style={{ textShadow: '0 0 6px hsl(var(--stamina) / 0.6)' }}
              >
                {Math.round(airspeed)}
              </span>
              <span className="text-[6px] text-muted-foreground block">KTS</span>
            </div>
            
            {/* Vertical speed indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 glass-panel rounded px-1.5 py-0.5 flex items-center gap-0.5">
              {verticalSpeed > 0 ? (
                <ArrowUp size={10} className="text-stamina" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--stamina)))' }} />
              ) : verticalSpeed < 0 ? (
                <ArrowDown size={10} className="text-warning" style={{ filter: 'drop-shadow(0 0 3px hsl(var(--warning)))' }} />
              ) : null}
              <span 
                className={cn(
                  "hud-number text-[10px]",
                  verticalSpeed > 0 ? "text-stamina" : verticalSpeed < 0 ? "text-warning" : "text-foreground"
                )}
                style={{ textShadow: `0 0 6px hsl(var(--${verticalSpeed > 0 ? 'stamina' : verticalSpeed < 0 ? 'warning' : 'foreground'}) / 0.5)` }}
              >
                {verticalSpeed > 0 ? '+' : ''}{Math.round(verticalSpeed)}
              </span>
            </div>
          </div>

          {/* Right Panel - Rotor & Fuel Gauges */}
          <div className="flex flex-col gap-3">
            {/* Rotor RPM Gauge - Neon Arc */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from -225deg, 
                      hsl(var(--${lowRpm ? 'critical' : 'primary'}) / 0.2) 0%, 
                      hsl(var(--${lowRpm ? 'critical' : 'primary'}) / 0.1) ${(rotorRpm / 100) * 75}%, 
                      transparent ${(rotorRpm / 100) * 75}%)`,
                    filter: 'blur(8px)',
                  }}
                />
              </div>
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="rotorGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={lowRpm ? "hsl(var(--critical))" : "hsl(var(--primary))"} />
                    <stop offset="100%" stopColor={lowRpm ? "hsl(var(--warning))" : "hsl(var(--stamina))"} />
                  </linearGradient>
                  <filter id="rotorGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <path
                  d={getArcPath(1, 35)}
                  fill="none"
                  stroke="hsl(var(--muted) / 0.2)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                
                {rotorRpm > 0 && (
                  <motion.path
                    d={getArcPath(rotorRpm / 100, 35)}
                    fill="none"
                    stroke="url(#rotorGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#rotorGlow)"
                  />
                )}
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Gauge 
                  size={12} 
                  className={cn(lowRpm ? "text-critical critical-pulse" : "text-primary")}
                  style={{ filter: `drop-shadow(0 0 4px hsl(var(--${lowRpm ? 'critical' : 'primary'})))` }}
                />
                <span 
                  className={cn(
                    "hud-number text-sm",
                    lowRpm ? "text-critical" : "text-primary"
                  )}
                  style={{ textShadow: `0 0 8px hsl(var(--${lowRpm ? 'critical' : 'primary'}) / 0.6)` }}
                >
                  {Math.round(rotorRpm)}%
                </span>
                <span className="text-[6px] text-muted-foreground">ROTOR</span>
              </div>
            </div>
            
            {/* Fuel Gauge - Neon Arc */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from -225deg, 
                      hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.2) 0%, 
                      hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.1) ${vehicle.fuel * 0.75}%, 
                      transparent ${vehicle.fuel * 0.75}%)`,
                    filter: 'blur(8px)',
                  }}
                />
              </div>
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="heliFuelGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={fuelCritical ? "hsl(var(--critical))" : fuelWarning ? "hsl(var(--warning))" : "hsl(var(--stamina))"} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                  <filter id="heliFuelGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <path
                  d={getArcPath(1, 35)}
                  fill="none"
                  stroke="hsl(var(--muted) / 0.2)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                
                {vehicle.fuel > 0 && (
                  <motion.path
                    d={getArcPath(vehicle.fuel / 100, 35)}
                    fill="none"
                    stroke="url(#heliFuelGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#heliFuelGlow)"
                  />
                )}
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
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
                    textShadow: `0 0 8px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.6)`,
                  }}
                >
                  {Math.round(vehicle.fuel)}%
                </span>
                <span className="text-[6px] text-muted-foreground">FUEL</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
