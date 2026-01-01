import { HUD } from "@/components/HUD";
import { useTranslation } from "@/contexts/LanguageContext";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

const Index = () => {
    const { t } = useTranslation();
    const showDemoBackground = !isNuiEnvironment();

    // HUD rendert jetzt immer - useNuiEvents läuft also sofort
    // Die Translations werden im HUD selbst gehandhabt
    return (
        <div
            className="min-h-screen w-full"
            style={
                showDemoBackground
                    ? {
                          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                      }
                    : {
                          background: "transparent",
                      }
            }>
            <HUD />
        </div>
    );
};

export default Index;
