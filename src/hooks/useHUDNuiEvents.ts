import { useNuiEvents } from "@/hooks/useNuiEvents";
import {
    StatusWidgetState,
    VehicleState,
    MoneyState,
    VoiceState,
    LocationState,
    PlayerState,
    DeathState,
    ChatState,
    TeamChatState,
    RadioState,
    DisabledWidgets,
} from "@/types/hud";

interface UseHUDNuiEventsProps {
    setHudState: React.Dispatch<React.SetStateAction<StatusWidgetState>>;
    setVehicleState: React.Dispatch<React.SetStateAction<VehicleState>>;
    setMoneyState: React.Dispatch<React.SetStateAction<MoneyState>>;
    setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
    setRadioState: React.Dispatch<React.SetStateAction<RadioState>>;
    setLocationState: React.Dispatch<React.SetStateAction<LocationState>>;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setDeathState: React.Dispatch<React.SetStateAction<DeathState>>;
    setDisabledWidgets: React.Dispatch<React.SetStateAction<DisabledWidgets>>;
    setIsVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
    setTeamChatState: React.Dispatch<React.SetStateAction<TeamChatState>>;
    editMode: boolean;
    toggleEditMode: () => void;
    success: (title: string, message: string, duration?: number) => void;
    error: (title: string, message: string, duration?: number) => void;
    warning: (title: string, message: string, duration?: number) => void;
    info: (title: string, message: string, duration?: number) => void;
}

export const useHUDNuiEvents = ({
    setHudState,
    setVehicleState,
    setMoneyState,
    setVoiceState,
    setRadioState,
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
}: UseHUDNuiEventsProps) => {
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
};
