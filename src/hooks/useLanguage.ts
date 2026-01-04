import { useState, useEffect, useCallback } from "react";
import { Language, Locales, Translations } from "@/types/translation";

const STORAGE_KEY = "hud-language";

export const useLanguage = () => {
    const [t, setT] = useState<Translations | null>(null);
    const [languages, setLanguages] = useState<Locales | null>(null);
    const [language, setLanguageState] = useState<Language | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch("./langs/config.json");
                if (!res.ok) throw new Error("Config file not found");

                const data: Locales = await res.json();

                const stored = localStorage.getItem(STORAGE_KEY);
                const languageKey: Language =
                    stored && Object.keys(data.languages).includes(stored)
                        ? (stored as Language)
                        : data.defaultLanguage;

                console.info("Setting language to:", languageKey);
                setLanguages(data);
                setLanguageState(languageKey);
            } catch (error) {
                console.error(error);
                setIsLoaded(true); // Mark as loaded even on error to prevent blocking
            }
        };

        loadConfig();
    }, []);

    useEffect(() => {
        if (!language) return;

        const loadTranslations = async () => {
            try {
                const res = await fetch(`./langs/${language}.json`);
                if (!res.ok) throw new Error("Translations not found");

                const translations: Translations = await res.json();
                setT(translations);

                console.log(`Loaded language ${languages?.languages[language] ?? language}`);
                localStorage.setItem(STORAGE_KEY, language);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTranslations();
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    return { t, language, languages, setLanguage, isLoaded };
};
