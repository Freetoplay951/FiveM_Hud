import { StatusType } from "@/types/hud";
import { StatusDesign } from "@/types/widget";
import { StatusCircular } from "./status/StatusCircular";
import { StatusBar } from "./status/StatusBar";
import { StatusVertical } from "./status/StatusVertical";
import { StatusMinimal } from "./status/StatusMinimal";
import { StatusArc } from "./status/StatusArc";

interface StatusWidgetProps {
    type: StatusType;
    value: number;
    design: StatusDesign;
    size?: "sm" | "md" | "lg";
}

export const StatusWidget = ({ type, value, design, size = "md" }: StatusWidgetProps) => {
    switch (design) {
        case "circular":
            return (
                <StatusCircular
                    type={type}
                    value={value}
                    size={size}
                />
            );
        case "bar":
            return (
                <StatusBar
                    type={type}
                    value={value}
                    size={size}
                />
            );
        case "vertical":
            return (
                <StatusVertical
                    type={type}
                    value={value}
                    size={size}
                />
            );
        case "minimal":
            return (
                <StatusMinimal
                    type={type}
                    value={value}
                    size={size}
                />
            );
        case "arc":
            return (
                <StatusArc
                    type={type}
                    value={value}
                    size={size}
                />
            );
        default:
            return (
                <StatusCircular
                    type={type}
                    value={value}
                    size={size}
                />
            );
    }
};
