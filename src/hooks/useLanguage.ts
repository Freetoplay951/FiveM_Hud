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

    const [t, setT] = useState<Translations>(translations[language]);

    // Update translations when language changes
    useEffect(() => {
        setT(translations[language]);
        
        // Persist to localStorage in demo mode
        if (!isNuiEnvironment()) {
            localStorage.setItem(STORAGE_KEY, language);
        }
    }, [language]);

    // Listen for language changes from FiveM
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;
            if (action === "setLanguage" && (data === "de" || data === "en")) {
                setLanguageState(data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

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
