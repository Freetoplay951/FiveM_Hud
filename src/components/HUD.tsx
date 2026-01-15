import { useState, useEffect, useCallback, useMemo } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditModeOverlay } from "./hud/EditModeOverlay";
import { SubwidgetRenderer } from "./hud/SubwidgetRenderer";
import { HUDWidgetRenderers } from "./hud/HUDWidgetRenderers";
import { KeybindsOverlay } from "./hud/keybinds";
import { useHUDLayout } from "@/hooks/useHUDLayout";
import { useNuiEvents, sendNuiCallback } from "@/hooks/useNuiEvents";
import { useStoreDemoSimulation } from "@/hooks/useStoreDemoSimulation";
import { useMultiSelection } from "@/hooks/useMultiSelection";
import { useTranslation } from "@/contexts/LanguageContext";
import { getWidgetGroupsMap } from "@/types/widget";
import { FullscreenDeathScreen } from "./hud/FullscreenDeathScreen";
import { SelectionBox } from "./hud/SelectionBox";
import { BrandingWidget } from "./hud/BrandingWidget";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useRenderLogger } from "@/hooks/useRenderLogger";

// Import stores - HUD only uses global state, widgets fetch their own data
import { useHUDGlobalStore, useIsVisible, useIsDemoMode } from "@/stores/hudStore";
import { useIsDead, useDeathData } from "@/stores/deathStore";
import { useChatStore } from "@/stores/chatStore";
import { useKeybindsStore } from "@/stores/keybindsStore";

export const HUD = () => {
    const [editMenuOpen, setEditMenuOpen] = useState(false);
    const [hasSignaledReady, setHasSignaledReady] = useState(false);

    // Global HUD state from stores (NOT widget data)
    const isVisible = useIsVisible();
    const isDemoMode = useIsDemoMode();
    const isWidgetDisabled = useHUDGlobalStore((s) => s.isWidgetDisabled);

    // Death state - needed for death screen overlay
    const isDead = useIsDead();
    const deathData = useDeathData();

    // Team chat access for demo mode badge
    const teamChatHasAccess = useChatStore((s) => s.teamChatHasAccess);
    const teamChatIsAdmin = useChatStore((s) => s.teamChatIsAdmin);
    const setTeamChatAccess = useChatStore((s) => s.setTeamChatAccess);
    const setTeamChatIsAdmin = useChatStore((s) => s.setTeamChatIsAdmin);

    // Render logging for performance debugging
    useRenderLogger("HUD", {
        editMenuOpen,
        hasSignaledReady,
        isVisible,
        isDemoMode,
        isDead,
        teamChatHasAccess,
        teamChatIsAdmin,
    });

    // Layout management - pure layout, no widget data
    const {
        widgets,
        editMode,
        snapToGrid,
        gridSize,
        statusDesign,
        speedometerType,
        minimapShape,
        simpleMode,
        widgetsDistributed,
        autoLayoutHiddenIds,
        toggleEditMode,
        setSnapToGrid,
        setStatusDesign,
        setSpeedometerType,
        setMinimapShape,
        setSimpleMode,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        resetLayout,
        resetWidget,
        reflowWidgetPosition,
        getWidget,
        distributeWidgets,
    } = useHUDLayout();

    const { t, isLoaded: isLanguageLoaded } = useTranslation();

    // Multi-selection
    const {
        selectionBox,
        isSelecting,
        handleSelectionStart,
        handleSelectionMove,
        handleSelectionEnd,
        getMultiSelectProps,
    } = useMultiSelection({
        editMode,
        widgets,
        getWidget,
        updateWidgetPosition,
    });

    // Edit mode controls
    const enterEditMode = useCallback(() => {
        if (!editMode) toggleEditMode();
        setEditMenuOpen(true);
    }, [editMode, toggleEditMode]);

    const exitEditMode = useCallback(() => {
        setEditMenuOpen(false);
        sendNuiCallback("saveLayout", { widgets });
        sendNuiCallback("closeEditMode");
        setTimeout(() => {
            if (editMode) toggleEditMode();
        }, 50);
    }, [editMode, toggleEditMode, widgets]);

    useEffect(() => {
        if (!editMode) setEditMenuOpen(false);
    }, [editMode]);

    // NUI Events - updates stores directly, no props needed
    useNuiEvents({
        editMode,
        toggleEditMode,
    });

    // Demo simulation - updates stores directly
    useStoreDemoSimulation({
        editMode,
        enterEditMode,
        exitEditMode,
    });

    // Ready signal
    const allDataLoaded = isVisible && isLanguageLoaded && t !== null;

    useEffect(() => {
        if (allDataLoaded && !hasSignaledReady) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!widgetsDistributed) {
                        distributeWidgets(isWidgetDisabled, false);
                    }
                    console.log("[HUD] AllThingsLoaded - all data loaded and DOM rendered");
                    sendNuiCallback("AllThingsLoaded");
                    setHasSignaledReady(true);
                });
            });
        }
    }, [allDataLoaded, hasSignaledReady, widgetsDistributed, distributeWidgets, isWidgetDisabled]);

    // Handle simple mode toggle - syncs subwidgets to their base widget's scale
    const handleSimpleModeChange = useCallback(
        (enabled: boolean) => {
            setSimpleMode(enabled);
            if (enabled) {
                const groupsMap = getWidgetGroupsMap();

                groupsMap.forEach((subwidgets, baseId) => {
                    const baseScale = getWidget(baseId)?.scale ?? 1;
                    subwidgets.forEach((subType) => {
                        updateWidgetScale(subType, baseScale);
                    });
                });

                requestAnimationFrame(() => {
                    groupsMap.forEach((subwidgets, _baseId) => {
                        subwidgets.forEach((subType) => {
                            reflowWidgetPosition(subType, isWidgetDisabled, hasSignaledReady);
                        });
                    });
                });
            }
        },
        [setSimpleMode, updateWidgetScale, reflowWidgetPosition, isWidgetDisabled, hasSignaledReady, getWidget]
    );

    // Stabilized callbacks for demo mode switches
    const handleTeamChatAccessChange = useCallback(
        (checked: boolean) => setTeamChatAccess(checked),
        [setTeamChatAccess]
    );
    const handleTeamChatAdminChange = useCallback(
        (checked: boolean) => setTeamChatIsAdmin(checked),
        [setTeamChatIsAdmin]
    );

    // LAYOUT-ONLY props for HUDWidgetRenderers - NO widget data, NO notifications
    // Notifications are now self-subscribed via notificationStore
    const layoutProps = useMemo(
        () => ({
            // Layout settings only
            editMode,
            snapToGrid,
            gridSize,
            statusDesign,
            speedometerType,
            minimapShape,
            hasSignaledReady,
            autoLayoutHiddenIds,

            // Layout functions only
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            isWidgetDisabled,
            getMultiSelectProps,
        }),
        [
            editMode,
            snapToGrid,
            gridSize,
            statusDesign,
            speedometerType,
            minimapShape,
            hasSignaledReady,
            autoLayoutHiddenIds,
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            isWidgetDisabled,
            getMultiSelectProps,
        ]
    );

    // Subwidget props - memoized separately
    const subwidgetProps = useMemo(
        () => ({
            editMode,
            simpleMode,
            speedometerType,
            snapToGrid,
            gridSize,
            hasSignaledReady,
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            reflowWidgetPosition,
            isWidgetDisabled,
            getMultiSelectProps,
        }),
        [
            editMode,
            simpleMode,
            speedometerType,
            snapToGrid,
            gridSize,
            hasSignaledReady,
            getWidget,
            updateWidgetPosition,
            updateWidgetScale,
            toggleWidgetVisibility,
            resetWidget,
            reflowWidgetPosition,
            isWidgetDisabled,
            getMultiSelectProps,
        ]
    );

    if (!isVisible || !t) return null;

    return (
        <div
            className={cn("fixed inset-0 overflow-hidden", editMode ? "pointer-events-auto" : "pointer-events-none")}
            onMouseDown={handleSelectionStart}
            onMouseMove={handleSelectionMove}
            onMouseUp={handleSelectionEnd}
            onMouseLeave={handleSelectionEnd}>
            {/* Branding */}
            {!isDead && <BrandingWidget />}

            {/* Selection Box */}
            {selectionBox && (
                <SelectionBox
                    startX={selectionBox.startX}
                    startY={selectionBox.startY}
                    endX={selectionBox.endX}
                    endY={selectionBox.endY}
                    isActive={isSelecting}
                />
            )}

            {/* Edit Mode Settings */}
            {editMode && (
                <Popover
                    open={editMenuOpen}
                    onOpenChange={setEditMenuOpen}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed top-4 right-4 z-50">
                        <button
                            onClick={() => setEditMenuOpen((o) => !o)}
                            className="p-2 bg-card/90 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}>
                            <Settings
                                size={18}
                                className="text-primary"
                                style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                            />
                        </button>
                    </motion.div>
                    <PopoverTrigger asChild>
                        <button
                            className="fixed z-50 p-2 bg-card/90 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors pointer-events-auto opacity-0 pointer-events-none"
                            style={{ top: "50%", right: 10, transform: "translateY(-50%)" }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}>
                            <Settings
                                size={18}
                                className="text-primary"
                                style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                            />
                        </button>
                    </PopoverTrigger>
                    <EditModeOverlay
                        snapToGrid={snapToGrid}
                        statusDesign={statusDesign}
                        speedometerType={speedometerType}
                        minimapShape={minimapShape}
                        simpleMode={simpleMode}
                        onSnapToGridChange={setSnapToGrid}
                        onStatusDesignChange={(design) => setStatusDesign(design, isWidgetDisabled)}
                        onSpeedometerTypeChange={setSpeedometerType}
                        onMinimapShapeChange={(shape) => setMinimapShape(shape, isWidgetDisabled)}
                        onSimpleModeChange={handleSimpleModeChange}
                        onReset={() => resetLayout(false, isWidgetDisabled, hasSignaledReady)}
                        onExitEditMode={exitEditMode}
                    />
                </Popover>
            )}

            {/* Demo Mode Badge */}
            {isDemoMode && !editMode && !isDead && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-destructive/80 border border-destructive/50 rounded-lg px-4 py-3 animate-fade-in-up pointer-events-auto">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-destructive-foreground font-semibold">{t.demo.title}</span>
                                    <span className="flex flex-col text-xs text-destructive-foreground/80 uppercase tracking-wider hud-text">
                                        <span>Vehicle: V (Typ: 1︱2︱3︱4︱5︱6)</span>
                                        <span>Edit: E</span>
                                        <span>Death: F</span>
                                        <span>Voice: R</span>
                                        <span>Body: B</span>
                                        <span>Notify: H︱J︱K︱L</span>
                                        <span>Chat: T</span>
                                        <span>TeamChat: Y</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 border-t border-destructive-foreground/20 pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-destructive-foreground/80">
                                        {t.demo.teamChatAccess}
                                    </span>
                                    <Switch
                                        checked={teamChatHasAccess}
                                        onCheckedChange={handleTeamChatAccessChange}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-destructive-foreground/80">{t.demo.adminRights}</span>
                                    <Switch
                                        checked={teamChatIsAdmin}
                                        onCheckedChange={handleTeamChatAdminChange}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Widget Renderers - LAYOUT ONLY, widgets fetch their own data */}
            <HUDWidgetRenderers {...layoutProps} />

            {/* Subwidget Renderer (Helicopter and future vehicle subwidgets) */}
            <SubwidgetRenderer {...subwidgetProps} />

            {/* Fullscreen Death Screen */}
            {!editMode && (
                <FullscreenDeathScreen
                    death={deathData}
                    visible={isDead}
                />
            )}

            {/* Keybinds Overlay */}
            <KeybindsOverlay />
        </div>
    );
};
