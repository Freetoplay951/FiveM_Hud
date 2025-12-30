export interface HudState {
    health: number;
    armor: number;
    hunger: number;
    thirst: number;
    stamina: number;
    stress?: number;
    oxygen?: number;
}

export type VehicleType = "car" | "plane" | "boat" | "helicopter";

export interface VehicleState {
    inVehicle: boolean;
    vehicleType: VehicleType;
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
    range: "whisper" | "normal" | "shout";
}

export interface LocationState {
    street: string;
    heading: number;
    area?: string;
}

export type StatusType = "health" | "armor" | "hunger" | "thirst" | "stamina" | "stress" | "oxygen";

export interface StatusConfig {
    type: StatusType;
    value: number;
    icon: string;
    color: string;
    glowColor: string;
}

export interface NotificationData {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    duration?: number;
}
