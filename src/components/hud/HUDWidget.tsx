import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Eye, EyeOff, GripVertical, MoveDiagonal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetPosition, REFERENCE_WIDTH, REFERENCE_HEIGHT } from "@/types/widget";

interface HUDWidgetProps {
    id: string;
    children: ReactNode;
    position: WidgetPosition; // Position in reference resolution (1920x1080)
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

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// Widget base sizes for clamping
const WIDGET_BASE_SIZES: Record<string, { width: number; height: number }> = {
    health: { width: 48, height: 48 },
    armor: { width: 48, height: 48 },
    hunger: { width: 48, height: 48 },
    thirst: { width: 48, height: 48 },
    stamina: { width: 48, height: 48 },
    stress: { width: 48, height: 48 },
    oxygen: { width: 48, height: 48 },
    money: { width: 180, height: 80 },
    clock: { width: 100, height: 40 },
    compass: { width: 80, height: 80 },
    voice: { width: 120, height: 50 },
    minimap: { width: 200, height: 200 },
    notifications: { width: 280, height: 150 },
    speedometer: { width: 200, height: 200 },
};

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
    const [elementSize, setElementSize] = useState({ w: 0, h: 0 });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const [localScale, setLocalScale] = useState<number | null>(null);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const widgetStartPos = useRef({ x: 0, y: 0 });

    const resizeStartPos = useRef({ x: 0, y: 0 });
    const resizeStartScale = useRef(1);
    const resizeStartElementSize = useRef({ w: 0, h: 0 });

    // Scale factors for responsive positioning
    const scaleX = window.innerWidth / REFERENCE_WIDTH;
    const scaleY = window.innerHeight / REFERENCE_HEIGHT;

    // Convert reference position to viewport position
    const toViewportPosition = useCallback((refPos: WidgetPosition) => ({
        x: refPos.x * scaleX,
        y: refPos.y * scaleY,
    }), [scaleX, scaleY]);

    // Measure element size
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        const updateSize = () => {
            setElementSize({
                w: el.offsetWidth,
                h: el.offsetHeight,
            });
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [visible]);

    // Clamp position to viewport
    const clampToViewport = useCallback(
        (x: number, y: number) => {
            const baseSize = WIDGET_BASE_SIZES[id] || { width: 50, height: 50 };
            const widgetWidth = baseSize.width * (localScale ?? scale);
            const widgetHeight = baseSize.height * (localScale ?? scale);
            
            const maxX = Math.max(0, window.innerWidth - widgetWidth);
            const maxY = Math.max(0, window.innerHeight - widgetHeight);
            return {
                x: Math.max(0, Math.min(maxX, x)),
                y: Math.max(0, Math.min(maxY, y)),
            };
        },
        [id, scale, localScale]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode) return;
            if (isResizing) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            const viewportPos = toViewportPosition(position);
            widgetStartPos.current = { x: viewportPos.x, y: viewportPos.y };
            setLocalPosition({ x: viewportPos.x, y: viewportPos.y });
        },
        [editMode, isResizing, position, toViewportPosition]
    );

    const localPositionRef = useRef<{ x: number; y: number } | null>(null);

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
            localPositionRef.current = { x: clamped.x, y: clamped.y };

            if (rootRef.current) {
                rootRef.current.style.left = `${clamped.x}px`;
                rootRef.current.style.top = `${clamped.y}px`;
            }
        };

        const handleMouseUp = () => {
            if (localPositionRef.current) {
                // Position is already in viewport coords, onPositionChange will convert to reference
                onPositionChange(id, { x: localPositionRef.current.x, y: localPositionRef.current.y });
            }
            localPositionRef.current = null;
            setLocalPosition(null);
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
        resizeStartElementSize.current = { w: elementSize.w, h: elementSize.h };
        setLocalScale(scale);
    };

    useEffect(() => {
        if (!isResizing) return;
        if (!onScaleChange) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;

            const baseWidth = resizeStartElementSize.current.w / resizeStartScale.current;
            const baseHeight = resizeStartElementSize.current.h / resizeStartScale.current;

            const newWidth = resizeStartElementSize.current.w + deltaX;
            const newHeight = resizeStartElementSize.current.h + deltaY;

            const scaleXNew = baseWidth > 0 ? newWidth / baseWidth : resizeStartScale.current;
            const scaleYNew = baseHeight > 0 ? newHeight / baseHeight : resizeStartScale.current;

            const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (scaleXNew + scaleYNew) / 2));
            setLocalScale(Number(nextScale.toFixed(3)));
        };

        const handleMouseUp = () => {
            if (localScale !== null) {
                onScaleChange(id, localScale);
            }
            setLocalScale(null);
            setIsResizing(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, onScaleChange, id, localScale]);

    if (!visible && !editMode) return null;

    // Calculate display position - use local during drag, otherwise scale from reference
    const viewportPos = toViewportPosition(position);
    const displayPosition = localPosition ?? viewportPos;
    const displayScale = localScale ?? scale;

    return (
        <div
            ref={rootRef}
            className={cn(
                "absolute pointer-events-auto select-none",
                editMode && "cursor-move",
                editMode && "ring-2 ring-primary/50 ring-dashed rounded-lg",
                (isDragging || isResizing) && "ring-primary z-50",
                !visible && editMode && "opacity-40",
                !isDragging && !isResizing && "transition-opacity duration-200",
                className
            )}
            style={{
                left: displayPosition.x,
                top: displayPosition.y,
                transform: `scale(${displayScale})`,
                transformOrigin: "top left",
                opacity: visible || editMode ? 1 : 0,
            }}
            onMouseDown={handleMouseDown}>
            {/* Edit Mode Controls */}
            {editMode && (
                <div className="absolute -top-7 left-0 right-0 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 glass-panel rounded px-1 py-0.5">
                        <GripVertical size={10} className="text-muted-foreground" />
                        <span className="text-[8px] text-muted-foreground uppercase">{id}</span>
                        <span className="text-[8px] text-muted-foreground ml-1">{Math.round(displayScale * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {onReset && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset(id);
                                }}
                                className="glass-panel rounded p-1 hover:bg-muted/20 transition-colors"
                                title="Position & Größe zurücksetzen">
                                <RotateCcw size={10} className="text-muted-foreground hover:text-warning" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onVisibilityToggle(id);
                            }}
                            className="glass-panel rounded p-1 hover:bg-muted/20 transition-colors">
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
            <div className={cn(!visible && editMode && "pointer-events-none")}>{children}</div>

            {/* Resize handle */}
            {editMode && onScaleChange && (
                <button
                    aria-label="Widget Größe ändern"
                    onMouseDown={handleResizeMouseDown}
                    className={cn(
                        "absolute -right-2 -bottom-2 p-1 rounded-md glass-panel",
                        "cursor-nwse-resize hover:bg-muted/20 transition-colors"
                    )}>
                    <MoveDiagonal size={12} className="text-muted-foreground" />
                </button>
            )}
        </div>
    );
};
