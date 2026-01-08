import { createContext, useContext, ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Language, Locales, Translations } from "@/types/translation";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    languages: Locales;
    t: Translations;
    isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const languageHook = useLanguage();
    return <LanguageContext.Provider value={languageHook}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
};
