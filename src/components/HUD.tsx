import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUDWidget } from "./hud/HUDWidget";
import { VehicleHUDFactory } from "./hud/vehicles/VehicleHUDFactory";
import { EditModeOverlay } from "./hud/EditModeOverlay";
import { StatusWidget } from "./hud/widgets/StatusWidget";
import { NeonMoneyWidget } from "./hud/widgets/MoneyWidget";

import { NeonVoiceWidget } from "./hud/widgets/VoiceWidget";
import { NeonMinimapWidget } from "./hud/widgets/MinimapWidget";
import { ClockWidget } from "./hud/widgets/ClockWidget";
import { CompassWidget } from "./hud/widgets/CompassWidget";
import { NotificationContainer } from "./hud/notifications/NotificationContainer";
import { ChatWidget } from "./hud/widgets/ChatWidget";
import { TeamChatWidget } from "./hud/widgets/TeamChatWidget";
import { useHUDLayout } from "@/hooks/useHUDLayout";
import { useNuiEvents, isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";
import { useNotifications } from "@/hooks/useNotifications";
import {
    HudState,
    VehicleState,
    MoneyState,
    VoiceState,
    LocationState,
    PlayerState,
    StatusType,
    NotificationData,
    DeathState,
    ChatState,
    TeamChatState,
} from "@/types/hud";
import { DeathScreenWidget } from "./hud/widgets/DeathScreenWidget";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

// Demo values
const DEMO_HUD: HudState = {
    health: 85,
    armor: 50,
    hunger: 70,
    thirst: 45,
    stamina: 90,
    stress: 25,
    oxygen: 100,
};
const DEMO_VEHICLE: VehicleState = {
    inVehicle: false, // Default: not in vehicle - press V to toggle
    vehicleType: "car",
    speed: 127,
    gear: 4,
    fuel: 65,
};
const DEMO_MONEY: MoneyState = { cash: 15420, bank: 234567, blackMoney: 5000 };
const DEMO_PLAYER: PlayerState = { id: 42, job: "LSPD", rank: "Chief" };
const DEMO_VOICE: VoiceState = { active: true, range: "normal" };
const DEMO_LOCATION: LocationState = {
    street: "Vinewood Boulevard",
    area: "Vinewood",
    heading: 45,
};

// Demo Death State
const DEMO_DEATH: DeathState = {
    isDead: false, // Default: alive - press D to toggle
    respawnTimer: 14,
    waitTimer: 59,
    canCallHelp: true,
    canRespawn: false,
    message: "Du wurdest schwer verletzt und benötigst medizinische Hilfe",
};

// Demo Chat State (leer in Production - wird von FiveM befüllt)
const DEMO_CHAT: ChatState = {
    isOpen: false,
    isInputActive: false,
    isVisible: false,
    messages: [],
    unreadCount: 0,
};

// Demo Team Chat State (leer in Production - wird von FiveM befüllt)
const DEMO_TEAM_CHAT: TeamChatState = {
    isOpen: false,
    isInputActive: false,
    isVisible: false,
    hasAccess: true,
    teamType: "admin",
    teamName: "Team-Chat",
    messages: [],
    unreadCount: 0,
    onlineMembers: 3,
    isAdmin: true,
};

// Demo Chat Nachrichten
const DEMO_CHAT_MESSAGES = [
    { sender: "Max Mustermann", message: "Hey, wie geht's dir?" },
    { sender: "Anna Schmidt", message: "Wer kommt mit zum Hafen?" },
    { sender: "Tom Weber", message: "Ich brauche Hilfe bei meinem Auto" },
    { sender: "Lisa Müller", message: "Treffen wir uns beim Rathaus?" },
    { sender: "Paul Becker", message: "Hat jemand ein Telefon?" },
    { sender: "Julia Fischer", message: "Ich bin beim Krankenhaus" },
    { sender: "Kevin Hoffmann", message: "Wo ist der nächste Laden?" },
    { sender: "Sarah Wagner", message: "Komme gleich" },
];

const DEMO_TEAM_MESSAGES = [
    { sender: "Admin Max", rank: "Admin", message: "Bitte alle aufpassen" },
    { sender: "Mod Lisa", rank: "Moderator", message: "Neuer Spieler braucht Hilfe" },
    { sender: "Support Tom", rank: "Supporter", message: "Ticket wurde bearbeitet" },
    { sender: "Admin Sarah", rank: "Admin", message: "Server Neustart in 30 Minuten" },
];

const EDIT_MODE_DEMO_NOTIFICATIONS: NotificationData[] = [
    {
        id: "edit-demo-1",
        type: "info",
        title: "Info",
        message: "Diese Notification ist nur im Edit Mode sichtbar (zum Verschieben).",
        duration: 0,
    },
    {
        id: "edit-demo-2",
        type: "warning",
        title: "Warnung",
        message: "Zieh mich an die gewünschte Position.",
        duration: 0,
    },
];

export const HUD = () => {
    const [hudState, setHudState] = useState<HudState>(DEMO_HUD);
    const [vehicleState, setVehicleState] = useState<VehicleState>(DEMO_VEHICLE);
    const [moneyState, setMoneyState] = useState<MoneyState>(DEMO_MONEY);
    const [playerState, setPlayerState] = useState<PlayerState>(DEMO_PLAYER);
    const [voiceState, setVoiceState] = useState<VoiceState>(DEMO_VOICE);
    const [locationState, setLocationState] = useState<LocationState>(DEMO_LOCATION);
    const [deathState, setDeathState] = useState<DeathState>(DEMO_DEATH);
    const [chatState, setChatState] = useState<ChatState>(DEMO_CHAT);
    const [teamChatState, setTeamChatState] = useState<TeamChatState>(DEMO_TEAM_CHAT);
    const [showDeathScreenPreview, setShowDeathScreenPreview] = useState(false); // For edit mode preview
    const [isVisible, setIsVisible] = useState(true); // HUD ist standardmäßig sichtbar!
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => !isNuiEnvironment()); // In Demo an, in FiveM aus bis Voice erkannt wird
    const [isDemoMode] = useState(!isNuiEnvironment());

    const [editMenuOpen, setEditMenuOpen] = useState(false);

    const {
        widgets,
        editMode,
        snapToGrid,
        gridSize,
        statusDesign,
        speedometerType,
        speedometerConfigs,
        minimapShape,
        toggleEditMode,
        setSnapToGrid,
        setStatusDesign,
        setSpeedometerType,
        setMinimapShape,
        updateSpeedometerConfig,
        getSpeedometerConfig,
        resetSpeedometer,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        resetLayout,
        resetWidget,
        getWidget,
    } = useHUDLayout();

    const { notifications, removeNotification, success, error, warning, info } = useNotifications();

    const enterEditMode = () => {
        if (!editMode) toggleEditMode();
        setEditMenuOpen(true);
    };

    const exitEditMode = () => {
        // First close the popover, then exit edit mode after a brief delay
        // This ensures the popover closes properly before the component unmounts
        setEditMenuOpen(false);
        
        // Save layout to Lua before exiting
        sendNuiCallback('saveLayout', { widgets, speedometerConfigs });
        
        // Tell Lua to close edit mode (reset NUI focus)
        sendNuiCallback('closeEditMode');
        
        setTimeout(() => {
            if (editMode) toggleEditMode();
        }, 50);
    };

    useEffect(() => {
        if (!editMode) setEditMenuOpen(false);
    }, [editMode]);

    // NUI Event handlers
    useNuiEvents({
        onUpdateHud: (data) => setHudState((prev) => ({ ...prev, ...data })),
        onUpdateVehicle: setVehicleState,
        onUpdateMoney: setMoneyState,
        onUpdateVoice: (data) => {
            setVoiceState(data);
            // Sobald wir Voice-Daten bekommen, gilt das Voice-System als "gefunden"
            setIsVoiceEnabled(true);
        },
        onUpdateLocation: setLocationState,
        onUpdatePlayer: setPlayerState,
        onSetVisible: setIsVisible,
        onUpdateDeath: setDeathState,
        onSetVoiceEnabled: setIsVoiceEnabled,
        onToggleEditMode: (enabled) => {
            if (enabled && !editMode) toggleEditMode();
            else if (!enabled && editMode) toggleEditMode();
        },
        onNotify: (data) => {
            const notifyFn = { success, error, warning, info }[data.type] || info;
            notifyFn(data.title, data.message, data.duration);
        },
        onUpdateChat: (data) => {
            setChatState((prev) => ({ ...prev, ...data }));
        },
        onUpdateTeamChat: (data) => {
            setTeamChatState((prev) => ({ ...prev, ...data }));
        },
    });

    // Demo simulation with animated plane/heli values
    useEffect(() => {
        if (!isDemoMode) return;

        const interval = setInterval(() => {
            setHudState((prev) => ({
                ...prev,
                hunger: Math.max(0, prev.hunger - 0.1),
                thirst: Math.max(0, prev.thirst - 0.15),
                stamina: Math.min(100, Math.max(0, prev.stamina + (Math.random() - 0.5) * 5)),
            }));

            setVehicleState((prev) => {
                const baseUpdate = {
                    ...prev,
                    fuel: Math.max(0, prev.fuel - 0.02),
                };

                if (prev.vehicleType === "car") {
                    return {
                        ...baseUpdate,
                        speed: prev.inVehicle ? Math.min(280, Math.max(0, prev.speed + (Math.random() - 0.5) * 20)) : 0,
                    };
                }

                if (prev.vehicleType === "boat") {
                    return {
                        ...baseUpdate,
                        speed: prev.inVehicle ? Math.min(80, Math.max(0, prev.speed + (Math.random() - 0.5) * 10)) : 0,
                        heading: ((prev.heading || 0) + (Math.random() - 0.5) * 5 + 360) % 360,
                    };
                }

                if (prev.vehicleType === "plane") {
                    return {
                        ...baseUpdate,
                        airspeed: Math.min(400, Math.max(150, (prev.airspeed || 250) + (Math.random() - 0.5) * 30)),
                        altitude: Math.min(2000, Math.max(100, (prev.altitude || 500) + (Math.random() - 0.5) * 50)),
                        pitch: Math.max(-30, Math.min(30, (prev.pitch || 0) + (Math.random() - 0.5) * 5)),
                        roll: Math.max(-45, Math.min(45, (prev.roll || 0) + (Math.random() - 0.5) * 8)),
                        heading: ((prev.heading || 180) + (Math.random() - 0.5) * 3 + 360) % 360,
                        speed: Math.min(400, Math.max(150, (prev.airspeed || 250) + (Math.random() - 0.5) * 30)),
                    };
                }

                if (prev.vehicleType === "helicopter") {
                    return {
                        ...baseUpdate,
                        airspeed: Math.min(200, Math.max(0, (prev.airspeed || 80) + (Math.random() - 0.5) * 20)),
                        altitude: Math.min(1000, Math.max(10, (prev.altitude || 200) + (Math.random() - 0.5) * 30)),
                        pitch: Math.max(-20, Math.min(20, (prev.pitch || 0) + (Math.random() - 0.5) * 4)),
                        roll: Math.max(-30, Math.min(30, (prev.roll || 0) + (Math.random() - 0.5) * 6)),
                        heading: ((prev.heading || 90) + (Math.random() - 0.5) * 5 + 360) % 360,
                        verticalSpeed: Math.max(
                            -20,
                            Math.min(20, (prev.verticalSpeed || 5) + (Math.random() - 0.5) * 8)
                        ),
                        rotorRpm: Math.min(100, Math.max(70, (prev.rotorRpm || 95) + (Math.random() - 0.5) * 5)),
                        speed: Math.min(200, Math.max(0, (prev.airspeed || 80) + (Math.random() - 0.5) * 20)),
                    };
                }

                return baseUpdate;
            });

            setVoiceState((prev) => ({
                ...prev,
                active: Math.random() > 0.3,
            }));

            if (Math.random() > 0.75) {
                setLocationState((prev) => {
                    const currentDeg = prev.heading ?? 0;
                    const change = Math.random() > 0.5 ? 45 : -45;
                    const newHeading = (currentDeg + change + 360) % 360;
                    return {
                        ...prev,
                        heading: newHeading,
                    };
                });
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isDemoMode]);

    // Demo: Random Chat-Nachrichten
    useEffect(() => {
        if (!isDemoMode || editMode) return;

        // Zufällige Chat-Nachricht alle 5-15 Sekunden
        const chatInterval = setInterval(() => {
            if (Math.random() > 0.5) {
                const randomMsg = DEMO_CHAT_MESSAGES[Math.floor(Math.random() * DEMO_CHAT_MESSAGES.length)];
                const newMsg = {
                    id: Date.now().toString(),
                    type: "normal" as const,
                    sender: randomMsg.sender,
                    message: randomMsg.message,
                    timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                };
                setChatState((prev) => ({
                    ...prev,
                    isOpen: true,
                    isVisible: true,
                    messages: [...prev.messages, newMsg],
                    unreadCount: prev.isInputActive ? 0 : prev.unreadCount + 1,
                }));
            }
        }, 8000);

        // Zufällige Team-Chat-Nachricht alle 10-20 Sekunden
        const teamChatInterval = setInterval(() => {
            if (Math.random() > 0.6) {
                const randomMsg = DEMO_TEAM_MESSAGES[Math.floor(Math.random() * DEMO_TEAM_MESSAGES.length)];
                const newMsg = {
                    id: Date.now().toString(),
                    sender: randomMsg.sender,
                    rank: randomMsg.rank,
                    message: randomMsg.message,
                    timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                };
                setTeamChatState((prev) => ({
                    ...prev,
                    isOpen: true,
                    isVisible: true,
                    messages: [...prev.messages, newMsg],
                    unreadCount: prev.isInputActive ? 0 : prev.unreadCount + 1,
                }));
            }
        }, 12000);

        return () => {
            clearInterval(chatInterval);
            clearInterval(teamChatInterval);
        };
    }, [isDemoMode, editMode]);

    // Demo key controls
    useEffect(() => {
        if (!isDemoMode) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === "v") {
                setVehicleState((prev) => ({ ...prev, inVehicle: !prev.inVehicle }));
            }
            if (e.key === "r") {
                setVoiceState((prev) => ({
                    ...prev,
                    range: prev.range === "whisper" ? "normal" : prev.range === "normal" ? "shout" : "whisper",
                }));
            }
            if (e.key === "e") {
                if (editMode) {
                    exitEditMode();
                } else {
                    enterEditMode();
                }
            }
            // Vehicle type switching for demo
            if (e.key === "1") setVehicleState((prev) => ({ ...prev, vehicleType: "car", gear: 4 }));
            if (e.key === "2")
                setVehicleState((prev) => ({
                    ...prev,
                    vehicleType: "plane",
                    altitude: 500,
                    pitch: 5,
                    roll: 0,
                    heading: 180,
                    airspeed: 250,
                    landingGear: false,
                    flaps: 0,
                }));
            if (e.key === "3")
                setVehicleState((prev) => ({ ...prev, vehicleType: "boat", heading: 90, anchor: false }));
            if (e.key === "4")
                setVehicleState((prev) => ({
                    ...prev,
                    vehicleType: "helicopter",
                    altitude: 200,
                    rotorRpm: 95,
                    verticalSpeed: 5,
                    pitch: 0,
                    roll: 0,
                    heading: 90,
                    airspeed: 80,
                }));

            // Demo notifications - only in demo mode, NOT in edit mode
            if (!editMode) {
                if (e.key === "h") success("Erfolg!", "Aktion erfolgreich ausgeführt.");
                if (e.key === "j") error("Fehler!", "Etwas ist schief gelaufen.");
                if (e.key === "k") warning("Warnung!", "Bitte beachten.");
                if (e.key === "l") info("Info", "Hier ist eine Information.");
            }

            // Demo death toggle - only when NOT in edit mode
            if (e.key === "d" && !editMode) {
                setDeathState((prev) => {
                    if (prev.isDead) {
                        return { ...prev, isDead: false };
                    } else {
                        return {
                            ...prev,
                            isDead: true,
                            respawnTimer: 14,
                            waitTimer: 59,
                            canCallHelp: true,
                            canRespawn: false,
                        };
                    }
                });
            }

            // Chat toggle - T key
            if (e.key === "t" && !editMode) {
                setChatState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
            }

            // Team Chat toggle - Y key
            if (e.key === "y" && !editMode) {
                setTeamChatState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
            }
        };

        window.addEventListener("keypress", handleKeyPress);
        return () => {
            window.removeEventListener("keypress", handleKeyPress);
        };
    }, [editMode, success, error, warning, info]);

    const widgetProps = {
        editMode,
        snapToGrid,
        gridSize,
        onPositionChange: updateWidgetPosition,
        onVisibilityToggle: toggleWidgetVisibility,
        onScaleChange: updateWidgetScale,
        onReset: resetWidget,
    };

    const statusTypes: StatusType[] = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];

    const isUsingEditDemoNotifications = editMode && notifications.length === 0;
    const displayedNotifications = isUsingEditDemoNotifications ? EDIT_MODE_DEMO_NOTIFICATIONS : notifications;

    // Wenn nicht sichtbar, nichts rendern
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Grid overlay when in edit mode */}
            {editMode && snapToGrid && (
                <motion.div
                    className="fixed inset-0 z-30 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        backgroundImage:
                            "linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                />
            )}

            {/* Notifications - as draggable widget, always visible (even when dead) */}
            {(() => {
                const widget = getWidget("notifications");
                if (!widget)
                    return (
                        <NotificationContainer
                            notifications={displayedNotifications}
                            onClose={isUsingEditDemoNotifications ? () => {} : removeNotification}
                        />
                    );
                return (
                    <HUDWidget
                        id="notifications"
                        position={widget.position}
                        visible={widget.visible}
                        scale={widget.scale}
                        editMode={editMode}
                        snapToGrid={snapToGrid}
                        gridSize={gridSize}
                        onPositionChange={updateWidgetPosition}
                        onScaleChange={updateWidgetScale}
                        onReset={resetWidget}>
                        <NotificationContainer
                            notifications={displayedNotifications}
                            onClose={isUsingEditDemoNotifications ? () => {} : removeNotification}
                            isWidget
                        />
                    </HUDWidget>
                );
            })()}

            {/* Edit Mode Button + Menu (Radix Popover) */}
            {editMode && (
                <Popover
                    open={editMenuOpen}
                    onOpenChange={(open) => {
                        setEditMenuOpen(open);
                    }}>
                    <PopoverTrigger asChild>
                        <button
                            className="fixed top-4 right-4 pointer-events-auto bg-background/80 border border-primary/30 rounded-lg p-2 hover:bg-primary/20 transition-colors z-40"
                            style={{
                                boxShadow: "0 0 15px hsl(var(--primary) / 0.4)",
                            }}>
                            <Settings
                                size={18}
                                className={"text-primary"}
                                style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                            />
                        </button>
                    </PopoverTrigger>

                    {/* Menu content */}
                    <EditModeOverlay
                        snapToGrid={snapToGrid}
                        showDeathScreen={showDeathScreenPreview}
                        statusDesign={statusDesign}
                        speedometerType={speedometerType}
                        minimapShape={minimapShape}
                        onSnapToGridChange={setSnapToGrid}
                        onShowDeathScreenChange={setShowDeathScreenPreview}
                        onStatusDesignChange={setStatusDesign}
                        onSpeedometerTypeChange={setSpeedometerType}
                        onMinimapShapeChange={setMinimapShape}
                        onReset={resetLayout}
                        onExitEditMode={exitEditMode}
                    />
                </Popover>
            )}

            {/* Demo Mode Badge */}
            {isDemoMode && !editMode && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-destructive/80 border border-destructive/50 rounded-lg px-4 py-2 animate-fade-in-up pointer-events-auto">
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-destructive-foreground font-semibold">Demo Modus</span>
                                <span className="flex flex-col text-xs text-destructive-foreground/80 uppercase tracking-wider hud-text">
                                    <span>Vehicle: V (Typ: 1︱2︱3︱4)</span>
                                    <span>Voice: R | Edit: E | Death: D</span>
                                    <span>Notify: H︱J︱K︱L</span>
                                    <span>Chat: T | TeamChat: Y</span>
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    setDeathState((prev) => ({
                                        ...prev,
                                        isDead: !prev.isDead,
                                        respawnTimer: 14,
                                        waitTimer: 59,
                                        canCallHelp: true,
                                        canRespawn: false,
                                    }))
                                }
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    deathState.isDead
                                        ? "bg-critical/80 text-white border border-critical"
                                        : "bg-background/30 text-destructive-foreground/80 border border-destructive-foreground/30 hover:bg-background/50"
                                )}>
                                {deathState.isDead ? "Revive (D)" : "Death (D)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Widgets - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                statusTypes.map((type) => {
                    const widget = getWidget(type);
                    if (!widget) return null;
                    const value = hudState[type] ?? 100;

                    // Oxygen: Only show in water (or in edit mode)
                    if (type === "oxygen" && !editMode) {
                        if (hudState.showOxygen === false) return null;
                    }
                    
                    return (
                        <HUDWidget
                            key={type}
                            id={type}
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <StatusWidget
                                type={type}
                                value={value}
                                design={statusDesign}
                            />
                        </HUDWidget>
                    );
                })}

            {/* Money Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("money");
                    if (!widget) return null;
                    return (
                        <HUDWidget
                            id="money"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <NeonMoneyWidget
                                money={moneyState}
                                player={playerState}
                            />
                        </HUDWidget>
                    );
                })()}

            {/* Clock Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("clock");
                    if (!widget) return null;
                    return (
                        <HUDWidget
                            id="clock"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <ClockWidget />
                        </HUDWidget>
                    );
                })()}

            {/* Voice Widget - hidden when dead, death preview active, OR no voice system detected */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (isDemoMode || isVoiceEnabled) &&
                (() => {
                    const widget = getWidget("voice");
                    if (!widget) return null;
                    return (
                        <HUDWidget
                            id="voice"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <NeonVoiceWidget voice={voiceState} />
                        </HUDWidget>
                    );
                })()}

            {/* Minimap Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("minimap");
                    if (!widget) return null;
                    return (
                        <HUDWidget
                            id="minimap"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <NeonMinimapWidget
                                location={locationState}
                                shape={minimapShape}
                            />
                        </HUDWidget>
                    );
                })()}

            {/* Compass Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("compass");
                    if (!widget) return null;
                    return (
                        <HUDWidget
                            id="compass"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <CompassWidget heading={locationState.heading} />
                        </HUDWidget>
                    );
                })()}

            {/* Vehicle Speedometer - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("speedometer");
                    if (!widget) return null;

                    // Use the config for the currently active speedometer type
                    // Map unknown types to 'car' as fallback
                    const rawType = editMode ? speedometerType : vehicleState.vehicleType;
                    const validTypes = ["car", "plane", "boat", "helicopter", "motorcycle", "bicycle"] as const;
                    const activeType = validTypes.includes(rawType as typeof validTypes[number]) 
                        ? (rawType as typeof validTypes[number])
                        : "car";
                    const currentConfig = getSpeedometerConfig(activeType);

                    return (
                        <HUDWidget
                            id={`speedometer-${activeType}`}
                            position={currentConfig.position}
                            visible={widget.visible && (vehicleState.inVehicle || editMode)}
                            scale={currentConfig.scale}
                            editMode={editMode}
                            snapToGrid={snapToGrid}
                            gridSize={gridSize}
                            onPositionChange={(id, position) => {
                                updateSpeedometerConfig(activeType, { position });
                            }}
                            onVisibilityToggle={() => toggleWidgetVisibility("speedometer")}
                            onScaleChange={(id, scale) => {
                                updateSpeedometerConfig(activeType, { scale });
                            }}
                            onReset={() => {
                                resetSpeedometer(activeType);
                            }}>
                            <VehicleHUDFactory
                                vehicle={editMode ? { ...vehicleState, vehicleType: speedometerType } : vehicleState}
                                visible={vehicleState.inVehicle || editMode}
                            />
                        </HUDWidget>
                    );
                })()}

            {/* Death Screen Widget - in edit mode, respect the preview toggle; outside edit mode, show when dead */}
            {(() => {
                const widget = getWidget("deathscreen");
                if (!widget) return null;

                // In edit mode: only show if preview is enabled (regardless of actual death state)
                // Outside edit mode: show when actually dead
                const showDeathScreen = editMode ? showDeathScreenPreview : deathState.isDead;

                // Don't render anything if death screen shouldn't be shown
                if (!showDeathScreen) return null;

                return (
                    <HUDWidget
                        id="deathscreen"
                        position={widget.position}
                        visible={true}
                        scale={widget.scale}
                        editMode={editMode}
                        snapToGrid={snapToGrid}
                        gridSize={gridSize}
                        onPositionChange={updateWidgetPosition}
                        onScaleChange={updateWidgetScale}
                        onReset={resetWidget}>
                        <DeathScreenWidget
                            death={editMode ? { ...DEMO_DEATH, isDead: true } : deathState}
                            visible={true}
                            isWidget
                        />
                    </HUDWidget>
                );
            })()}

            {/* Chat Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("chat");
                    if (!widget) return null;

                    // In NUI mode, respect isVisible/isOpen state. In demo, use isOpen
                    const showChat = isDemoMode
                        ? chatState.isOpen || editMode
                        : chatState.isVisible || chatState.isOpen || editMode;
                    if (!showChat && !editMode) return null;

                    return (
                        <HUDWidget
                            id="chat"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <ChatWidget
                                chat={chatState}
                                isOpen={chatState.isOpen || editMode}
                                onSendMessage={(msg) => {
                                    if (isDemoMode) {
                                        // Demo mode: add message locally
                                        const newMsg = {
                                            id: Date.now().toString(),
                                            type: "normal" as const,
                                            sender: "Du",
                                            message: msg,
                                            timestamp: new Date().toLocaleTimeString("de-DE", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }),
                                        };
                                        setChatState((prev) => ({
                                            ...prev,
                                            messages: [...prev.messages, newMsg],
                                        }));
                                    } else {
                                        // FiveM: send to server via NUI callback
                                        sendNuiCallback("sendChatMessage", { message: msg });
                                    }
                                }}
                                onClose={() => {
                                    if (isDemoMode) {
                                        setChatState((prev) => ({ ...prev, isOpen: false }));
                                    } else {
                                        sendNuiCallback("closeChat");
                                    }
                                }}
                            />
                        </HUDWidget>
                    );
                })()}

            {/* Team Chat Widget - hidden when dead OR when death preview is active in edit mode */}
            {(editMode ? !showDeathScreenPreview : !deathState.isDead) &&
                (() => {
                    const widget = getWidget("teamchat");
                    if (!widget) return null;

                    // In NUI mode, respect isVisible/isOpen state. In demo, use isOpen
                    const showTeamChat = isDemoMode
                        ? teamChatState.isOpen || editMode
                        : teamChatState.isVisible || teamChatState.isOpen || editMode;
                    if (!showTeamChat && !editMode) return null;

                    return (
                        <HUDWidget
                            id="teamchat"
                            position={widget.position}
                            visible={widget.visible}
                            scale={widget.scale}
                            {...widgetProps}>
                            <TeamChatWidget
                                teamChat={teamChatState}
                                isOpen={teamChatState.isOpen || editMode}
                                onSendMessage={(msg) => {
                                    if (isDemoMode) {
                                        // Demo mode: add message locally
                                        const newMsg = {
                                            id: Date.now().toString(),
                                            sender: "Du",
                                            rank: "Admin",
                                            message: msg,
                                            timestamp: new Date().toLocaleTimeString("de-DE", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }),
                                        };
                                        setTeamChatState((prev) => ({
                                            ...prev,
                                            messages: [...prev.messages, newMsg],
                                        }));
                                    } else {
                                        // FiveM: send to server via NUI callback
                                        sendNuiCallback("sendTeamChatMessage", { message: msg });
                                    }
                                }}
                                onClose={() => {
                                    if (isDemoMode) {
                                        setTeamChatState((prev) => ({ ...prev, isOpen: false }));
                                    } else {
                                        sendNuiCallback("closeTeamChat");
                                    }
                                }}
                            />
                        </HUDWidget>
                    );
                })()}
        </div>
    );
};
