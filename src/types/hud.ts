export interface HudState {
  health: number;
  armor: number;
  hunger: number;
  thirst: number;
  stamina: number;
}

export interface VehicleState {
  inVehicle: boolean;
  speed: number;
  gear: number;
  fuel: number;
  rpm?: number;
}

export interface MoneyState {
  cash: number;
  bank: number;
  blackMoney?: number;
}

export interface VoiceState {
  active: boolean;
  range: 'whisper' | 'normal' | 'shout';
}

export interface LocationState {
  street: string;
  direction: string;
  area?: string;
}

export type StatusType = 'health' | 'armor' | 'hunger' | 'thirst' | 'stamina';

export interface StatusConfig {
  type: StatusType;
  value: number;
  icon: string;
  color: string;
  glowColor: string;
}
