import { useState, useEffect, useCallback, useRef } from "react";
import { WidgetPosition } from "@/types/widget";
import { SnapLine, findSnapLines, getVisibleWidgetIds, SNAP_THRESHOLD, FindSnapLinesOptions } from "@/lib/snapLineUtils";
import { isSubwidget, SNAP_LINE_DISPLAY_DURATION } from "@/lib/widgetConfig";

interface UseSnapLinesOptions {
    editMode: boolean;
    /** Whether SimpleMode is enabled - affects subwidget filtering */
    simpleMode?: boolean;
}

interface UseSnapLinesResult {
    /** Whether Shift key is currently pressed */
    isShiftPressed: boolean;
    /** Currently active snap lines */
    activeSnapLines: SnapLine[];
    /** Get snapped position for a widget being dragged */
    getSnappedPosition: (
        widgetId: string,
        position: WidgetPosition,
        selectedWidgetIds?: string[]
    ) => WidgetPosition;
    /** Clear active snap lines */
    clearSnapLines: () => void;
    /** Set snap lines directly (for keyboard navigation) */
    setSnapLines: (lines: SnapLine[]) => void;
    /** Show snap lines temporarily with auto-clear */
    showSnapLinesTemporarily: (lines: SnapLine[], durationMs?: number) => void;
}

export const useSnapLines = ({ editMode, simpleMode = true }: UseSnapLinesOptions): UseSnapLinesResult => {
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [activeSnapLines, setActiveSnapLines] = useState<SnapLine[]>([]);

    // Use ref for visible widget IDs to avoid recalculating on every drag move
    const visibleWidgetIdsRef = useRef<string[]>([]);
    const simpleModeRef = useRef(simpleMode);

    // Keep simpleMode ref updated
    useEffect(() => {
        simpleModeRef.current = simpleMode;
    }, [simpleMode]);

    // Track Shift key state
    useEffect(() => {
        if (!editMode) {
            setIsShiftPressed(false);
            setActiveSnapLines([]);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                setIsShiftPressed(true);
                // Cache visible widget IDs when Shift is pressed
                // Filter out subwidgets if SimpleMode is enabled
                const allVisibleIds = getVisibleWidgetIds();
                visibleWidgetIdsRef.current = simpleModeRef.current
                    ? allVisibleIds.filter((id) => !isSubwidget(id))
                    : allVisibleIds;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                setIsShiftPressed(false);
                setActiveSnapLines([]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [editMode]);

    // Get snapped position during drag
    const getSnappedPosition = useCallback(
        (
            widgetId: string,
            position: WidgetPosition,
            selectedWidgetIds?: string[]
        ): WidgetPosition => {
            if (!isShiftPressed) {
                setActiveSnapLines([]);
                return position;
            }

            // Build options for findSnapLines
            const options: FindSnapLinesOptions = {};

            // If there are selected widgets (group drag), exclude them from snap targets
            if (selectedWidgetIds && selectedWidgetIds.length > 1) {
                options.excludeWidgetIds = selectedWidgetIds.filter((id) => id !== widgetId);
            }

            const { snapLines, snappedPosition } = findSnapLines(
                widgetId,
                position,
                visibleWidgetIdsRef.current,
                SNAP_THRESHOLD,
                options
            );

            setActiveSnapLines(snapLines);
            return snappedPosition;
        },
        [isShiftPressed]
    );

    const clearSnapLines = useCallback(() => {
        setActiveSnapLines([]);
    }, []);

    // Ref for timeout cleanup
    const temporaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSnapLinesTemporarily = useCallback((lines: SnapLine[], durationMs: number = SNAP_LINE_DISPLAY_DURATION) => {
        // Clear any existing timeout
        if (temporaryTimeoutRef.current) {
            clearTimeout(temporaryTimeoutRef.current);
        }
        
        setActiveSnapLines(lines);
        
        temporaryTimeoutRef.current = setTimeout(() => {
            setActiveSnapLines([]);
            temporaryTimeoutRef.current = null;
        }, durationMs);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (temporaryTimeoutRef.current) {
                clearTimeout(temporaryTimeoutRef.current);
            }
        };
    }, []);

    return {
        isShiftPressed,
        activeSnapLines,
        getSnappedPosition,
        clearSnapLines,
        setSnapLines: setActiveSnapLines,
        showSnapLinesTemporarily,
    };
};
