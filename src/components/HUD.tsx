import { useState, useEffect, useCallback, useRef } from "react";
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
import {
    HeliBaseWidget,
    HeliKtsWidget,
    HeliAltitudeWidget,
    HeliVSpeedWidget,
    HeliHeadingWidget,
    HeliRotorWidget,
    HeliFuelWidget,
    HeliWarningWidget,
} from "./hud/widgets/vehicles/helicopter";
import { useHUDLayout } from "@/hooks/useHUDLayout";
import { useNuiEvents, isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/contexts/LanguageContext";
import {
    StatusWidgetState,
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
    RadioState,
    DisabledWidgets,
} from "@/types/hud";
import { WidgetType, VEHICLE_WIDGET_TYPES, HELI_SUBWIDGET_TYPES, SpeedometerType } from "@/types/widget";
import { FullscreenDeathScreen } from "./hud/FullscreenDeathScreen";
import { SelectionBox } from "./hud/SelectionBox";
import { motion } from "framer-motion";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { MinimapWidget } from "./hud/widgets/MinimapWidget";
import { WidgetPosition } from "@/types/widget";
import {
    getWidgetElement,
    getWidgetDOMPosition,
    setWidgetDOMPosition,
    calcGroupClampAdjust,
    isWidgetVisible,
} from "@/lib/widgetUtils";

// Demo values
const DEMO_HUD: StatusWidgetState = {
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
    bodyHealth: 85, // Good condition (85%) - press B to cycle through states
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
    isInputActive: false,
    isVisible: false,
    messages: [],
    unreadCount: 0,
};

// Demo Team Chat State (leer in Production - wird von FiveM befüllt)
const DEMO_TEAM_CHAT: TeamChatState = {
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

// Demo Radio State
const DEMO_RADIO: RadioState = {
    active: false,
    channel: "Kanal 1",
    members: [],
};

const DEMO_RADIO_ENABLED: RadioState = {
    active: true,
    channel: "Kanal 1",
    members: [
        { id: 1, name: "Max Mustermann", talking: true },
        { id: 2, name: "Anna Schmidt", talking: false },
        { id: 3, name: "Tom Weber", talking: false },
    ],
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
        message: "Diese Notification ist nur im Edit Mode sichtbar.",
        duration: 0,
    },
    {
        id: "edit-demo-2",
        type: "warning",
        title: "Warnung",
        message: "Zieh mich an die gewünschte Position.",
        duration: 0,
    },
    {
        id: "edit-demo-3",
        type: "error",
        title: "Wichtig",
        message: "Dies ist die letzte Notifikation",
        duration: 0,
    },
];

export const HUD = () => {
    const [hudState, setHudState] = useState<StatusWidgetState>(DEMO_HUD);
    const [vehicleState, setVehicleState] = useState<VehicleState>(DEMO_VEHICLE);
    const [moneyState, setMoneyState] = useState<MoneyState>(DEMO_MONEY);
    const [playerState, setPlayerState] = useState<PlayerState>(DEMO_PLAYER);
    const [voiceState, setVoiceState] = useState<VoiceState>(DEMO_VOICE);
    const [locationState, setLocationState] = useState<LocationState>(DEMO_LOCATION);
    const [deathState, setDeathState] = useState<DeathState>(DEMO_DEATH);
    const [chatState, setChatState] = useState<ChatState>(DEMO_CHAT);
    const [teamChatState, setTeamChatState] = useState<TeamChatState>(DEMO_TEAM_CHAT);
    const [radioState, setRadioState] = useState<RadioState>(DEMO_RADIO);
    const [disabledWidgets, setDisabledWidgets] = useState<DisabledWidgets>({});
    const [demoDeathTimer, setDemoDeathTimer] = useState({ respawnTimer: 14, waitTimer: 59 });
    const [isVisible, setIsVisible] = useState(!isNuiEnvironment());
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(!isNuiEnvironment());
    const [isDemoMode] = useState(!isNuiEnvironment());
    const [editMenuOpen, setEditMenuOpen] = useState(false);

    // Multi-selection state
    const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
    const widgetStartPositionsRef = useRef<Map<string, WidgetPosition>>(new Map());

    const {
        widgets,
        editMode,
        snapToGrid,
        gridSize,
        statusDesign,
        speedometerType,
        minimapShape,
        heliSimpleMode,
        widgetsDistributed,
        autoLayoutHiddenIds,
        toggleEditMode,
        setSnapToGrid,
        setStatusDesign,
        setSpeedometerType,
        setMinimapShape,
        setHeliSimpleMode,
        updateWidgetPosition,
        updateWidgetScale,
        toggleWidgetVisibility,
        resetLayout,
        resetWidget,
        getWidget,
        distributeWidgets,
    } = useHUDLayout();

    const isWidgetDisabled = (widgetId: string): boolean => {
        return disabledWidgets[widgetId as WidgetType] === true;
    };

    const { t, isLoaded: isLanguageLoaded } = useTranslation();

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
        sendNuiCallback("saveLayout", { widgets });

        // Tell Lua to close edit mode (reset NUI focus)
        sendNuiCallback("closeEditMode");

        setTimeout(() => {
            if (editMode) toggleEditMode();
        }, 50);
    };

    useEffect(() => {
        if (!editMode) setEditMenuOpen(false);
    }, [editMode]);

    // Send AllThingsLoaded when all async data is loaded AND HUD is visible
    const allDataLoaded = isVisible && isLanguageLoaded && t !== null;
    const [hasSignaledReady, setHasSignaledReady] = useState(false);

    useEffect(() => {
        if (allDataLoaded && !hasSignaledReady) {
            // Double requestAnimationFrame ensures DOM is fully painted
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Distribute widgets to their correct positions via DOM
                    if (!widgetsDistributed) {
                        distributeWidgets(isWidgetDisabled, false);
                    }

                    console.log("[HUD] AllThingsLoaded - all data loaded and DOM rendered");
                    sendNuiCallback("AllThingsLoaded");
                    setHasSignaledReady(true);
                });
            });
        }
    }, [allDataLoaded, hasSignaledReady, widgetsDistributed, distributeWidgets, hudState]);

    // NUI Event handlers
    useNuiEvents({
        onUpdateHud: (data) => setHudState((prev) => ({ ...prev, ...data })),
        onUpdateVehicle: setVehicleState,
        onUpdateMoney: setMoneyState,
        onUpdateVoice: setVoiceState,
        onUpdateRadio: setRadioState,
        onUpdateLocation: setLocationState,
        onUpdatePlayer: setPlayerState,
        onSetVisible: setIsVisible,
        onUpdateDeath: setDeathState,
        onUpdateDisabledWidgets: setDisabledWidgets,
        onSetVoiceEnabled: setIsVoiceEnabled,
        onToggleEditMode: (enabled) => {
            if (enabled && !editMode) toggleEditMode();
            else if (!enabled && editMode) toggleEditMode();
        },
        onNotify: (data) => {
            const notifyFn = { success, error, warning, info }[data.type] || info;
            notifyFn(data.title, data.message, data.duration);
        },
        onChatUpdate: (data) => {
            setChatState((prev) => {
                const nextState = { ...prev };

                if (typeof data.isInputActive === "boolean") {
                    nextState.isInputActive = data.isInputActive;
                }
                if (data.message) {
                    // Generate timestamp in JS for accurate local time
                    const messageWithJsTimestamp = {
                        ...data.message,
                        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                    };
                    nextState.messages = [...prev.messages, messageWithJsTimestamp].slice(-50);
                }
                if (data.clearChat) {
                    nextState.messages = [];
                    nextState.unreadCount = 0;
                }

                return nextState;
            });
        },
        onTeamChatUpdate: (data) => {
            setTeamChatState((prev) => {
                const nextState = { ...prev };

                if (typeof data.isInputActive === "boolean") {
                    nextState.isInputActive = data.isInputActive;
                }

                if (typeof data.hasAccess === "boolean") {
                    nextState.hasAccess = data.hasAccess;
                }

                if (data.teamType) {
                    nextState.teamType = data.teamType;
                }

                if (data.teamName) {
                    nextState.teamName = data.teamName;
                }

                if (typeof data.onlineMembers === "number") {
                    nextState.onlineMembers = data.onlineMembers;
                }

                if (typeof data.isAdmin === "boolean") {
                    nextState.isAdmin = data.isAdmin;
                }

                if (data.message) {
                    // Generate timestamp in JS for accurate local time
                    const messageWithJsTimestamp = {
                        ...data.message,
                        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                    };
                    nextState.messages = [...prev.messages, messageWithJsTimestamp].slice(-50);
                }

                if (data.clearChat) {
                    nextState.messages = [];
                    nextState.unreadCount = 0;
                }

                return nextState;
            });
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

                if (prev.vehicleType === "motorcycle") {
                    return {
                        ...baseUpdate,
                        speed: prev.inVehicle ? Math.min(220, Math.max(0, prev.speed + (Math.random() - 0.5) * 25)) : 0,
                        gear: Math.max(1, Math.min(6, Math.floor((prev.speed || 0) / 35) + 1)),
                    };
                }

                if (prev.vehicleType === "bicycle") {
                    return {
                        ...baseUpdate,
                        speed: prev.inVehicle ? Math.min(50, Math.max(0, prev.speed + (Math.random() - 0.5) * 8)) : 0,
                        fuel: 0, // Fahrrad hat keinen Kraftstoff
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

    // Demo: Death Timer Animation (countdown when death preview is active in edit mode OR when dead in demo mode)
    // Works in both demo mode and FiveM when edit mode death preview is enabled
    useEffect(() => {
        const shouldRunTimer = isDemoMode && deathState.isDead;

        if (!shouldRunTimer) {
            // Reset timer when preview is turned off
            setDemoDeathTimer({ respawnTimer: 14, waitTimer: 59 });
            return;
        }

        const timerInterval = setInterval(() => {
            setDemoDeathTimer((prev) => {
                const newWaitTimer = prev.waitTimer > 0 ? prev.waitTimer - 1 : 59;
                const newRespawnTimer = prev.respawnTimer > 0 ? prev.respawnTimer - 1 : 14;

                // Check if respawn should be enabled
                const canRespawn = newRespawnTimer === 0;

                // Update death state for respawn button
                if (canRespawn && !deathState.canRespawn) {
                    setDeathState((d) => ({ ...d, canRespawn: true }));
                }

                return {
                    respawnTimer: newRespawnTimer,
                    waitTimer: newWaitTimer,
                };
            });
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [editMode, deathState.canRespawn, isDemoMode, deathState.isDead]);

    // Demo key controls + ESC to exit edit mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editMode) return;
            // ESC or F7 to exit edit mode
            if (e.key === "Escape" || e.key === "F7") {
                e.preventDefault();
                exitEditMode();
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        if (!isDemoMode) {
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
            };
        }

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
            if (e.key === "5")
                setVehicleState((prev) => ({
                    ...prev,
                    vehicleType: "motorcycle",
                    speed: 95,
                    gear: 3,
                    fuel: 70,
                }));
            if (e.key === "6")
                setVehicleState((prev) => ({
                    ...prev,
                    vehicleType: "bicycle",
                    speed: 22,
                    gear: 1,
                    fuel: 0,
                }));

            // Demo notifications - only in demo mode, NOT in edit mode
            if (!editMode) {
                if (e.key === "h") success("Erfolg!", "Aktion erfolgreich ausgeführt.");
                if (e.key === "j") error("Fehler!", "Etwas ist schief gelaufen.");
                if (e.key === "k") warning("Warnung!", "Bitte beachten.");
                if (e.key === "l") info("Info", "Hier ist eine Information.");
            }

            // Demo death toggle - only when NOT in edit mode
            if (e.key === "f" && !editMode) {
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

            // Body health toggle - B key (cycles: good -> warning -> critical -> good)
            if (e.key === "b" && !editMode) {
                setVehicleState((prev) => {
                    const current = prev.bodyHealth ?? 85;
                    // Cycle through: good (85%) -> warning (55%) -> critical (20%) -> good (85%)
                    let newHealth: number;
                    if (current >= 70) {
                        newHealth = 55; // Switch to warning
                    } else if (current >= 40) {
                        newHealth = 20; // Switch to critical
                    } else {
                        newHealth = 85; // Switch to good
                    }
                    return { ...prev, bodyHealth: newHealth };
                });
            }

            // Chat toggle - T key
            if (e.key === "t" && !editMode) {
                e.preventDefault();
                setChatState((prev) => ({ ...prev, isInputActive: !prev.isInputActive }));
            }

            // Team Chat toggle - Y key
            if (e.key === "y" && !editMode) {
                e.preventDefault();
                setTeamChatState((prev) => ({ ...prev, isInputActive: !prev.isInputActive }));
            }
        };

        window.addEventListener("keypress", handleKeyPress);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keypress", handleKeyPress);
        };
    }, [editMode, isDemoMode, success, error, warning, info, enterEditMode, exitEditMode]);

    // Multi-selection handlers
    const handleWidgetSelect = useCallback((id: string, addToSelection: boolean) => {
        setSelectedWidgets((prev) => {
            const next = new Set(prev);
            if (addToSelection) {
                // Ctrl/Cmd click - toggle selection
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
            } else {
                // Normal click - clear selection (no highlighting for single widget interaction)
                if (!next.has(id)) {
                    next.clear();
                }
            }
            return next;
        });
    }, []);

    const handleWidgetDragStart = useCallback(
        (id: string, startPos: WidgetPosition) => {
            // Store starting positions for all selected widgets
            widgetStartPositionsRef.current.clear();
            selectedWidgets.forEach((widgetId) => {
                const widget = getWidget(widgetId);
                if (widget) {
                    widgetStartPositionsRef.current.set(widgetId, { ...widget.position });
                }
            });
        },
        [selectedWidgets, getWidget]
    );

    const handleWidgetDragMove = useCallback((deltaX: number, deltaY: number) => {
        const widgetIds = Array.from(widgetStartPositionsRef.current.keys());
        const getNewPos = (id: string) => {
            const start = widgetStartPositionsRef.current.get(id);
            return start ? { x: start.x + deltaX, y: start.y + deltaY } : null;
        };

        const { adjustX, adjustY } = calcGroupClampAdjust(widgetIds, getNewPos);

        widgetIds.forEach((id) => {
            const pos = getNewPos(id);
            if (pos) setWidgetDOMPosition(id, { x: pos.x + adjustX, y: pos.y + adjustY });
        });
    }, []);

    const handleWidgetDragEnd = useCallback(() => {
        widgetStartPositionsRef.current.forEach((_, id) => {
            const pos = getWidgetDOMPosition(id);
            if (pos) updateWidgetPosition(id, pos);
        });
        widgetStartPositionsRef.current.clear();
    }, [updateWidgetPosition]);

    // Selection box handlers
    const handleSelectionStart = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode) return;
            // Only start selection if clicking on empty area (not on a widget)
            if ((e.target as HTMLElement).closest('[id^="hud-widget-"]')) return;

            e.preventDefault();
            setIsSelecting(true);
            selectionStartRef.current = { x: e.clientX, y: e.clientY };
            setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });

            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey) {
                setSelectedWidgets(new Set());
            }
        },
        [editMode]
    );

    const handleSelectionMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isSelecting || !selectionStartRef.current) return;

            setSelectionBox({
                startX: selectionStartRef.current.x,
                startY: selectionStartRef.current.y,
                endX: e.clientX,
                endY: e.clientY,
            });
        },
        [isSelecting]
    );

    const handleSelectionEnd = useCallback(() => {
        if (!isSelecting || !selectionBox) {
            setIsSelecting(false);
            setSelectionBox(null);
            return;
        }

        // Calculate selection rectangle
        const left = Math.min(selectionBox.startX, selectionBox.endX);
        const right = Math.max(selectionBox.startX, selectionBox.endX);
        const top = Math.min(selectionBox.startY, selectionBox.endY);
        const bottom = Math.max(selectionBox.startY, selectionBox.endY);

        // Find all widgets within selection
        const newSelection = new Set(selectedWidgets);
        widgets.forEach((widget) => {
            if (!isWidgetVisible(widget.id)) return;

            const el = getWidgetElement(widget.id);
            if (!el) return;

            const rect = el.getBoundingClientRect();
            if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) {
                newSelection.add(widget.id);
            }
        });

        setSelectedWidgets(newSelection);
        setIsSelecting(false);
        setSelectionBox(null);
        selectionStartRef.current = null;
    }, [isSelecting, selectionBox, widgets, selectedWidgets]);

    // Clear selection when exiting edit mode
    useEffect(() => {
        if (!editMode) {
            setSelectedWidgets(new Set());
        }
    }, [editMode]);

    const widgetProps = {
        editMode,
        snapToGrid,
        gridSize,
        onPositionChange: updateWidgetPosition,
        onVisibilityToggle: toggleWidgetVisibility,
        onScaleChange: updateWidgetScale,
        onReset: (id: string) => resetWidget(id, isWidgetDisabled, hasSignaledReady),
    };

    // Enhanced widget props with multi-selection support
    const getMultiSelectProps = (id: string) => ({
        isSelected: selectedWidgets.has(id),
        onSelect: handleWidgetSelect,
        onDragStart: selectedWidgets.has(id) ? handleWidgetDragStart : undefined,
        onDragMove: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragMove : undefined,
        onDragEnd: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragEnd : undefined,
        onClearSelection: () => setSelectedWidgets(new Set()),
    });

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
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}>
                            <Settings
                                size={18}
                                className={"text-primary"}
                                style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                            />
                        </button>
                    </PopoverTrigger>

                    <EditModeOverlay
                        snapToGrid={snapToGrid}
                        statusDesign={statusDesign}
                        speedometerType={speedometerType}
                        minimapShape={minimapShape}
                        heliSimpleMode={heliSimpleMode}
                        onSnapToGridChange={setSnapToGrid}
                        onStatusDesignChange={(design) => setStatusDesign(design, isWidgetDisabled)}
                        onSpeedometerTypeChange={setSpeedometerType}
                        onMinimapShapeChange={(shape) => setMinimapShape(shape, isWidgetDisabled)}
                        onHeliSimpleModeChange={setHeliSimpleMode}
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
                            {/* Permission Toggles */}
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

                const value = hudState[type] ?? 100;

                // Special visibility logic for oxygen: only show when underwater or in edit mode
                const isOxygenHidden = type === "oxygen" && !editMode && !hudState.isUnderwater;

                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead) && !isOxygenHidden;
                const isVisible = baseVisible;

                return (
                    <HUDWidget
                        key={type}
                        id={type}
                        position={widget.position}
                        visible={isVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        suspended={autoLayoutHiddenIds.includes(type)}
                        {...widgetProps}
                        {...getMultiSelectProps(type)}>
                        <StatusWidget
                            type={type}
                            value={value}
                            design={statusDesign}
                        />
                    </HUDWidget>
                );
            })}

            {/* Money Widget */}
            {(() => {
                const widget = getWidget("money");
                if (!widget) return null;

                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
                        <MoneyWidget
                            money={moneyState}
                            player={playerState}
                        />
                    </HUDWidget>
                );
            })()}

            {/* Clock Widget */}
            {(() => {
                const widget = getWidget("clock");
                if (!widget) return null;

                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
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
                const isVisible = widget.visible && baseVisible && voiceAvailable;

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={isVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        suspended={autoLayoutHiddenIds.includes(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
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
                const isVisible = widget.visible && baseVisible && voiceAvailable && showRadio;

                // Demo data for edit mode
                const radioData = editMode && !radioState.active ? DEMO_RADIO_ENABLED : radioState;

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={isVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
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
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        suspended={autoLayoutHiddenIds.includes(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
                        <LocationWidget
                            location={locationState}
                            shape={minimapShape}
                        />
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
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
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
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
                        <VehicleNameWidget
                            vehicleType={editMode ? speedometerType : vehicleState.vehicleType}
                            vehicleName={vehicleState.vehicleName}
                            vehicleSpawnName={vehicleState.vehicleSpawnName}
                            inVehicle={vehicleState.inVehicle}
                            editMode={editMode}
                        />
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
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        suspended={autoLayoutHiddenIds.includes(widget.id)}
                        {...widgetProps}
                        onPositionChange={undefined}
                        onScaleChange={undefined}>
                        <MinimapWidget shape={minimapShape} />
                    </HUDWidget>
                );
            })()}

            {/* Vehicle Speedometers */}
            {VEHICLE_WIDGET_TYPES.map((widgetType) => {
                const widget = getWidget(widgetType);
                if (!widget) return null;

                // Extract vehicle type from widget id (e.g., "speedometer-car" -> "car")
                const vehicleType = widgetType.replace("speedometer-", "") as SpeedometerType;

                const baseVisible = editMode ? true : !deathState.isDead;
                const correctVehicle = editMode
                    ? speedometerType === vehicleType
                    : vehicleState.inVehicle && vehicleState.vehicleType === vehicleType;

                const shouldShow = widget.visible && baseVisible && correctVehicle;

                return (
                    <HUDWidget
                        key={widgetType}
                        id={widget.id}
                        position={widget.position}
                        hasAccess={correctVehicle}
                        visible={shouldShow}
                        scale={widget.scale}
                        editMode={editMode}
                        snapToGrid={snapToGrid}
                        gridSize={gridSize}
                        onPositionChange={updateWidgetPosition}
                        onVisibilityToggle={() => toggleWidgetVisibility(widgetType)}
                        onScaleChange={updateWidgetScale}
                        onReset={() => resetWidget(widgetType, isWidgetDisabled, hasSignaledReady)}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...getMultiSelectProps(widget.id)}>
                        <VehicleHUDFactory
                            vehicle={{ ...vehicleState, vehicleType }}
                            visible={baseVisible && correctVehicle && (editMode ? true : widget.visible)}
                        />
                    </HUDWidget>
                );
            })}

            {/* Helicopter Subwidgets - Separate movable widgets for helicopter HUD elements */}
            {(() => {
                return HELI_SUBWIDGET_TYPES.map((widgetType) => {
                    const widget = getWidget(widgetType);
                    if (!widget) return null;

                    const isHelicopter = editMode
                        ? speedometerType === "helicopter"
                        : vehicleState.inVehicle && vehicleState.vehicleType === "helicopter";

                    const baseVisible = editMode ? true : !deathState.isDead;
                    const shouldShow = widget.visible && baseVisible && isHelicopter;

                    // Get vehicle data
                    const airspeed = vehicleState.airspeed || vehicleState.speed;
                    const altitude = vehicleState.altitude || 0;
                    const verticalSpeed = vehicleState.verticalSpeed || 0;
                    const heading = vehicleState.heading || 0;
                    const rotorRpm = vehicleState.rotorRpm || 100;
                    const fuel = vehicleState.fuel;
                    const bodyHealth = vehicleState.bodyHealth;

                    // Render the appropriate widget content based on type
                    const renderWidgetContent = () => {
                        switch (widgetType) {
                            case "heli-base":
                                return (
                                    <HeliBaseWidget
                                        vehicle={vehicleState}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-kts":
                                return (
                                    <HeliKtsWidget
                                        airspeed={airspeed}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-altitude":
                                return (
                                    <HeliAltitudeWidget
                                        altitude={altitude}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-vspeed":
                                return (
                                    <HeliVSpeedWidget
                                        verticalSpeed={verticalSpeed}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-heading":
                                return (
                                    <HeliHeadingWidget
                                        heading={heading}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-rotor":
                                return (
                                    <HeliRotorWidget
                                        rotorRpm={rotorRpm}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-fuel":
                                return (
                                    <HeliFuelWidget
                                        fuel={fuel}
                                        visible={shouldShow}
                                    />
                                );
                            case "heli-warning":
                                return (
                                    <HeliWarningWidget
                                        bodyHealth={bodyHealth}
                                        visible={shouldShow}
                                    />
                                );
                            default:
                                return null;
                        }
                    };

                    // In Simple Mode: only heli-base is draggable, others follow
                    const isBaseWidget = widgetType === "heli-base";
                    const canDrag = !heliSimpleMode || isBaseWidget;

                    // Handle base widget position change - in simple mode, reset sub-widgets after drag
                    const handleBasePositionChange = (id: string, newPosition: WidgetPosition) => {
                        updateWidgetPosition(id, newPosition);

                        if (heliSimpleMode) {
                            // Reset all sub-widgets so they recalculate relative to new base position
                            HELI_SUBWIDGET_TYPES.forEach((subType) => {
                                if (subType === "heli-base") return;
                                resetWidget(subType, isWidgetDisabled, hasSignaledReady);
                            });
                        }
                    };

                    return (
                        <HUDWidget
                            key={widgetType}
                            id={widget.id}
                            position={widget.position}
                            hasAccess={isHelicopter}
                            visible={shouldShow}
                            scale={widget.scale}
                            editMode={editMode}
                            snapToGrid={snapToGrid}
                            gridSize={gridSize}
                            onPositionChange={
                                canDrag ? (isBaseWidget ? handleBasePositionChange : updateWidgetPosition) : undefined
                            }
                            onVisibilityToggle={canDrag ? () => toggleWidgetVisibility(widgetType) : undefined}
                            onScaleChange={canDrag ? updateWidgetScale : undefined}
                            onReset={canDrag ? (id) => resetWidget(id, isWidgetDisabled, hasSignaledReady) : undefined}
                            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                            {...(canDrag ? getMultiSelectProps(widget.id) : {})}>
                            {renderWidgetContent()}
                        </HUDWidget>
                    );
                });
            })()}

            {/* Chat Widget */}
            {(() => {
                const widget = getWidget("chat");
                if (!widget) return null;

                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={baseVisible}
                        scale={widget.scale}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
                        <ChatWidget
                            chat={chatState}
                            setChatState={setChatState}
                            editMode={editMode}
                            onSendMessage={(msg) => {
                                if (isDemoMode) {
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
                                        isInputActive: false,
                                        messages: [...prev.messages, newMsg],
                                    }));
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
                const isVisible = widget.visible && baseVisible;

                return (
                    <HUDWidget
                        id={widget.id}
                        position={widget.position}
                        visible={isVisible}
                        scale={widget.scale}
                        hasAccess={hasTeamAccess}
                        disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
                        {...widgetProps}
                        {...getMultiSelectProps(widget.id)}>
                        <TeamChatWidget
                            teamChat={teamChatState}
                            editMode={editMode}
                            onSendMessage={(msg) => {
                                if (isDemoMode) {
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
                                        isInputActive: false,
                                        messages: [...prev.messages, newMsg],
                                    }));
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

            {/* Fullscreen Death Screen - rendered outside widget system */}
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
