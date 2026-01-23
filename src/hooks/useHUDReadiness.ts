import { useState, useEffect, useCallback } from "react";
import { useHUDGlobalStore, useAreAllAsyncWidgetsReady } from "@/stores/hudStore";
import { sendNuiCallback } from "@/hooks/useNuiEvents";

type ReadinessPhase = "registering" | "waiting" | "ready";

interface UseHUDReadinessOptions {
    isVisible: boolean;
    isLanguageLoaded: boolean;
    hasTranslations: boolean;
    widgetsDistributed: boolean;
    distributeWidgets: (isWidgetDisabled: (id: string) => boolean, force: boolean) => void;
    isWidgetDisabled: (id: string) => boolean;
}

/**
 * Hook that manages HUD readiness with a clean phase-based approach:
 * 
 * Phase 1: "registering" - Widgets have time to register themselves (one RAF cycle)
 * Phase 2: "waiting" - Registration sealed, waiting for all widgets to signal ready
 * Phase 3: "ready" - All widgets ready, AllThingsLoaded can be fired
 * 
 * This pattern is similar to a "barrier" synchronization primitive.
 */
export function useHUDReadiness({
    isVisible,
    isLanguageLoaded,
    hasTranslations,
    widgetsDistributed,
    distributeWidgets,
    isWidgetDisabled,
}: UseHUDReadinessOptions) {
    const [phase, setPhase] = useState<ReadinessPhase>("registering");
    const [hasSignaledReady, setHasSignaledReady] = useState(false);

    const sealRegistration = useHUDGlobalStore((s) => s.sealRegistration);
    const isRegistrationSealed = useHUDGlobalStore((s) => s.isRegistrationSealed);
    const areAllAsyncWidgetsReady = useAreAllAsyncWidgetsReady();

    // Base prerequisites before we can even start the registration phase
    const basePrerequisitesMet = isVisible && isLanguageLoaded && hasTranslations;

    // Phase 1 → Phase 2: Seal registration after one render cycle
    useEffect(() => {
        if (phase === "registering" && basePrerequisitesMet) {
            // Give widgets one RAF cycle to register themselves
            const frameId = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    sealRegistration();
                    setPhase("waiting");
                    console.log("[HUD Readiness] Registration sealed, entering waiting phase");
                });
            });

            return () => cancelAnimationFrame(frameId);
        }
    }, [phase, basePrerequisitesMet, sealRegistration]);

    // Phase 2 → Phase 3: All registered widgets are ready
    useEffect(() => {
        if (phase === "waiting" && isRegistrationSealed && areAllAsyncWidgetsReady) {
            setPhase("ready");
            console.log("[HUD Readiness] All async widgets ready, entering ready phase");
        }
    }, [phase, isRegistrationSealed, areAllAsyncWidgetsReady]);

    // Phase 3: Fire AllThingsLoaded once
    useEffect(() => {
        if (phase === "ready" && !hasSignaledReady) {
            if (!widgetsDistributed) {
                distributeWidgets(isWidgetDisabled, false);
            }
            console.log("[HUD] AllThingsLoaded - all data loaded, async widgets ready, and DOM rendered");
            sendNuiCallback("AllThingsLoaded");
            setHasSignaledReady(true);
        }
    }, [phase, hasSignaledReady, widgetsDistributed, distributeWidgets, isWidgetDisabled]);

    // Reset phases if visibility changes (e.g., HUD hidden and shown again)
    const resetReadiness = useCallback(() => {
        setPhase("registering");
        setHasSignaledReady(false);
    }, []);

    return {
        phase,
        isReady: phase === "ready",
        hasSignaledReady,
        resetReadiness,
    };
}
