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
    NotificationData,
} from "@/types/hud";

// Demo values for development/preview
export const STATUS_DATA: StatusWidgetState = {
    health: 85,
    armor: 50,
    hunger: 70,
    thirst: 45,
    stamina: 90,
    stress: 25,
    oxygen: 100,
};

export const DEMO_VEHICLE: VehicleState = {
    inVehicle: false, // Default: not in vehicle - press V to toggle
    vehicleType: "car",
    speed: 127,
    gear: 4,
    fuel: 65,
    healthStatus: "good",
};

export const DEMO_MONEY: MoneyState = { cash: 15420, bank: 234567, blackMoney: 5000 };
export const DEMO_PLAYER: PlayerState = { id: 42, job: "LSPD", rank: "Chief" };
export const DEMO_VOICE: VoiceState = { active: true, range: "normal" };
export const DEMO_LOCATION: LocationState = {
    street: "Vinewood Boulevard",
    area: "Vinewood",
    heading: 45,
};

// Demo Death State
export const DEMO_DEATH: DeathState = {
    isDead: false,
    message: "Du wurdest schwer verletzt und benötigst medizinische Hilfe",
};

// Demo Chat State (leer in Production - wird von FiveM befüllt)
export const DEMO_CHAT: ChatState = {
    isInputActive: false,
    isVisible: false,
    messages: [],
    unreadCount: 0,
};

// Demo Team Chat State (leer in Production - wird von FiveM befüllt)
export const DEMO_TEAM_CHAT: TeamChatState = {
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
export const DEMO_RADIO: RadioState = {
    active: false,
    channel: "Kanal 1",
    members: [],
};

export const DEMO_RADIO_ENABLED: RadioState = {
    active: true,
    channel: "Kanal 1",
    members: [
        { id: 1, name: "Max Mustermann", talking: true },
        { id: 2, name: "Anna Schmidt", talking: false },
        { id: 3, name: "Tom Weber", talking: false },
    ],
};

// Demo Chat Nachrichten
export const DEMO_CHAT_MESSAGES = [
    { sender: "Max Mustermann", message: "Hey, wie geht's dir?" },
    { sender: "Anna Schmidt", message: "Wer kommt mit zum Hafen?" },
    { sender: "Tom Weber", message: "Ich brauche Hilfe bei meinem Auto" },
    { sender: "Lisa Müller", message: "Treffen wir uns beim Rathaus?" },
    { sender: "Paul Becker", message: "Hat jemand ein Telefon?" },
    { sender: "Julia Fischer", message: "Ich bin beim Krankenhaus" },
    { sender: "Kevin Hoffmann", message: "Wo ist der nächste Laden?" },
    { sender: "Sarah Wagner", message: "Komme gleich" },
];

export const RANKS = {
    ADMIN: {
        rank: "Admin",
        rankColor: "#a855f7",
    },
    MOD: {
        rank: "Moderator",
        rankColor: "#3b82f6",
    },
    SUP: {
        rank: "Supporter",
        rankColor: "#22c55e",
    },
};

export const DEMO_TEAM_MESSAGES = [
    { sender: "Max", message: "Bitte alle aufpassen", ...RANKS.ADMIN },
    { sender: "Lisa", message: "Neuer Spieler braucht Hilfe", ...RANKS.MOD },
    { sender: "Tom", message: "Ticket wurde bearbeitet", ...RANKS.SUP },
    { sender: "Sarah", message: "Server Neustart in 30 Minuten", ...RANKS.ADMIN },
];

export const EDIT_MODE_DEMO_NOTIFICATIONS: NotificationData[] = [
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
