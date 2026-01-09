import { useState, useEffect, useCallback } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUDWidget } from "./hud/HUDWidget";
import { VehicleHUDFactory } from "./hud/widgets/vehicles/VehicleHUDFactory";
import { EditModeOverlay } from "./hud/EditModeOverlay";
import { StatusWidget } from "./hud/widgets/StatusWidget";
import { MoneyWidget } from "./hud/widgets/MoneyWidget";
import { VoiceWidget } from "./hud/widgets/VoiceWidget";
import { LocationWidget } from "./hud/widgets/LocationWidget";
import { ClockWidget } from "./hud/widgets/ClockWidget";
import { CompassWidget } from "./hud/widgets/CompassWidget";
import { VehicleNameWidget } from "./hud/widgets/VehicleNameWidget";
import { NotificationContainer } from "./hud/notifications/NotificationContainer";
import { ChatWidget } from "./hud/widgets/ChatWidget";
import { TeamChatWidget } from "./hud/widgets/TeamChatWidget";
import { RadioWidget } from "./hud/widgets/RadioWidget";
import { SubwidgetRenderer } from "./hud/SubwidgetRenderer";
import { useHUDLayout } from "@/hooks/useHUDLayout";
import { useHUDState } from "@/hooks/useHUDState";
import { useHUDNuiEvents } from "@/hooks/useHUDNuiEvents";
import { useDemoSimulation } from "@/hooks/useDemoSimulation";
import { useMultiSelection } from "@/hooks/useMultiSelection";
import { isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/contexts/LanguageContext";
import { StatusType } from "@/types/hud";
import { VEHICLE_WIDGET_TYPES, HELI_SUBWIDGET_TYPES, SpeedometerType } from "@/types/widget";
import { FullscreenDeathScreen } from "./hud/FullscreenDeathScreen";
import { SelectionBox } from "./hud/SelectionBox";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { MinimapWidget } from "./hud/widgets/MinimapWidget";
import { DEMO_RADIO_ENABLED, EDIT_MODE_DEMO_NOTIFICATIONS } from "./hud/data/demoData";

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

    // Handle simple mode toggle
    const handleSimpleModeChange = useCallback(
        (enabled: boolean) => {
            setSimpleMode(enabled);
            if (enabled) {
                const baseWidget = getWidget("heli-base");
                const baseScale = baseWidget?.scale ?? 1;
                requestAnimationFrame(() => {
                    HELI_SUBWIDGET_TYPES.forEach((subType) => {
                        if (subType === "heli-base") return;
                        updateWidgetScale(subType, baseScale);
                        reflowWidgetPosition(subType, isWidgetDisabled, hasSignaledReady);
                    });
                });
            }
        },
        [setSimpleMode, updateWidgetScale, reflowWidgetPosition, isWidgetDisabled, hasSignaledReady, getWidget]
    );

    const widgetProps = {
        editMode,
        snapToGrid,
        gridSize,
        onPositionChange: updateWidgetPosition,
        onVisibilityToggle: toggleWidgetVisibility,
        onScaleChange: updateWidgetScale,
        onReset: (id: string) => resetWidget(id, isWidgetDisabled, hasSignaledReady),
    };

    const statusTypes: StatusType[] = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const isUsingEditDemoNotifications = editMode && notifications.length === 0;
    const displayedNotifications = isUsingEditDemoNotifications ? EDIT_MODE_DEMO_NOTIFICATIONS : notifications;

    if (!isVisible || !t) return null;

    return (
        <div
            className={cn("fixed inset-0 overflow-hidden", editMode ? "pointer-events-auto" : "pointer-events-none")}
            onMouseDown={handleSelectionStart}
            onMouseMove={handleSelectionMove}
            onMouseUp={handleSelectionEnd}
            onMouseLeave={handleSelectionEnd}>
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
                <Popover open={editMenuOpen} onOpenChange={setEditMenuOpen}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed z-50"
                        style={{ top: "50%", right: 10, transform: "translateY(-50%)" }}>
                        <button
                            onClick={() => setEditMenuOpen((o) => !o)}
                            className="p-2 bg-card/90 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors pointer-events-auto"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}>
                            <Settings size={18} className="text-primary" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }} />
                        </button>
                    </motion.div>
                    <PopoverTrigger asChild>
                        <button
                            className="fixed z-50 p-2 bg-card/90 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors pointer-events-auto opacity-0 pointer-events-none"
                            style={{ top: "50%", right: 10, transform: "translateY(-50%)" }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}>
                            <Settings size={18} className="text-primary" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }} />
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
                                    <span className="text-xs text-destructive-foreground/80">{t.demo.teamChatAccess}</span>
                                    <Switch
                                        checked={teamChatState.hasAccess}
                                        onCheckedChange={(checked) => setTeamChatState((prev) => ({ ...prev, hasAccess: checked }))}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-destructive-foreground/80">{t.demo.adminRights}</span>
                                    <Switch
                                        checked={teamChatState.isAdmin}
                                        onCheckedChange={(checked) => setTeamChatState((prev) => ({ ...prev, isAdmin: checked }))}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {(() => {
                const widget = getWidget("notifications");
                if (!widget) return null;
                const isDeadOverlay = deathState.isDead && !editMode;
                return (
                    <HUDWidget
                        id={widget.id}
                        position={isDeadOverlay ? { x: 20, y: 20 } : widget.position}
                        visible={widget.visible}
                        scale={widget.scale}
                        editMode={editMode}
                        snapToGrid={snapToGrid}
                        gridSize={gridSize}
                        onPositionChange={updateWidgetPosition}
                        onScaleChange={updateWidgetScale}
                        onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        className={isDeadOverlay ? "z-50" : ""}
                        {...getMultiSelectProps(widget.id)}>
                        <NotificationContainer
                            notifications={displayedNotifications}
                            onClose={isUsingEditDemoNotifications ? () => {} : removeNotification}
                        />
                    </HUDWidget>
                );
            })()}

            {/* Status Widgets */}
            {statusTypes.map((type) => {
                const widget = getWidget(type);
                if (!widget) return null;
                const value = statusState[type] ?? 100;
                const isOxygenHidden = type === "oxygen" && !editMode && !statusState.isUnderwater;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead) && !isOxygenHidden;
                return (
                    <HUDWidget
                        key={type}
                        id={type}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        suspended={autoLayoutHiddenIds.includes(type)}
                        {...widgetProps}
                        {...getMultiSelectProps(type)}>
                        <StatusWidget type={type} value={value} design={statusDesign} />
                    </HUDWidget>
                );
            })}

            {/* Money Widget */}
            {(() => {
                const widget = getWidget("money");
                if (!widget) return null;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <MoneyWidget money={moneyState} player={playerState} />
                    </HUDWidget>
                );
            })()}

            {/* Clock Widget */}
            {(() => {
                const widget = getWidget("clock");
                if (!widget) return null;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <ClockWidget />
                    </HUDWidget>
                );
            })()}

            {/* Voice Widget */}
            {(() => {
                const widget = getWidget("voice");
                if (!widget) return null;
                const baseVisible = editMode ? true : !deathState.isDead;
                const voiceAvailable = isDemoMode || isVoiceEnabled;
                const isVisibleWidget = widget.visible && baseVisible && voiceAvailable;
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={isVisibleWidget} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} suspended={autoLayoutHiddenIds.includes(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <VoiceWidget voice={voiceState} />
                    </HUDWidget>
                );
            })()}

            {/* Radio Widget */}
            {(() => {
                const widget = getWidget("radio");
                if (!widget) return null;
                const baseVisible = editMode ? true : !deathState.isDead;
                const voiceAvailable = isDemoMode || isVoiceEnabled;
                const showRadio = radioState.active || editMode;
                const isVisibleWidget = widget.visible && baseVisible && voiceAvailable && showRadio;
                const radioData = editMode && !radioState.active ? DEMO_RADIO_ENABLED : radioState;
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={isVisibleWidget} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <RadioWidget radio={radioData} />
                    </HUDWidget>
                );
            })()}

            {/* Location Widget */}
            {(() => {
                const widget = getWidget("location");
                if (!widget) return null;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} suspended={autoLayoutHiddenIds.includes(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <LocationWidget location={locationState} shape={minimapShape} />
                    </HUDWidget>
                );
            })()}

            {/* Compass Widget */}
            {(() => {
                const widget = getWidget("compass");
                if (!widget) return null;
                const showCompass = locationState.heading != undefined || editMode;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead) && showCompass;
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <CompassWidget heading={locationState.heading} />
                    </HUDWidget>
                );
            })()}

            {/* Vehicle Name Widget */}
            {(() => {
                const widget = getWidget("vehiclename");
                if (!widget) return null;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <VehicleNameWidget vehicleType={editMode ? speedometerType : vehicleState.vehicleType} vehicleName={vehicleState.vehicleName} vehicleSpawnName={vehicleState.vehicleSpawnName} inVehicle={vehicleState.inVehicle} editMode={editMode} />
                    </HUDWidget>
                );
            })()}

            {/* Minimap Widget */}
            {(() => {
                const widget = getWidget("minimap");
                if (!widget) return null;
                const isNUI = isNuiEnvironment();
                const baseVisible = widget.visible && (editMode || !isNUI);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} suspended={autoLayoutHiddenIds.includes(widget.id)} {...widgetProps} onPositionChange={undefined} onScaleChange={undefined}>
                        <MinimapWidget shape={minimapShape} />
                    </HUDWidget>
                );
            })()}

            {/* Vehicle Speedometers */}
            {VEHICLE_WIDGET_TYPES.map((widgetType) => {
                const widget = getWidget(widgetType);
                if (!widget) return null;
                const vehicleType = widgetType.replace("speedometer-", "") as SpeedometerType;
                const baseVisible = editMode ? true : !deathState.isDead;
                const correctVehicle = editMode ? speedometerType === vehicleType : vehicleState.inVehicle && vehicleState.vehicleType === vehicleType;
                const shouldShow = widget.visible && baseVisible && correctVehicle;
                return (
                    <HUDWidget key={widgetType} id={widget.id} position={widget.position} hasAccess={correctVehicle} visible={shouldShow} scale={widget.scale} editMode={editMode} snapToGrid={snapToGrid} gridSize={gridSize} onPositionChange={updateWidgetPosition} onVisibilityToggle={() => toggleWidgetVisibility(widgetType)} onScaleChange={updateWidgetScale} onReset={() => resetWidget(widgetType, isWidgetDisabled, hasSignaledReady)} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...getMultiSelectProps(widget.id)}>
                        <VehicleHUDFactory vehicle={{ ...vehicleState, vehicleType }} visible={baseVisible && correctVehicle && (editMode ? true : widget.visible)} />
                    </HUDWidget>
                );
            })}

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

            {/* Chat Widget */}
            {(() => {
                const widget = getWidget("chat");
                if (!widget) return null;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={baseVisible} scale={widget.scale} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <ChatWidget
                            chat={chatState}
                            setChatState={setChatState}
                            editMode={editMode}
                            onSendMessage={(msg) => {
                                if (isDemoMode) {
                                    const newMsg = { id: Date.now().toString(), type: "normal" as const, sender: "Du", message: msg, timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
                                    setChatState((prev) => ({ ...prev, isInputActive: false, messages: [...prev.messages, newMsg] }));
                                } else {
                                    sendNuiCallback("sendChatMessage", { message: msg });
                                }
                            }}
                            onClose={() => {
                                if (isDemoMode) {
                                    setChatState((prev) => ({ ...prev, isInputActive: false }));
                                } else {
                                    sendNuiCallback("closeChat");
                                }
                            }}
                        />
                    </HUDWidget>
                );
            })()}

            {/* Team Chat Widget */}
            {(() => {
                const widget = getWidget("teamchat");
                if (!widget) return null;
                const hasTeamAccess = teamChatState.hasAccess;
                const baseVisible = hasTeamAccess && (editMode || !deathState.isDead);
                const isVisibleWidget = widget.visible && baseVisible;
                return (
                    <HUDWidget id={widget.id} position={widget.position} visible={isVisibleWidget} scale={widget.scale} hasAccess={hasTeamAccess} disabled={!hasSignaledReady || isWidgetDisabled(widget.id)} {...widgetProps} {...getMultiSelectProps(widget.id)}>
                        <TeamChatWidget
                            teamChat={teamChatState}
                            editMode={editMode}
                            onSendMessage={(msg) => {
                                if (isDemoMode) {
                                    const newMsg = { id: Date.now().toString(), sender: "Du", rank: "Admin", message: msg, timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
                                    setTeamChatState((prev) => ({ ...prev, isInputActive: false, messages: [...prev.messages, newMsg] }));
                                } else {
                                    sendNuiCallback("sendTeamChatMessage", { message: msg });
                                }
                            }}
                            onClose={() => {
                                if (isDemoMode) {
                                    setTeamChatState((prev) => ({ ...prev, isInputActive: false }));
                                } else {
                                    sendNuiCallback("closeTeamChat");
                                }
                            }}
                        />
                    </HUDWidget>
                );
            })()}

            {/* Fullscreen Death Screen */}
            {!editMode && (
                <FullscreenDeathScreen
                    death={isDemoMode && deathState.isDead ? { ...deathState, respawnTimer: demoDeathTimer.respawnTimer, waitTimer: demoDeathTimer.waitTimer, canRespawn: demoDeathTimer.respawnTimer === 0 } : deathState}
                    visible={deathState.isDead}
                />
            )}
        </div>
    );
};
