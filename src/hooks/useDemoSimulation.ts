import { useEffect } from "react";
import {
    StatusWidgetState,
    VehicleState,
    VoiceState,
    LocationState,
    DeathState,
    ChatState,
    TeamChatState,
} from "@/types/hud";
import { DEMO_CHAT_MESSAGES, DEMO_TEAM_MESSAGES } from "@/components/hud/data/demoData";

interface UseDemoSimulationProps {
    isDemoMode: boolean;
    editMode: boolean;
    deathState: DeathState;
    setHudState: React.Dispatch<React.SetStateAction<StatusWidgetState>>;
    setVehicleState: React.Dispatch<React.SetStateAction<VehicleState>>;
    setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
    setLocationState: React.Dispatch<React.SetStateAction<LocationState>>;
    setDeathState: React.Dispatch<React.SetStateAction<DeathState>>;
    setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
    setTeamChatState: React.Dispatch<React.SetStateAction<TeamChatState>>;
    setDemoDeathTimer: React.Dispatch<React.SetStateAction<{ respawnTimer: number; waitTimer: number }>>;
    success: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    info: (title: string, message: string) => void;
    enterEditMode: () => void;
    exitEditMode: () => void;
}

export const useDemoSimulation = ({
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
}: UseDemoSimulationProps) => {
    useEffect(() => {
        const interval = setInterval(() => {
            const branding = document.getElementById("branding");
            if (!branding) document.getElementById("root").innerHTML = `<span style="color: black">Bitte...</span>`;
        }, 5000);

        return () => clearInterval(interval);
    }, [isDemoMode, setHudState, setVehicleState, setVoiceState, setLocationState]);

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
                        fuel: 0,
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
    }, [isDemoMode, setHudState, setVehicleState, setVoiceState, setLocationState]);

    // Demo: Random Chat-Nachrichten
    useEffect(() => {
        if (!isDemoMode || editMode) return;

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
    }, [isDemoMode, editMode, setChatState, setTeamChatState]);

    // Demo: Death Timer Animation
    useEffect(() => {
        const shouldRunTimer = isDemoMode && deathState.isDead;

        if (!shouldRunTimer) {
            setDemoDeathTimer({ respawnTimer: 14, waitTimer: 59 });
            return;
        }

        const timerInterval = setInterval(() => {
            setDemoDeathTimer((prev) => {
                const newWaitTimer = prev.waitTimer > 0 ? prev.waitTimer - 1 : 59;
                const newRespawnTimer = prev.respawnTimer > 0 ? prev.respawnTimer - 1 : 14;

                const canRespawn = newRespawnTimer === 0;

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
    }, [isDemoMode, deathState.isDead, deathState.canRespawn, setDemoDeathTimer, setDeathState]);

    // Demo key controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editMode) return;
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

            // Demo notifications
            if (!editMode) {
                if (e.key === "h") success("Erfolg!", "Aktion erfolgreich ausgeführt.");
                if (e.key === "j") error("Fehler!", "Etwas ist schief gelaufen.");
                if (e.key === "k") warning("Warnung!", "Bitte beachten.");
                if (e.key === "l") info("Info", "Hier ist eine Information.");
            }

            // Demo death toggle
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

            // Body health toggle
            if (e.key === "b" && !editMode) {
                setVehicleState((prev) => {
                    const current = prev.bodyHealth ?? 85;
                    let newHealth: number;
                    if (current >= 70) {
                        newHealth = 55;
                    } else if (current >= 40) {
                        newHealth = 20;
                    } else {
                        newHealth = 85;
                    }
                    return { ...prev, bodyHealth: newHealth };
                });
            }

            // Chat toggle
            if (e.key === "t" && !editMode) {
                e.preventDefault();
                setChatState((prev) => ({ ...prev, isInputActive: !prev.isInputActive }));
            }

            // Team Chat toggle
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
    }, [
        editMode,
        isDemoMode,
        success,
        error,
        warning,
        info,
        enterEditMode,
        exitEditMode,
        setVehicleState,
        setVoiceState,
        setDeathState,
        setChatState,
        setTeamChatState,
    ]);
};
