import { WidgetPosition } from "@/types/widget";
import { WidgetRect } from "@/lib/widgetPositionResolver";
import {
    POSITION_TOLERANCE_BASE,
    PROXIMITY_THRESHOLD,
    EXTERNAL_PROXIMITY_THRESHOLD,
    getWidgetElementId,
} from "@/lib/widgetConfig";
import { relayoutLogger } from "@/lib/relayoutLogger";

// Re-export logger for backwards compatibility
export { relayoutLogger };

// Destructure logger methods for cleaner usage
const { log, logWidget, logGroup, logGroupEnd, logInfo, logWarning } = relayoutLogger;

// ============= Types =============

export interface MoveVector {
    dx: number;
    dy: number;
}

export interface AffectedWidget {
    id: string;
    /** The widget that "pulled" this one into the affected set (null for category A widgets) */
    sourceId: string | null;
    /** The move vector to apply */
    vector: MoveVector;
    /** Whether this is a Category A widget (at default position) - should use absolute new position */
    isDefaultPosition: boolean;
    /** For Category A: the new default position to move to */
    newDefaultPosition?: WidgetPosition;
    /** Category label for logging */
    category: "A" | "B" | "C" | "External";
}

// ============= Distance Calculation =============

/**
 * Calculate the distance between two widget positions (center-to-center distance).
 */
export const getPositionDistance = (a: WidgetPosition, b: WidgetPosition): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the minimum edge-to-edge distance between two widget rects.
 * Returns 0 if widgets overlap.
 */
export const getRectDistance = (a: WidgetRect, b: WidgetRect): number => {
    // Horizontal gap
    const hGap = Math.max(0, Math.max(a.x - b.right, b.x - a.right));
    // Vertical gap
    const vGap = Math.max(0, Math.max(a.y - b.bottom, b.y - a.bottom));

    // If one gap is 0, they overlap on that axis, so just use the other gap
    if (hGap === 0) return vGap;
    if (vGap === 0) return hGap;

    // Corner-to-corner distance
    return Math.sqrt(hGap * hGap + vGap * vGap);
};

// ============= Position Comparison =============

/**
 * Check if two positions are "close enough" to be considered the same.
 * Uses gridSize + tolerance base for comparison.
 */
export const isPositionClose = (
    a: WidgetPosition,
    b: WidgetPosition,
    gridSize: number
): boolean => {
    const tolerance = gridSize + POSITION_TOLERANCE_BASE;
    return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
};

/**
 * Check if a widget is at its default position.
 */
export const isAtDefaultPosition = (
    widgetPosition: WidgetPosition,
    defaultRect: WidgetRect | undefined,
    gridSize: number
): boolean => {
    if (!defaultRect) return false;
    return isPositionClose(widgetPosition, { x: defaultRect.x, y: defaultRect.y }, gridSize);
};

// ============= Proximity Detection =============

/**
 * Find all widgets within a certain distance of a target widget.
 * Uses edge-to-edge distance calculation.
 */
export const findWidgetsInProximity = (
    targetId: string,
    targetRect: WidgetRect,
    allWidgetRects: Map<string, WidgetRect>,
    threshold: number,
    excludeIds: Set<string>
): string[] => {
    const nearby: string[] = [];

    for (const [id, rect] of allWidgetRects) {
        if (id === targetId || excludeIds.has(id)) continue;

        const distance = getRectDistance(targetRect, rect);
        if (distance <= threshold) {
            nearby.push(id);
        }
    }

    return nearby;
};

// ============= Build Affected Widget Graph =============

interface BuildGraphParams {
    /** All widgets with their current positions */
    widgets: Array<{ id: string; position: WidgetPosition }>;
    /** Old default positions (before the change) */
    oldDefaultRects: Map<string, WidgetRect>;
    /** New default positions (after the change) */
    newDefaultRects: Map<string, WidgetRect>;
    /** Current widget rects from DOM */
    currentRects: Map<string, WidgetRect>;
    /** Grid size for position comparison tolerance */
    gridSize: number;
    /**
     * When true, allow static sources (vector 0,0) to still grow the affected set.
     * This is useful for "prediction" (e.g., deciding what to hide to avoid flicker)
     * where we care about the affected set, not the final move vectors.
     */
    allowStaticSources?: boolean;
}

/**
 * Build the graph of affected widgets using an iterative closest-moved-neighbor approach.
 * 
 * Categories:
 * - A: Widgets at their default position → get moved to new default
 * - B: Widgets near a Category A widget with movement → inherit vector from closest moving neighbor
 * - C: Widgets near a Category B/C widget → inherit vector from closest moving neighbor
 * 
 * IMPORTANT: Category B/C widgets only inherit from widgets that actually MOVE (vector != 0,0)
 * This ensures widgets follow the logically correct neighbor, not just any nearby affected widget.
 * 
 * @returns Map of widget ID to their AffectedWidget data
 */
export const buildAffectedWidgetGraph = ({
    widgets,
    oldDefaultRects,
    newDefaultRects,
    currentRects,
    gridSize,
    allowStaticSources = false,
}: BuildGraphParams): Map<string, AffectedWidget> => {
    const affected = new Map<string, AffectedWidget>();
    const processed = new Set<string>();

    logGroup("Building Affected Widget Graph");
    log(`Total widgets: ${widgets.length}`);
    log(`PROXIMITY_THRESHOLD: ${PROXIMITY_THRESHOLD}px`);

    // Phase 1: Find all Category A widgets (at default position)
    logGroup("Phase 1: Category A (Default Position Widgets)");
    
    const categoryA: string[] = [];
    for (const widget of widgets) {
        const oldRect = oldDefaultRects.get(widget.id);
        if (isAtDefaultPosition(widget.position, oldRect, gridSize)) {
            categoryA.push(widget.id);
        }
    }

    log(`Found ${categoryA.length} widgets at default positions`);

    // Calculate move vectors for Category A widgets
    let movingCategoryACount = 0;
    for (const id of categoryA) {
        const oldRect = oldDefaultRects.get(id);
        const newRect = newDefaultRects.get(id);

        if (oldRect && newRect) {
            const vector: MoveVector = {
                dx: newRect.x - oldRect.x,
                dy: newRect.y - oldRect.y,
            };

            const isMoving = vector.dx !== 0 || vector.dy !== 0;
            if (isMoving) movingCategoryACount++;

            affected.set(id, {
                id,
                sourceId: null,
                vector,
                isDefaultPosition: true,
                newDefaultPosition: { x: newRect.x, y: newRect.y },
                category: "A",
            });
            processed.add(id);

            const moveInfo = isMoving 
                ? `vector=(${vector.dx}, ${vector.dy}) → pos=(${newRect.x}, ${newRect.y}) ✓ MOVING`
                : `vector=(0, 0) → pos=(${newRect.x}, ${newRect.y})`;
            logWidget("A", id, moveInfo);
        }
    }

    log(`${movingCategoryACount} of ${categoryA.length} Category A widgets have movement`);
    logGroupEnd(); // Phase 1

    // Phase 2: Iteratively find nearby widgets (Category B/C)
    // KEY FIX: Use closest MOVING neighbor instead of BFS order
    logGroup("Phase 2: Category B/C (Proximity-Based Widgets)");
    if (allowStaticSources) {
        logInfo("Mode: allowStaticSources=true (prediction/hiding) → static sources may grow the affected set");
    }
    
    const unprocessedIds = new Set(widgets.map(w => w.id).filter(id => !processed.has(id)));
    let iterationCount = 0;
    const maxIterations = widgets.length; // Prevent infinite loops
    
    log(`Unprocessed widgets to check: ${unprocessedIds.size}`);
    
    // Iteratively process widgets until no more can be added
    let changed = true;
    while (changed && iterationCount < maxIterations) {
        changed = false;
        iterationCount++;
        
        for (const widgetId of [...unprocessedIds]) {
            const widgetRect = currentRects.get(widgetId);
            if (!widgetRect) continue;

            // Find the CLOSEST affected widget that is ACTUALLY MOVING
            // (Plan requirement: only moving widgets can be a source)
            let closestMovingSource: AffectedWidget | null = null;
            let closestMovingDistance = Infinity;
            // For transparency in logs only
            let closestStaticSource: AffectedWidget | null = null;
            let closestStaticDistance = Infinity;
            
            for (const [affectedId, affectedData] of affected) {
                const affectedRect = currentRects.get(affectedId);
                if (!affectedRect) continue;
                
                const distance = getRectDistance(widgetRect, affectedRect);
                
                if (distance > PROXIMITY_THRESHOLD) continue;

                const isMoving = affectedData.vector.dx !== 0 || affectedData.vector.dy !== 0;
                if (isMoving) {
                    if (distance < closestMovingDistance) {
                        closestMovingDistance = distance;
                        closestMovingSource = affectedData;
                    }
                } else {
                    if (distance < closestStaticDistance) {
                        closestStaticDistance = distance;
                        closestStaticSource = affectedData;
                    }
                }
            }

            // Only accept MOVING sources (requirement)
            if (closestMovingSource) {
                const vector: MoveVector = { ...closestMovingSource.vector };

                // Determine category based on source
                const category = closestMovingSource.category === "A" ? "B" : "C";

                affected.set(widgetId, {
                    id: widgetId,
                    sourceId: closestMovingSource.id,
                    vector,
                    isDefaultPosition: false,
                    category,
                });
                processed.add(widgetId);
                unprocessedIds.delete(widgetId);
                changed = true;

                logWidget(
                    category,
                    widgetId,
                    `source=${closestMovingSource.id} (moving, dist=${closestMovingDistance.toFixed(1)}px), vector=(${vector.dx}, ${vector.dy}) ✓ MOVING`
                );
            } else if (closestStaticSource) {
                if (allowStaticSources) {
                    // Prediction mode: grow affected set even from static sources
                    const vector: MoveVector = { ...closestStaticSource.vector };
                    const category = closestStaticSource.category === "A" ? "B" : "C";

                    affected.set(widgetId, {
                        id: widgetId,
                        sourceId: closestStaticSource.id,
                        vector,
                        isDefaultPosition: false,
                        category,
                    });
                    processed.add(widgetId);
                    unprocessedIds.delete(widgetId);
                    changed = true;

                    logWidget(
                        category,
                        widgetId,
                        `source=${closestStaticSource.id} (static, dist=${closestStaticDistance.toFixed(1)}px), vector=(${vector.dx}, ${vector.dy}) (prediction)`
                    );
                } else {
                    // Real relayout mode: do not pull it (by design)
                    logInfo(
                        `${widgetId} is within ${PROXIMITY_THRESHOLD}px, but only near static widgets (closest: ${closestStaticSource.id} @ ${closestStaticDistance.toFixed(
                            1
                        )}px) → not affected (requires moving source)`
                    );
                }
            }
        }
    }

    if (unprocessedIds.size > 0) {
        logInfo(`${unprocessedIds.size} widgets not in proximity to any affected widget`);
    }
    
    log(`Completed in ${iterationCount} iterations`);
    logGroupEnd(); // Phase 2

    log(`Total affected widgets: ${affected.size}`);
    logGroupEnd(); // Building Affected Widget Graph

    return affected;
};

// ============= External Widget Pull-Along =============

interface PullExternalParams {
    /** All widgets with their current positions */
    widgets: Array<{ id: string; position: WidgetPosition }>;
    /** Map of affected widgets (already moved) */
    affectedWidgets: Map<string, AffectedWidget>;
    /** Widget rects AFTER the affected widgets have been moved */
    movedRects: Map<string, WidgetRect>;
    /** Current rects of all widgets (before move) */
    currentRects: Map<string, WidgetRect>;
}

/**
 * Find external widgets that should be pulled along because they're
 * close to an affected widget (either before OR after the move).
 * 
 * Uses BOTH current position of external widget vs current position of affected widget
 * AND current position of external widget vs moved position of affected widget
 * to catch widgets that were already close or become close after the move.
 * 
 * @returns Map of widget ID to move vector
 */
export const findExternalWidgetsToPull = ({
    widgets,
    affectedWidgets,
    movedRects,
    currentRects,
}: PullExternalParams): Map<string, MoveVector> => {
    const externalMoves = new Map<string, MoveVector>();
    const affectedIds = new Set(affectedWidgets.keys());

    logGroup("Finding External Widgets to Pull");
    log(`EXTERNAL_PROXIMITY_THRESHOLD: ${EXTERNAL_PROXIMITY_THRESHOLD}px`);
    
    const nonAffectedWidgets = widgets.filter(w => !affectedIds.has(w.id));
    log(`Non-affected widgets to check: ${nonAffectedWidgets.length}`);
    
    if (nonAffectedWidgets.length === 0) {
        logInfo("All widgets are already affected (Category A/B/C)");
        logInfo("This is expected when all widgets are within PROXIMITY_THRESHOLD of each other");
        logGroupEnd();
        return externalMoves;
    }

    // For each non-affected widget, check if it's close to any affected widget
    for (const widget of nonAffectedWidgets) {
        const widgetRect = currentRects.get(widget.id);
        if (!widgetRect) continue;

        let closestMovingDistance = Infinity;
        let bestMovingVector: MoveVector | null = null;
        let bestMovingSourceId: string | null = null;

        let closestAnyDistance = Infinity;
        let bestAnyVector: MoveVector | null = null;
        let bestAnySourceId: string | null = null;

        // Check proximity to each affected widget (unchanged logic: moving/static both count)
        for (const [affectedId, affectedData] of affectedWidgets) {
            const affectedCurrentRect = currentRects.get(affectedId);
            const affectedMovedRect = movedRects.get(affectedId);
            
            if (!affectedCurrentRect || !affectedMovedRect) continue;

            // Check distance to CURRENT position of affected widget (before move)
            const distanceToCurrent = getRectDistance(widgetRect, affectedCurrentRect);
            
            // Check distance to MOVED position of affected widget (after move)
            const distanceToMoved = getRectDistance(widgetRect, affectedMovedRect);

            // Use the smaller of the two distances
            const minDistance = Math.min(distanceToCurrent, distanceToMoved);

            if (minDistance > EXTERNAL_PROXIMITY_THRESHOLD) continue;

            // Track closest affected (any)
            if (minDistance < closestAnyDistance) {
                closestAnyDistance = minDistance;
                bestAnyVector = { ...affectedData.vector };
                bestAnySourceId = affectedId;
            }

            // Prefer sources that actually move
            const isMoving = affectedData.vector.dx !== 0 || affectedData.vector.dy !== 0;
            if (isMoving && minDistance < closestMovingDistance) {
                closestMovingDistance = minDistance;
                bestMovingVector = { ...affectedData.vector };
                bestMovingSourceId = affectedId;
            }
        }

        const vectorToUse = bestMovingVector || bestAnyVector;
        const sourceToUse = bestMovingSourceId || bestAnySourceId;
        const distToUse = bestMovingVector ? closestMovingDistance : closestAnyDistance;
        const sourceKind = bestMovingVector ? "moving" : "static";

        if (vectorToUse && sourceToUse) {
            externalMoves.set(widget.id, vectorToUse);
            logWidget(
                "External",
                widget.id,
                `pulled by ${sourceToUse} (${sourceKind}, dist=${distToUse.toFixed(1)}px), vector=(${vectorToUse.dx}, ${vectorToUse.dy})`
            );

            if (vectorToUse.dx === 0 && vectorToUse.dy === 0) {
                logWarning(`External ${widget.id} selected a static source → vector is (0,0), so it will not move`);
            }
        }
    }

    if (externalMoves.size === 0 && nonAffectedWidgets.length > 0) {
        logInfo(`No external widgets within ${EXTERNAL_PROXIMITY_THRESHOLD}px of affected widgets (before/after move)`);
    }

    log(`Total external widgets to pull: ${externalMoves.size}`);
    logGroupEnd();

    return externalMoves;
};

// ============= Apply Moves =============

/**
 * Apply move vectors to widget positions, returning new positions.
 * 
 * - Category A widgets (at default position): Move to new default position directly
 * - Category B/C widgets: Apply move vector relative to current position
 * - External widgets: Apply move vector relative to current position
 */
export const applyMoveVectors = (
    widgets: Array<{ id: string; position: WidgetPosition }>,
    affectedWidgets: Map<string, AffectedWidget>,
    externalMoves: Map<string, MoveVector>
): Map<string, WidgetPosition> => {
    const newPositions = new Map<string, WidgetPosition>();

    logGroup("Applying Move Vectors");

    let movedCount = 0;
    let staticCount = 0;

    for (const widget of widgets) {
        const affected = affectedWidgets.get(widget.id);
        const external = externalMoves.get(widget.id);
        const oldPos = widget.position;

        if (affected) {
            if (affected.isDefaultPosition && affected.newDefaultPosition) {
                // Category A: Move directly to new default position
                const newPos = affected.newDefaultPosition;
                newPositions.set(widget.id, newPos);
                
                const moved = newPos.x !== oldPos.x || newPos.y !== oldPos.y;
                if (moved) movedCount++; else staticCount++;
                
                logWidget(
                    affected.category,
                    widget.id,
                    `(${oldPos.x}, ${oldPos.y}) → (${newPos.x}, ${newPos.y})${moved ? "" : " (no change)"}`
                );
            } else {
                // Category B/C: Apply the move vector relative to current position
                const newPos = {
                    x: widget.position.x + affected.vector.dx,
                    y: widget.position.y + affected.vector.dy,
                };
                newPositions.set(widget.id, newPos);
                
                const moved = affected.vector.dx !== 0 || affected.vector.dy !== 0;
                if (moved) movedCount++; else staticCount++;
                
                logWidget(
                    affected.category,
                    widget.id,
                    `(${oldPos.x}, ${oldPos.y}) → (${newPos.x}, ${newPos.y}) [vector: ${affected.vector.dx}, ${affected.vector.dy}]${moved ? "" : " (no change)"}`
                );
            }
        } else if (external) {
            // External widget: Pull along
            const newPos = {
                x: widget.position.x + external.dx,
                y: widget.position.y + external.dy,
            };
            newPositions.set(widget.id, newPos);
            movedCount++;
            
            logWidget(
                "External",
                widget.id,
                `(${oldPos.x}, ${oldPos.y}) → (${newPos.x}, ${newPos.y}) [vector: ${external.dx}, ${external.dy}]`
            );
        }
    }

    log(`Summary: ${movedCount} widgets moved, ${staticCount} widgets static`);
    log(`Total positions updated: ${newPositions.size}`);
    logGroupEnd();

    return newPositions;
};

// ============= High-Level Relayout Computation =============

export interface ComputeRelayoutParams {
    /** All widgets with their current positions */
    widgets: Array<{ id: string; position: WidgetPosition }>;
    /** Old default positions (before the change) */
    oldDefaultRects: Map<string, WidgetRect>;
    /** New default positions (after the change) */
    newDefaultRects: Map<string, WidgetRect>;
    /** Grid size for position comparison tolerance */
    gridSize: number;
}

/**
 * Compute new positions for all affected widgets during a relayout.
 * 
 * This is the main entry point for the relayout algorithm:
 * 1. Builds current rects from DOM
 * 2. Identifies affected widgets (Category A/B/C)
 * 3. Finds external widgets to pull along
 * 4. Computes final positions for all moving widgets
 * 
 * @returns Map of widget ID to new position
 */
export const computeRelayoutPositions = ({
    widgets,
    oldDefaultRects,
    newDefaultRects,
    gridSize,
}: ComputeRelayoutParams): Map<string, WidgetPosition> => {
    // Step 1: Build current rects from widget positions
    const currentRects = buildCurrentRects(widgets);

    // Step 2: Build the affected widget graph (recursive proximity detection)
    const affectedWidgets = buildAffectedWidgetGraph({
        widgets,
        oldDefaultRects,
        newDefaultRects,
        currentRects,
        gridSize,
    });

    // Step 3: Build moved rects for external widget detection
    const movedRects = buildMovedRects(currentRects, affectedWidgets);

    // Step 4: Find external widgets to pull along
    const externalMoves = findExternalWidgetsToPull({
        widgets,
        affectedWidgets,
        movedRects,
        currentRects,
    });

    // Step 5: Apply all moves and return new positions
    return applyMoveVectors(widgets, affectedWidgets, externalMoves);
};

// ============= Build Current Rects from Widgets =============

/**
 * Build a map of current widget rects from widget positions and DOM elements.
 */
export const buildCurrentRects = (
    widgets: Array<{ id: string; position: WidgetPosition }>
): Map<string, WidgetRect> => {
    const rects = new Map<string, WidgetRect>();

    for (const widget of widgets) {
        const element = document.getElementById(getWidgetElementId(widget.id));
        if (!element) continue;

        const domRect = element.getBoundingClientRect();
        rects.set(widget.id, {
            x: widget.position.x,
            y: widget.position.y,
            width: domRect.width,
            height: domRect.height,
            right: widget.position.x + domRect.width,
            bottom: widget.position.y + domRect.height,
        });
    }

    return rects;
};

/**
 * Build moved rects after applying move vectors.
 */
export const buildMovedRects = (
    currentRects: Map<string, WidgetRect>,
    affectedWidgets: Map<string, AffectedWidget>
): Map<string, WidgetRect> => {
    const movedRects = new Map<string, WidgetRect>();

    for (const [id, rect] of currentRects) {
        const affected = affectedWidgets.get(id);

        if (affected) {
            if (affected.isDefaultPosition && affected.newDefaultPosition) {
                // Category A: Absolute new position
                const newX = affected.newDefaultPosition.x;
                const newY = affected.newDefaultPosition.y;
                movedRects.set(id, {
                    ...rect,
                    x: newX,
                    y: newY,
                    right: newX + rect.width,
                    bottom: newY + rect.height,
                });
            } else {
                // Category B/C: Relative movement
                movedRects.set(id, {
                    ...rect,
                    x: rect.x + affected.vector.dx,
                    y: rect.y + affected.vector.dy,
                    right: rect.right + affected.vector.dx,
                    bottom: rect.bottom + affected.vector.dy,
                });
            }
        } else {
            movedRects.set(id, rect);
        }
    }

    return movedRects;
};
