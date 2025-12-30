import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
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
    /**
     * How the widget position is interpreted.
     * - center (default): position is the widget's center point (good for fixed-size widgets)
     * - top-left: position is the widget's top-left corner (good for variable-height widgets like notifications)
     */
    anchor?: "center" | "top-left";
    onPositionChange: (id: string, position: WidgetPosition) => void;
    onVisibilityToggle: (id: string) => void;
    onScaleChange?: (id: string, scale: number) => void;
    onReset?: (id: string) => void;
    className?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export const HUDWidget = ({
    id,
    children,
    position,
    visible,
    editMode,
    snapToGrid,
    gridSize,
    scale = 1,
    anchor = "center",
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

    // Local position state for smooth dragging (no lag)
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const [localScale, setLocalScale] = useState<number | null>(null);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const widgetStartPos = useRef({ x: 0, y: 0 });

    const resizeStartPos = useRef({ x: 0, y: 0 });
    const resizeStartScale = useRef(1);

    // Estimated base sizes for widgets when not visible (fallback)
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

    // Measure element size (use base size without scale for calculations)
    useEffect(() => {
        const el = rootRef.current;
        const currentScale = localScale ?? scale;

        if (!el) {
            // If element is not rendered (e.g., not visible), use estimated size
            const baseSize = WIDGET_BASE_SIZES[id] || { width: 50, height: 50 };
            setElementSize({
                w: baseSize.width * currentScale,
                h: baseSize.height * currentScale,
            });
            return;
        }

        const updateSize = () => {
            const cs = localScale ?? scale;
            // If element has zero size, use fallback
            if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                const baseSize = WIDGET_BASE_SIZES[id] || { width: 50, height: 50 };
                setElementSize({
                    w: baseSize.width * cs,
                    h: baseSize.height * cs,
                });
            } else {
                setElementSize({
                    w: el.offsetWidth * cs,
                    h: el.offsetHeight * cs,
                });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [scale, localScale, id, visible]);

    // Convert stored percent position to top-left pixel position
    // - center: position is the widget center
    // - top-left: position is the widget's top-left corner
    const centerPercentToTopLeftPixel = useCallback(
        (xPercent: number, yPercent: number) => {
            if (anchor === "top-left") {
                return {
                    x: (xPercent / 100) * window.innerWidth,
                    y: (yPercent / 100) * window.innerHeight,
                };
            }

            const centerX = (xPercent / 100) * window.innerWidth;
            const centerY = (yPercent / 100) * window.innerHeight;
            return {
                x: centerX - elementSize.w / 2,
                y: centerY - elementSize.h / 2,
            };
        },
        [anchor, elementSize]
    );

    // Convert top-left pixel position to stored percent position
    const topLeftPixelToCenterPercent = useCallback(
        (x: number, y: number): WidgetPosition => {
            if (anchor === "top-left") {
                return {
                    xPercent: (x / window.innerWidth) * 100,
                    yPercent: (y / window.innerHeight) * 100,
                };
            }

            const centerX = x + elementSize.w / 2;
            const centerY = y + elementSize.h / 2;
            return {
                xPercent: (centerX / window.innerWidth) * 100,
                yPercent: (centerY / window.innerHeight) * 100,
            };
        },
        [anchor, elementSize]
    );

    const clampToViewport = useCallback(
        (x: number, y: number) => {
            const maxX = Math.max(0, window.innerWidth - elementSize.w);
            const maxY = Math.max(0, window.innerHeight - elementSize.h);
            return {
                x: Math.max(0, Math.min(maxX, x)),
                y: Math.max(0, Math.min(maxY, y)),
            };
        },
        [elementSize]
    );

    // Keep widgets in view - ALWAYS (not just in edit mode)
    useEffect(() => {
        if (elementSize.w === 0 || isDragging || isResizing) return;
        const pixelPos = centerPercentToTopLeftPixel(position.xPercent, position.yPercent);
        const clamped = clampToViewport(pixelPos.x, pixelPos.y);
        if (Math.abs(clamped.x - pixelPos.x) > 1 || Math.abs(clamped.y - pixelPos.y) > 1) {
            onPositionChange(id, topLeftPixelToCenterPercent(clamped.x, clamped.y));
        }
    }, [
        clampToViewport,
        id,
        onPositionChange,
        position.xPercent,
        position.yPercent,
        elementSize,
        centerPercentToTopLeftPixel,
        topLeftPixelToCenterPercent,
        isDragging,
        isResizing,
    ]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode) return;
            if (isResizing) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            const pixelPos = centerPercentToTopLeftPixel(position.xPercent, position.yPercent);
            widgetStartPos.current = { x: pixelPos.x, y: pixelPos.y };
            setLocalPosition({ x: pixelPos.x, y: pixelPos.y });
        },
        [editMode, isResizing, position.xPercent, position.yPercent, centerPercentToTopLeftPixel]
    );

    // Use refs for mousemove to avoid re-rendering on every pixel
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
            // Update ref immediately (no re-render)
            localPositionRef.current = { x: clamped.x, y: clamped.y };
            // Apply directly to DOM for zero-lag dragging
            if (rootRef.current) {
                rootRef.current.style.left = `${clamped.x}px`;
                rootRef.current.style.top = `${clamped.y}px`;
            }
        };

        const handleMouseUp = () => {
            // Commit the final position to parent state
            if (localPositionRef.current) {
                onPositionChange(
                    id,
                    topLeftPixelToCenterPercent(localPositionRef.current.x, localPositionRef.current.y)
                );
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
    }, [isDragging, snapToGrid, gridSize, id, onPositionChange, clampToViewport, topLeftPixelToCenterPercent]);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (!editMode) return;
        if (!onScaleChange) return;
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        resizeStartPos.current = { x: e.clientX, y: e.clientY };
        resizeStartScale.current = scale;
        // Store current element size and position for calculating new scale
        resizeStartElementSize.current = { w: elementSize.w, h: elementSize.h };
        // Store the top-left pixel position of the widget
        const pixelPos = centerPercentToTopLeftPixel(position.xPercent, position.yPercent);
        resizeStartPixelPos.current = { x: pixelPos.x, y: pixelPos.y };
        setLocalScale(scale);
    };

    // Store resize start element size for calculating scale from mouse position
    const resizeStartElementSize = useRef({ w: 0, h: 0 });
    const resizeStartPixelPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!isResizing) return;
        if (!onScaleChange) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate how far the mouse has moved from the starting resize position
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;

            // Get the base size (size at scale 1.0)
            const baseWidth = resizeStartElementSize.current.w / resizeStartScale.current;
            const baseHeight = resizeStartElementSize.current.h / resizeStartScale.current;

            // Calculate new size based on delta (only grow in the direction of the drag)
            const newWidth = resizeStartElementSize.current.w + deltaX;
            const newHeight = resizeStartElementSize.current.h + deltaY;

            // Calculate scale based on desired size vs base size
            const scaleX = baseWidth > 0 ? newWidth / baseWidth : resizeStartScale.current;
            const scaleY = baseHeight > 0 ? newHeight / baseHeight : resizeStartScale.current;

            // Use the average of both dimensions for proportional scaling
            const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (scaleX + scaleY) / 2));

            // Update local scale immediately (no lag)
            setLocalScale(Number(nextScale.toFixed(3)));
        };

        const handleMouseUp = () => {
            // Commit the final scale to parent state
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

    // Use local position during drag, otherwise calculate from props
    const displayPosition = localPosition ?? centerPercentToTopLeftPixel(position.xPercent, position.yPercent);
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
                // Only animate opacity when not dragging/resizing
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
                        <GripVertical
                            size={10}
                            className="text-muted-foreground"
                        />
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
                                <RotateCcw
                                    size={10}
                                    className="text-muted-foreground hover:text-warning"
                                />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onVisibilityToggle(id);
                            }}
                            className="glass-panel rounded p-1 hover:bg-muted/20 transition-colors">
                            {visible ? (
                                <Eye
                                    size={10}
                                    className="text-primary"
                                />
                            ) : (
                                <EyeOff
                                    size={10}
                                    className="text-muted-foreground"
                                />
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
                    <MoveDiagonal
                        size={12}
                        className="text-muted-foreground"
                    />
                </button>
            )}
        </div>
    );
};
