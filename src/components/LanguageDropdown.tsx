import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "@/contexts/LanguageContext";
import { Languages, Check } from "lucide-react";
import { Language } from "@/types/translation";

export const LanguageDropdown = () => {
    const { t, language, languages, setLanguage } = useTranslation();

    const languageEntries = Object.entries(languages.languages) as [Language, string][];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30"
                aria-label={t.editMode.title}>
                <Languages
                    size={14}
                    className="text-muted-foreground"
                />
                <span className="text-[10px] font-medium text-foreground uppercase">{language.toUpperCase()}</span>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="mt-1 w-24 bg-background border border-border rounded-lg shadow-md p-1 z-50">
                {languageEntries.map(([key, label]) => (
                    <DropdownMenu.Item
                        key={key}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-muted/40 cursor-pointer"
                        onSelect={() => setLanguage(key)}>
                        {language === key && (
                            <Check
                                size={12}
                                className="text-foreground"
                            />
                        )}
                        <span className="flex-1">{label}</span>
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
};
