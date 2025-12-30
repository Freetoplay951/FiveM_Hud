import { StatusType } from "@/types/hud";
import { LucideIcon, Heart, Shield, Utensils, Droplets, Zap, Brain, Wind } from "lucide-react";

export interface StatusProps {
    type: StatusType;
    value: number;
}

export const STATUS_CONFIG: Record<StatusType, { icon: LucideIcon; color: string; label: string }> = {
    health: { icon: Heart, color: "health", label: "HP" },
    armor: { icon: Shield, color: "armor", label: "ARM" },
    hunger: { icon: Utensils, color: "hunger", label: "HNG" },
    thirst: { icon: Droplets, color: "thirst", label: "THR" },
    stamina: { icon: Zap, color: "stamina", label: "STA" },
    stress: { icon: Brain, color: "stress", label: "STR" },
    oxygen: { icon: Wind, color: "oxygen", label: "O2" },
};
