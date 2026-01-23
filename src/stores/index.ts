/**
 * Store exports for the HUD architecture
 * 
 * Architecture principles:
 * 1. Each widget subscribes to only the data it needs
 * 2. Stores are separated by update frequency:
 *    - High frequency: status, vehicle, voice (500ms updates)
 *    - Medium frequency: location, chat (event-driven)
 *    - Low frequency: death, hud global (rare changes)
 * 3. Layout state is completely separate (in useHUDLayout hook)
 * 4. No data flows from parent to child - widgets self-subscribe
 */

// Status store - high frequency updates
export {
    useStatusStore,
    useHealthStatus,
    useArmorStatus,
    useHungerStatus,
    useThirstStatus,
    useStaminaStatus,
    useStressStatus,
    useOxygenStatus,
    useIsUnderwater,
} from "./statusStore";

// Vehicle store - high frequency updates when in vehicle
export {
    useVehicleStore,
    useInVehicle,
    useVehicleType,
    useVehicleSpeed,
    useVehicleGear,
    useVehicleFuel,
    useVehicleRpm,
    useVehicleHealthStatus,
    useVehicleName,
    useAircraftData,
    useBoatData,
    useCarData,
} from "./vehicleStore";

// Voice store - medium frequency updates
export {
    useVoiceStore,
    useVoiceActive,
    useVoiceRange,
    useIsVoiceEnabled,
    useRadioActive,
    useRadioChannel,
    useRadioMembers,
    useRadioData,
    useVoiceData,
} from "./voiceStore";

// Location store - medium frequency updates
export {
    useLocationStore,
    useStreet,
    useArea,
    useHeading,
    useLocationData,
} from "./locationStore";

// Money store - low frequency updates
export {
    useMoneyStore,
    useCash,
    useBank,
    useBlackMoney,
    usePlayerJob,
    usePlayerRank,
    usePlayerId,
    useMoneyData,
    usePlayerData,
} from "./moneyStore";

// Chat store - event-driven updates
export {
    useChatStore,
    useChatMessages,
    useChatInputActive,
    useChatVisible,
    useChatUnreadCount,
    useChatData,
    useTeamChatMessages,
    useTeamChatInputActive,
    useTeamChatVisible,
    useTeamChatUnreadCount,
    useTeamChatHasAccess,
    useTeamChatIsAdmin,
    useTeamType,
    useTeamName,
    useOnlineMembers,
    useTeamChatData,
} from "./chatStore";

// Death store - rare updates
export {
    useDeathStore,
    useIsDead,
    useDeathMessage,
    useDeathConfig,
    useDeathData,
} from "./deathStore";

// HUD global store - visibility and disabled widgets
export {
    useHUDGlobalStore,
    useIsVisible,
    useIsDemoMode,
    useDisabledWidgets,
} from "./hudStore";
