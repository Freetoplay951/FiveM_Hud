import { motion } from "framer-motion";
import { Car, Plane, Ship, Bike, Motorbike, Helicopter } from "lucide-react";
import { VehicleType } from "@/types/hud";
import { cn } from "@/lib/utils";

export const TestWidget = () => {
    const widthPx = window.screen.width * 0.1638;
    const heightPx = window.screen.height * 0.183;

    console.log("----");
    console.log(window.screen.width);
    console.log(window.screen.height);
    console.log("----");

    console.log(widthPx);
    console.log(heightPx);

    return (
        <div
            className=" bg-red-500"
            style={{
                width: widthPx,
                height: heightPx,
            }}>
            asd
        </div>
    );
};
