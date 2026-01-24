import { useEffect } from "react";
import { useStatusStore } from "@/stores/statusStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useVoiceStore } from "@/stores/voiceStore";
import { useLocationStore } from "@/stores/locationStore";
import { useChatStore } from "@/stores/chatStore";
import { useDeathStore } from "@/stores/deathStore";
import { useHUDGlobalStore } from "@/stores/hudStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUtilityStore } from "@/stores/utilityStore";
import { useKeybindsStore } from "@/stores/keybindsStore";
import { DEMO_CHAT_MESSAGES, DEMO_TEAM_MESSAGES } from "@/components/hud/data/demoData";
import { VehicleHealthStatus, VoiceState } from "@/types/hud";

interface UseStoreDemoSimulationProps {
    editMode: boolean;
    enterEditMode: () => void;
    exitEditMode: () => void;
}

/**
 * Demo simulation that updates stores directly.
 * Each store update triggers only the subscribed widgets.
 */
export const useStoreDemoSimulation = ({ editMode, enterEditMode, exitEditMode }: UseStoreDemoSimulationProps) => {
    const isDemoMode = useHUDGlobalStore((state) => state.isDemoMode);

    // Get store actions (stable references)
    const setStatus = useStatusStore((state) => state.setStatus);
    const setVehicleState = useVehicleStore((state) => state.setVehicleState);
    const setVoiceActive = useVoiceStore((state) => state.setVoiceActive);
    const setVoiceRange = useVoiceStore((state) => state.setVoiceRange);
    const setIsVoiceMuted = useVoiceStore((state) => state.setIsVoiceMuted);
    const setLocation = useLocationStore((state) => state.setLocation);
    const addChatMessage = useChatStore((state) => state.addChatMessage);
    const addTeamChatMessage = useChatStore((state) => state.addTeamChatMessage);
    const setChatInputActive = useChatStore((state) => state.setChatInputActive);
    const setTeamChatInputActive = useChatStore((state) => state.setTeamChatInputActive);
    const setTeamChatAccess = useChatStore((state) => state.setTeamChatAccess);
    const setTeamChatIsAdmin = useChatStore((state) => state.setTeamChatIsAdmin);
    const setDeathState = useDeathStore((state) => state.setDeathState);

    const setWantedLevel = useUtilityStore((state) => state.setWantedLevel);
    const setIsEvading = useUtilityStore((state) => state.setIsEvading);
    const notifySuccess = useNotificationStore((state) => state.success);
    const notifyError = useNotificationStore((state) => state.error);
    const notifyWarning = useNotificationStore((state) => state.warning);
    const notifyInfo = useNotificationStore((state) => state.info);

    const isCommandOnly = useChatStore((state) => state.chatCommandOnly);

    // Demo simulation with animated values - updates stores directly
    useEffect(() => {
        if (!isDemoMode) return;

        const interval = setInterval(() => {
            // Status updates - only status store subscribers re-render
            setStatus({
                hunger: Math.max(0, useStatusStore.getState().hunger - 0.1),
                thirst: Math.max(0, useStatusStore.getState().thirst - 0.15),
                stamina: Math.min(100, Math.max(0, useStatusStore.getState().stamina + (Math.random() - 0.5) * 5)),
            });

            // Vehicle updates - only vehicle store subscribers re-render
            const vehicleState = useVehicleStore.getState();
            const baseUpdate = {
                fuel: Math.max(0, vehicleState.fuel - 0.02),
            };

            if (vehicleState.vehicleType === "car") {
                setVehicleState({
                    ...baseUpdate,
                    speed: vehicleState.inVehicle
                        ? Math.min(280, Math.max(0, vehicleState.speed + (Math.random() - 0.5) * 20))
                        : 0,
                });
            } else if (vehicleState.vehicleType === "boat") {
                setVehicleState({
                    ...baseUpdate,
                    speed: vehicleState.inVehicle
                        ? Math.min(80, Math.max(0, vehicleState.speed + (Math.random() - 0.5) * 10))
                        : 0,
                    heading: ((vehicleState.heading || 0) + (Math.random() - 0.5) * 5 + 360) % 360,
                });
            } else if (vehicleState.vehicleType === "plane") {
                setVehicleState({
                    ...baseUpdate,
                    airspeed: Math.min(400, Math.max(150, (vehicleState.airspeed || 250) + (Math.random() - 0.5) * 30)),
                    altitude: Math.min(
                        2000,
                        Math.max(100, (vehicleState.altitude || 500) + (Math.random() - 0.5) * 50),
                    ),
                    pitch: Math.max(-30, Math.min(30, (vehicleState.pitch || 0) + (Math.random() - 0.5) * 5)),
                    roll: Math.max(-45, Math.min(45, (vehicleState.roll || 0) + (Math.random() - 0.5) * 8)),
                    heading: ((vehicleState.heading || 180) + (Math.random() - 0.5) * 3 + 360) % 360,
                    speed: Math.min(400, Math.max(150, (vehicleState.airspeed || 250) + (Math.random() - 0.5) * 30)),
                });
            } else if (vehicleState.vehicleType === "helicopter") {
                setVehicleState({
                    ...baseUpdate,
                    airspeed: Math.min(200, Math.max(0, (vehicleState.airspeed || 80) + (Math.random() - 0.5) * 20)),
                    altitude: Math.min(1000, Math.max(10, (vehicleState.altitude || 200) + (Math.random() - 0.5) * 30)),
                    pitch: Math.max(-20, Math.min(20, (vehicleState.pitch || 0) + (Math.random() - 0.5) * 4)),
                    roll: Math.max(-30, Math.min(30, (vehicleState.roll || 0) + (Math.random() - 0.5) * 6)),
                    heading: ((vehicleState.heading || 90) + (Math.random() - 0.5) * 5 + 360) % 360,
                    verticalSpeed: Math.max(
                        -20,
                        Math.min(20, (vehicleState.verticalSpeed || 5) + (Math.random() - 0.5) * 8),
                    ),
                    rotorRpm: Math.min(100, Math.max(70, (vehicleState.rotorRpm || 95) + (Math.random() - 0.5) * 5)),
                    speed: Math.min(200, Math.max(0, (vehicleState.airspeed || 80) + (Math.random() - 0.5) * 20)),
                });
            } else if (vehicleState.vehicleType === "motorcycle") {
                setVehicleState({
                    ...baseUpdate,
                    speed: vehicleState.inVehicle
                        ? Math.min(220, Math.max(0, vehicleState.speed + (Math.random() - 0.5) * 25))
                        : 0,
                    gear: Math.max(1, Math.min(6, Math.floor((vehicleState.speed || 0) / 35) + 1)),
                });
            } else if (vehicleState.vehicleType === "bicycle") {
                setVehicleState({
                    ...baseUpdate,
                    speed: vehicleState.inVehicle
                        ? Math.min(50, Math.max(0, vehicleState.speed + (Math.random() - 0.5) * 8))
                        : 0,
                    fuel: 0,
                });
            } else {
                setVehicleState(baseUpdate);
            }

            // Voice active toggle - only voice widget re-renders
            setVoiceActive(Math.random() > 0.3);

            // Location heading - only compass re-renders
            if (Math.random() > 0.75) {
                const currentHeading = useLocationStore.getState().heading ?? 0;
                const change = Math.random() > 0.5 ? 45 : -45;
                setLocation({ heading: (currentHeading + change + 360) % 360 });
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isDemoMode, setStatus, setVehicleState, setVoiceActive, setLocation]);

    // Demo: Random Chat messages
    useEffect(() => {
        if (!isDemoMode || editMode) return;

        const chatInterval = setInterval(() => {
            if (isCommandOnly) return;
            if (Math.random() > 0.5) {
                const randomMsg = DEMO_CHAT_MESSAGES[Math.floor(Math.random() * DEMO_CHAT_MESSAGES.length)];
                addChatMessage({
                    id: Date.now().toString(),
                    type: "normal",
                    sender: randomMsg.sender,
                    message: randomMsg.message,
                    timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
                });
            }
        }, 8000);

        const teamChatInterval = setInterval(() => {
            if (Math.random() > 0.6) {
                const randomMsg = DEMO_TEAM_MESSAGES[Math.floor(Math.random() * DEMO_TEAM_MESSAGES.length)];
                addTeamChatMessage({
                    id: Date.now().toString(),
                    sender: randomMsg.sender,
                    rank: randomMsg.rank,
                    message: randomMsg.message,
                    timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
                });
            }
        }, 12000);

        return () => {
            clearInterval(chatInterval);
            clearInterval(teamChatInterval);
        };
    }, [isDemoMode, editMode, addChatMessage, addTeamChatMessage, isCommandOnly]);

    // Demo key controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editMode) return;
            if (e.key === "Escape" || e.key === "F7") {
                e.preventDefault();
                exitEditMode();
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
                const current = useVehicleStore.getState();
                setVehicleState({ inVehicle: !current.inVehicle });
            }
            if (e.key === "r") {
                const current = useVoiceStore.getState();

                const nextRange: Record<VoiceState["range"], VoiceState["range"]> = {
                    whisper: "normal",
                    normal: "shout",
                    shout: "megaphone",
                    megaphone: "whisper",
                };

                setVoiceRange(nextRange[current.voiceRange]);
            }
            if (e.key === "e") {
                if (editMode) {
                    exitEditMode();
                } else {
                    enterEditMode();
                }
            }
            // Vehicle type switching
            if (e.key === "1") setVehicleState({ vehicleType: "car", gear: 4 });
            if (e.key === "2")
                setVehicleState({
                    vehicleType: "plane",
                    altitude: 500,
                    pitch: 5,
                    roll: 0,
                    heading: 180,
                    airspeed: 250,
                    landingGear: false,
                    flaps: 0,
                });
            if (e.key === "3") setVehicleState({ vehicleType: "boat", heading: 90, anchor: false });
            if (e.key === "4")
                setVehicleState({
                    vehicleType: "helicopter",
                    altitude: 200,
                    rotorRpm: 95,
                    verticalSpeed: 5,
                    pitch: 0,
                    roll: 0,
                    heading: 90,
                    airspeed: 80,
                });
            if (e.key === "5") setVehicleState({ vehicleType: "motorcycle", speed: 95, gear: 3, fuel: 70 });
            if (e.key === "6") setVehicleState({ vehicleType: "bicycle", speed: 22, gear: 1, fuel: 0 });

            // Notifications - uses notification store directly
            if (!editMode) {
                if (e.key === "h") notifySuccess("Erfolg!", "Aktion erfolgreich ausgeführt.");
                if (e.key === "j") notifyError("Fehler!", "Etwas ist schief gelaufen.");
                if (e.key === "l") notifyInfo("Info", "Hier ist eine Information.");
            }

            // Keybinds toggle - 'k' key
            if (e.key === "k" && !editMode) {
                e.preventDefault();
                useKeybindsStore.getState().toggleVisible();
            }

            // Death toggle
            if (e.key === "f" && !editMode) {
                const current = useDeathStore.getState();
                setDeathState({ isDead: !current.isDead });
            }

            // Wanted level toggle (w key)
            if (e.key === "w" && !editMode) {
                const current = useUtilityStore.getState();
                const newLevel = (current.wantedLevel + 1) % 6;
                setWantedLevel(newLevel);
                if (newLevel > 0) {
                    setIsEvading(!current.isEvading);
                } else {
                    setIsEvading(false);
                }
            }

            // Body health toggle
            if (e.key === "b" && !editMode) {
                const current = useVehicleStore.getState();

                const nextStatus: Record<VehicleHealthStatus, VehicleHealthStatus> = {
                    good: "warning",
                    warning: "critical",
                    critical: "good",
                };

                setVehicleState({
                    healthStatus: nextStatus[current.healthStatus],
                });
            }

            // Chat toggle
            if (e.key === "t" && !editMode) {
                e.preventDefault();
                const current = useChatStore.getState();
                setChatInputActive(!current.chatInputActive);
            }

            // Team Chat toggle
            if (e.key === "y" && !editMode) {
                e.preventDefault();
                const current = useChatStore.getState();
                setTeamChatInputActive(!current.teamChatInputActive);
            }

            // Mute toggle
            if (e.key === "m" && !editMode) {
                e.preventDefault();
                const current = useVoiceStore.getState();
                setIsVoiceMuted(!current.isVoiceMuted);
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
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        enterEditMode,
        exitEditMode,
        setVehicleState,
        setVoiceRange,
        setDeathState,
        setChatInputActive,
        setTeamChatInputActive,
        setWantedLevel,
        setIsEvading,
        setIsVoiceMuted,
    ]);

    // Expose store setters for demo badge toggles
    return {
        setTeamChatAccess,
        setTeamChatIsAdmin,
    };
};
