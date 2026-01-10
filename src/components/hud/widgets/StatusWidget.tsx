import { memo } from "react";
import { StatusType } from "@/types/hud";
import { StatusDesign } from "@/types/widget";
import { StatusCircular } from "./status/StatusCircular";
import { StatusBar } from "./status/StatusBar";
import { StatusVertical } from "./status/StatusVertical";
import { StatusMinimal } from "./status/StatusMinimal";
import { StatusArc } from "./status/StatusArc";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface StatusWidgetProps {
    type: StatusType;
    value: number;
    design: StatusDesign;
}

// Design component map for cleaner switching
const DESIGN_COMPONENTS: Record<StatusDesign, React.ComponentType<{ type: StatusType; value: number }>> = {
    circular: StatusCircular,
    bar: StatusBar,
    vertical: StatusVertical,
    minimal: StatusMinimal,
    arc: StatusArc,
};

const StatusWidgetComponent = ({ type, value, design }: StatusWidgetProps) => {
    // Performance logging
    useRenderLogger(`StatusWidget:${type}`, { value, design });

    const Component = DESIGN_COMPONENTS[design] ?? StatusCircular;
    return <Component type={type} value={value} />;
};

export const StatusWidget = memo(StatusWidgetComponent);
