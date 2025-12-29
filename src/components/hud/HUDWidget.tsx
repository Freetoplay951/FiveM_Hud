import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GripVertical, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetPosition } from '@/types/widget';

interface HUDWidgetProps {
  id: string;
  children: ReactNode;
  position: WidgetPosition;
  visible: boolean;
  editMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  scale?: number;
  onPositionChange: (id: string, position: WidgetPosition) => void;
  onVisibilityToggle: (id: string) => void;
  onScaleChange?: (id: string, scale: number) => void;
  className?: string;
}

export const HUDWidget = ({
  id,
  children,
  position,
  visible,
  editMode,
  snapToGrid,
  gridSize,
  scale = 1,
  onPositionChange,
  onVisibilityToggle,
  onScaleChange,
  className,
}: HUDWidgetProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartPos.current = { x: position.x, y: position.y };
  }, [editMode, position.x, position.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = widgetStartPos.current.x + (e.clientX - dragStartPos.current.x);
      let newY = widgetStartPos.current.y + (e.clientY - dragStartPos.current.y);
      
      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
      // Clamp to viewport
      newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      newY = Math.max(0, Math.min(window.innerHeight - 100, newY));
      
      onPositionChange(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, snapToGrid, gridSize, id, onPositionChange]);

  const handleScaleUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScaleChange) {
      onScaleChange(id, Math.min(2, scale + 0.1));
    }
  };

  const handleScaleDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScaleChange) {
      onScaleChange(id, Math.max(0.5, scale - 0.1));
    }
  };

  if (!visible && !editMode) return null;

  return (
    <motion.div
      className={cn(
        "absolute pointer-events-auto",
        editMode && "cursor-move",
        editMode && "ring-2 ring-primary/50 ring-dashed rounded-lg",
        isDragging && "ring-primary z-50",
        !visible && editMode && "opacity-40",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: visible || editMode ? 1 : 0, 
        scale: 1,
      }}
      transition={{ duration: 0.2 }}
      onMouseDown={handleMouseDown}
    >
      {/* Edit Mode Controls */}
      {editMode && (
        <div className="absolute -top-7 left-0 right-0 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 glass-panel rounded px-1 py-0.5">
            <GripVertical size={10} className="text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground uppercase">{id}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Scale Controls */}
            {onScaleChange && (
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  onClick={handleScaleDown}
                  className="glass-panel rounded p-0.5 hover:bg-primary/20 transition-colors"
                >
                  <Minus size={8} className="text-muted-foreground" />
                </button>
                <span className="text-[7px] text-muted-foreground w-6 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleScaleUp}
                  className="glass-panel rounded p-0.5 hover:bg-primary/20 transition-colors"
                >
                  <Plus size={8} className="text-muted-foreground" />
                </button>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVisibilityToggle(id);
              }}
              className="glass-panel rounded p-1 hover:bg-primary/20 transition-colors"
            >
              {visible ? (
                <Eye size={10} className="text-primary" />
              ) : (
                <EyeOff size={10} className="text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Widget Content */}
      <div className={cn(!visible && editMode && "pointer-events-none")}>
        {children}
      </div>
    </motion.div>
  );
};