import { useState, useEffect, useCallback } from "react";
import { Language, Translations, translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";
import { isNuiEnvironment, sendNuiCallback } from "./useNuiEvents";

const STORAGE_KEY = "hud-language";

export const useLanguage = () => {
    const [language, setLanguageState] = useState<Language>(() => {
        // Try to get from localStorage
        if (typeof window !== "undefined" && !isNuiEnvironment()) {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "de" || stored === "en") {
                return stored;
            }
        }
        return DEFAULT_LANGUAGE;
    });

    // Start with default translations, can be overwritten by Lua
    const [t, setT] = useState<Translations>(translations[language]);

    // Update translations when language changes (for demo mode)
    useEffect(() => {
        // Only use local translations in demo mode
        if (!isNuiEnvironment()) {
            setT(translations[language]);
            localStorage.setItem(STORAGE_KEY, language);
        }
    }, [language]);

    // Listen for language and translations from FiveM
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;
            
            // Language change from Lua
            if (action === "setLanguage" && (data === "de" || data === "en")) {
                setLanguageState(data);
            }
            
            // Full translations object from Lua
            if (action === "setTranslations" && data) {
                // Merge with defaults to ensure all keys exist
                const mergedTranslations: Translations = {
                    ...translations[language],
                    ...data,
                    death: { ...translations[language].death, ...data.death },
                    chat: { ...translations[language].chat, ...data.chat },
                    teamChat: { ...translations[language].teamChat, ...data.teamChat },
                    status: { ...translations[language].status, ...data.status },
                    vehicle: { ...translations[language].vehicle, ...data.vehicle },
                    editMode: { ...translations[language].editMode, ...data.editMode },
                    statusDesigns: { ...translations[language].statusDesigns, ...data.statusDesigns },
                    minimapShapes: { ...translations[language].minimapShapes, ...data.minimapShapes },
                    speedometerTypes: { ...translations[language].speedometerTypes, ...data.speedometerTypes },
                    general: { ...translations[language].general, ...data.general },
                    notifications: { ...translations[language].notifications, ...data.notifications },
                    demo: { ...translations[language].demo, ...data.demo },
                };
                setT(mergedTranslations);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        
        // Notify FiveM of language change
        if (isNuiEnvironment()) {
            sendNuiCallback("setLanguage", { language: lang });
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguage(language === "de" ? "en" : "de");
    }, [language, setLanguage]);

    return {
        language,
        setLanguage,
        toggleLanguage,
        t,
    };
};
