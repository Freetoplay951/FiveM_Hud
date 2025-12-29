import { cn } from '@/lib/utils';

interface MinimapFrameProps {
  className?: string;
}

export const MinimapFrame = ({ className }: MinimapFrameProps) => {
  return (
    <div className={cn(
      "relative w-[200px] h-[120px] rounded-lg overflow-hidden",
      className
    )}>
      {/* Frame Border */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none z-10"
        style={{
          border: '2px solid hsl(var(--primary) / 0.3)',
          boxShadow: 'inset 0 0 20px hsl(var(--background) / 0.5), 0 0 15px hsl(var(--primary) / 0.2)',
        }}
      />
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/60 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/60 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/60 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/60 rounded-br-lg" />
      
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Minimap Placeholder - In FiveM this would show the actual minimap */}
      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
        <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
          Minimap Area
        </span>
      </div>
    </div>
  );
};
