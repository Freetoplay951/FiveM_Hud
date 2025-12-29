import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, GripVertical, MoveDiagonal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetPosition } from "@/types/widget";

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
  onReset?: (id: string) => void;
  className?: string;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 5;

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
  onReset,
  className,
}: HUDWidgetProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ x: 0, y: 0 });

  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartScale = useRef(1);

  const getScaledSize = useCallback(() => {
    const el = rootRef.current;
    const baseW = el?.offsetWidth ?? 100;
    const baseH = el?.offsetHeight ?? 100;
    return {
      w: baseW * scale,
      h: baseH * scale,
    };
  }, [scale]);

  const clampToViewport = useCallback(
    (x: number, y: number) => {
      const { w, h } = getScaledSize();
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(0, window.innerHeight - h);
      return {
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y)),
      };
    },
    [getScaledSize],
  );

  // Keep widgets in view (important when switching vehicle HUD types / sizes)
  useEffect(() => {
    if (!editMode) return;
    const clamped = clampToViewport(position.x, position.y);
    if (clamped.x !== position.x || clamped.y !== position.y) {
      onPositionChange(id, clamped);
    }
  }, [editMode, clampToViewport, id, onPositionChange, position.x, position.y, scale]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      if (isResizing) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      widgetStartPos.current = { x: position.x, y: position.y };
    },
    [editMode, isResizing, position.x, position.y],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = widgetStartPos.current.x + (e.clientX - dragStartPos.current.x);
      let newY = widgetStartPos.current.y + (e.clientY - dragStartPos.current.y);

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      const clamped = clampToViewport(newX, newY);
      onPositionChange(id, clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, snapToGrid, gridSize, id, onPositionChange, clampToViewport]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    if (!onScaleChange) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartScale.current = scale;
  };

  useEffect(() => {
    if (!isResizing) return;
    if (!onScaleChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartPos.current.x;
      const dy = e.clientY - resizeStartPos.current.y;
      const delta = (dx + dy) / 2;

      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, resizeStartScale.current + delta / 200),
      );

      onScaleChange(id, Number(nextScale.toFixed(3)));

      // After scaling, ensure we still remain inside the viewport
      const clamped = clampToViewport(position.x, position.y);
      if (clamped.x !== position.x || clamped.y !== position.y) {
        onPositionChange(id, clamped);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onScaleChange, id, clampToViewport, position.x, position.y, onPositionChange, scale]);

  if (!visible && !editMode) return null;

  return (
    <motion.div
      ref={rootRef}
      className={cn(
        "absolute pointer-events-auto select-none",
        editMode && "cursor-move",
        editMode && "ring-2 ring-primary/50 ring-dashed rounded-lg",
        (isDragging || isResizing) && "ring-primary z-50",
        !visible && editMode && "opacity-40",
        className,
      )}
      style={{
        left: position.x,
        top: position.y,
        scale,
        transformOrigin: "top left",
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: visible || editMode ? 1 : 0,
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
            <span className="text-[8px] text-muted-foreground ml-1">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onReset && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset(id);
                }}
                className="glass-panel rounded p-1 hover:bg-muted/20 transition-colors"
                title="Position & Größe zurücksetzen"
              >
                <RotateCcw size={10} className="text-muted-foreground hover:text-warning" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVisibilityToggle(id);
              }}
              className="glass-panel rounded p-1 hover:bg-muted/20 transition-colors"
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

      {/* Resize handle */}
      {editMode && onScaleChange && (
        <button
          aria-label="Widget Größe ändern"
          onMouseDown={handleResizeMouseDown}
          className={cn(
            "absolute -right-2 -bottom-2 p-1 rounded-md glass-panel",
            "cursor-nwse-resize hover:bg-muted/20 transition-colors",
          )}
        >
          <MoveDiagonal size={12} className="text-muted-foreground" />
        </button>
      )}
    </motion.div>
  );
};
