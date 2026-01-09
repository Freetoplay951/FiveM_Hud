import { useState, useEffect, useCallback } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditModeOverlay } from "./hud/EditModeOverlay";
import { SubwidgetRenderer } from "./hud/SubwidgetRenderer";
import { HUDWidgetRenderers } from "./hud/HUDWidgetRenderers";
import { useHUDLayout } from "@/hooks/useHUDLayout";
import { useHUDState } from "@/hooks/useHUDState";
import { useHUDNuiEvents } from "@/hooks/useHUDNuiEvents";
import { useDemoSimulation } from "@/hooks/useDemoSimulation";
import { useMultiSelection } from "@/hooks/useMultiSelection";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/contexts/LanguageContext";
import { getWidgetGroupsMap } from "@/types/widget";
import { FullscreenDeathScreen } from "./hud/FullscreenDeathScreen";
import { SelectionBox } from "./hud/SelectionBox";
import { BrandingWidget } from "./hud/BrandingWidget";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { EDIT_MODE_DEMO_NOTIFICATIONS } from "./hud/data/demoData";

export const HUD = () => {
    // All HUD state management
    const hudState = useHUDState();
    const {
        hudState: statusState,
        vehicleState,
        moneyState,
        playerState,
        voiceState,
        locationState,
        deathState,
        chatState,
        teamChatState,
        radioState,
        demoDeathTimer,
        isVisible,
        isVoiceEnabled,
        isDemoMode,
        setHudState,
        setVehicleState,
        setMoneyState,
        setPlayerState,
        setVoiceState,
        setLocationState,
        setDeathState,
        setChatState,
        setTeamChatState,
        setRadioState,
        setDisabledWidgets,
        setDemoDeathTimer,
        setIsVisible,
        setIsVoiceEnabled,
        isWidgetDisabled,
    } = hudState;

    const [editMenuOpen, setEditMenuOpen] = useState(false);

    // Layout management
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
    const { notifications, removeNotification, success, error, warning, info } = useNotifications();

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

    // NUI Events
    useHUDNuiEvents({
        setHudState,
        setVehicleState,
        setMoneyState,
        setVoiceState,
        setRadioState: setRadioState,
        setLocationState,
        setPlayerState,
        setIsVisible,
        setDeathState,
        setDisabledWidgets,
        setIsVoiceEnabled,
        setChatState,
        setTeamChatState,
        editMode,
        toggleEditMode,
        success,
        error,
        warning,
        info,
    });

    // Demo simulation
    useDemoSimulation({
        isDemoMode,
        editMode,
        deathState,
        setHudState,
        setVehicleState,
        setVoiceState,
        setLocationState,
        setDeathState,
        setChatState,
        setTeamChatState,
        setDemoDeathTimer,
        success,
        error,
        warning,
        info,
        enterEditMode,
        exitEditMode,
    });

    // Ready signal
    const allDataLoaded = isVisible && isLanguageLoaded && t !== null;
    const [hasSignaledReady, setHasSignaledReady] = useState(false);

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
    }, [allDataLoaded, hasSignaledReady, widgetsDistributed, distributeWidgets, statusState, isWidgetDisabled]);

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

    const isUsingEditDemoNotifications = editMode && notifications.length === 0;
    const displayedNotifications = isUsingEditDemoNotifications ? EDIT_MODE_DEMO_NOTIFICATIONS : notifications;

    // Props for HUDWidgetRenderers
    const widgetRendererProps = {
        // State
        statusState,
        vehicleState,
        moneyState,
        playerState,
        voiceState,
        locationState,
        deathState,
        chatState,
        teamChatState,
        radioState,

        // Settings
        editMode,
        snapToGrid,
        gridSize,
        statusDesign,
        speedometerType,
        minimapShape,
        isDemoMode,
        isVoiceEnabled,
        hasSignaledReady,
        autoLayoutHiddenIds,

        // Notifications
        notifications,
        removeNotification,
        displayedNotifications,
        isUsingEditDemoNotifications,

        // Widget functions
        getWidget,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        resetWidget,
        isWidgetDisabled,
        getMultiSelectProps,

        // State setters for chat
        setChatState,
        setTeamChatState,
    };

    if (!isVisible || !t) return null;

    return (
        <div
            className={cn("fixed inset-0 overflow-hidden", editMode ? "pointer-events-auto" : "pointer-events-none")}
            onMouseDown={handleSelectionStart}
            onMouseMove={handleSelectionMove}
            onMouseUp={handleSelectionEnd}
            onMouseLeave={handleSelectionEnd}>
            {/* Branding */}
            {!deathState.isDead && <BrandingWidget />}

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
            {isDemoMode && !editMode && !deathState.isDead && (
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
                                        checked={teamChatState.hasAccess}
                                        onCheckedChange={(checked) =>
                                            setTeamChatState((prev) => ({ ...prev, hasAccess: checked }))
                                        }
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-destructive-foreground/80">{t.demo.adminRights}</span>
                                    <Switch
                                        checked={teamChatState.isAdmin}
                                        onCheckedChange={(checked) =>
                                            setTeamChatState((prev) => ({ ...prev, isAdmin: checked }))
                                        }
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Widget Renderers */}
            <HUDWidgetRenderers {...widgetRendererProps} />

            {/* Subwidget Renderer (Helicopter and future vehicle subwidgets) */}
            <SubwidgetRenderer
                vehicleState={vehicleState}
                editMode={editMode}
                simpleMode={simpleMode}
                speedometerType={speedometerType}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                hasSignaledReady={hasSignaledReady}
                deathState={deathState}
                getWidget={getWidget}
                updateWidgetPosition={updateWidgetPosition}
                updateWidgetScale={updateWidgetScale}
                toggleWidgetVisibility={toggleWidgetVisibility}
                resetWidget={resetWidget}
                reflowWidgetPosition={reflowWidgetPosition}
                isWidgetDisabled={isWidgetDisabled}
                getMultiSelectProps={getMultiSelectProps}
            />

            {/* Fullscreen Death Screen */}
            {!editMode && (
                <FullscreenDeathScreen
                    death={
                        isDemoMode && deathState.isDead
                            ? {
                                  ...deathState,
                                  respawnTimer: demoDeathTimer.respawnTimer,
                                  waitTimer: demoDeathTimer.waitTimer,
                                  canRespawn: demoDeathTimer.respawnTimer === 0,
                              }
                            : deathState
                    }
                    visible={deathState.isDead}
                />
            )}
        </div>
    );
};
