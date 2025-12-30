import { HUD } from "@/components/HUD";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

const Index = () => {
    // Nur im Demo-Modus (nicht in FiveM) den blauen Hintergrund anzeigen
    const showDemoBackground = !isNuiEnvironment();

    return (
        <div
            className="min-h-screen w-full"
            style={showDemoBackground ? {
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
            } : {
                background: "transparent",
            }}>
            <HUD />
        </div>
    );
};

export default Index;
