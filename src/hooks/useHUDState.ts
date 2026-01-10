import { useState, useCallback } from "react";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";
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
import { WidgetType } from "@/types/widget";
import {
    DEMO_HUD,
    DEMO_VEHICLE,
    DEMO_MONEY,
    DEMO_PLAYER,
    DEMO_VOICE,
    DEMO_LOCATION,
    DEMO_DEATH,
    DEMO_CHAT,
    DEMO_TEAM_CHAT,
    DEMO_RADIO,
} from "@/components/hud/data/demoData";

export interface HUDStateResult {
    // State values
    hudState: StatusWidgetState;
    vehicleState: VehicleState;
    moneyState: MoneyState;
    playerState: PlayerState;
    voiceState: VoiceState;
    locationState: LocationState;
    deathState: DeathState;
    chatState: ChatState;
    teamChatState: TeamChatState;
    radioState: RadioState;
    disabledWidgets: DisabledWidgets;
    demoDeathTimer: { respawnTimer: number; waitTimer: number };
    isVisible: boolean;
    isVoiceEnabled: boolean;
    isDemoMode: boolean;

    // State setters
    setHudState: React.Dispatch<React.SetStateAction<StatusWidgetState>>;
    setVehicleState: React.Dispatch<React.SetStateAction<VehicleState>>;
    setMoneyState: React.Dispatch<React.SetStateAction<MoneyState>>;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
    setVoiceState: React.Dispatch<React.SetStateAction<VoiceState>>;
    setLocationState: React.Dispatch<React.SetStateAction<LocationState>>;
    setDeathState: React.Dispatch<React.SetStateAction<DeathState>>;
    setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
    setTeamChatState: React.Dispatch<React.SetStateAction<TeamChatState>>;
    setRadioState: React.Dispatch<React.SetStateAction<RadioState>>;
    setDisabledWidgets: React.Dispatch<React.SetStateAction<DisabledWidgets>>;
    setDemoDeathTimer: React.Dispatch<React.SetStateAction<{ respawnTimer: number; waitTimer: number }>>;
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setIsVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    // Utility functions
    isWidgetDisabled: (widgetId: string) => boolean;
}

export const useHUDState = (): HUDStateResult => {
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
    const isDemoMode = !isNuiEnvironment();

    const isWidgetDisabled = useCallback(
        (widgetId: string): boolean => {
            return disabledWidgets[widgetId as WidgetType] === true;
        },
        [disabledWidgets]
    );

    return {
        hudState,
        vehicleState,
        moneyState,
        playerState,
        voiceState,
        locationState,
        deathState,
        chatState,
        teamChatState,
        radioState,
        disabledWidgets,
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
    };
};
