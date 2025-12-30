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
}

export const StatusWidget = ({ type, value, design }: StatusWidgetProps) => {
    switch (design) {
        case "circular":
            return (
                <StatusCircular
                    type={type}
                    value={value}
                />
            );
        case "bar":
            return (
                <StatusBar
                    type={type}
                    value={value}
                />
            );
        case "vertical":
            return (
                <StatusVertical
                    type={type}
                    value={value}
                />
            );
        case "minimal":
            return (
                <StatusMinimal
                    type={type}
                    value={value}
                />
            );
        case "arc":
            return (
                <StatusArc
                    type={type}
                    value={value}
                />
            );
        default:
            return (
                <StatusCircular
                    type={type}
                    value={value}
                />
            );
    }
};
