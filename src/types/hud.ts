export interface StatusWidgetState {
    health: number;
    armor: number;
    hunger: number;
    thirst: number;
    stamina: number;
    stress?: number;
    oxygen?: number;
}

import { WidgetType } from "./widget";

// Widgets that are disabled (default is enabled)
// Example: { thirst: true, hunger: true } means thirst and hunger are disabled
export type DisabledWidgets = Partial<Record<WidgetType, boolean>>;

export type VehicleType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";

export interface VehicleState {
    inVehicle: boolean;
    vehicleType: VehicleType;
    vehicleName?: string; // Display name from FiveM
    vehicleSpawnName?: string; // Spawn name for tx (e.g., "adder", "zentorno")
    speed: number;
    gear: number;
    fuel: number;
    rpm?: number;
    engineOn?: boolean;
    // Car specific
    seatbelt?: boolean;
    lights?: "off" | "low" | "high";
    blinker?: "off" | "left" | "right" | "hazard";
    // Plane/Helicopter specific
    altitude?: number;
    airspeed?: number;
    pitch?: number;
    roll?: number;
    heading?: number;
    landingGear?: boolean;
    flaps?: number;
    verticalSpeed?: number;
    rotorRpm?: number;
    // Boat specific
    anchor?: boolean;
    depth?: number;
}

export interface MoneyState {
    cash: number;
    bank: number;
    blackMoney?: number;
}

export interface PlayerState {
    id: number;
    job: string;
    rank: string;
}

export interface VoiceState {
    active: boolean;
    range: "whisper" | "normal" | "shout" | "megaphone";
}

export interface RadioMember {
    id: number;
    name: string;
    avatar?: string;
    talking?: boolean;
}

export interface RadioState {
    active: boolean;
    channel: string;
    members: RadioMember[];
}

export interface LocationState {
    street: string;
    area?: string;
    heading?: number;
}

export type StatusType = "health" | "armor" | "hunger" | "thirst" | "stamina" | "stress" | "oxygen";

export interface NotificationData {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    duration?: number;
}

// Death Screen State
export interface DeathState {
    isDead: boolean;
    respawnTimer: number; // Seconds until respawn is allowed
    waitTimer: number; // Seconds of total wait time remaining
    canCallHelp?: boolean;
    canRespawn?: boolean;
    message?: string;
}

// Chat Message Types
export type ChatMessageType = "normal" | "system" | "action" | "ooc" | "whisper" | "shout" | "radio";

export interface ChatMessage {
    id: string;
    type: ChatMessageType;
    sender?: string;
    message: string;
    timestamp: string;
}

export interface ChatState {
    isInputActive?: boolean; // Ob Eingabefeld aktiv ist
    isVisible?: boolean; // Ob Chat sichtbar ist (für Fade-Out)
    messages: ChatMessage[];
    unreadCount: number;
}

// Team Chat Types (Staff only - Supporter, Admin, etc.)
export type TeamType = "supporter" | "moderator" | "admin" | "superadmin" | "owner";

export interface TeamChatMessage {
    id: string;
    sender: string;
    rank?: string;
    message: string;
    timestamp: string;
    isImportant?: boolean;
}

export interface TeamChatState {
    isInputActive?: boolean; // Ob Eingabefeld aktiv ist
    isVisible?: boolean; // Ob Team-Chat sichtbar ist (für Fade-Out)
    hasAccess: boolean;
    teamType: TeamType;
    teamName: string;
    messages: TeamChatMessage[];
    unreadCount: number;
    onlineMembers: number;
    isAdmin?: boolean;
}
