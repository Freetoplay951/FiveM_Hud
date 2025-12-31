export type Language = "de" | "en";

export interface Translations {
    // Death Screen
    death: {
        title: string;
        critical: string;
        respawnIn: string;
        waitTime: string;
        infoText: string;
        helpButton: string;
        respawnButton: string;
        syncButton: string;
        defaultMessage: string;
    };
    // Chat
    chat: {
        title: string;
        commands: string;
        send: string;
        placeholder: string;
    };
    // Team Chat
    teamChat: {
        title: string;
        online: string;
        noAccess: string;
        locked: string;
        placeholder: string;
    };
    // Status
    status: {
        health: string;
        armor: string;
        hunger: string;
        thirst: string;
        stamina: string;
        stress: string;
        oxygen: string;
    };
    // Vehicle
    vehicle: {
        speed: string;
        fuel: string;
        gear: string;
        altitude: string;
        heading: string;
        pedaling: string;
        stopped: string;
        anchor: string;
        depth: string;
        landingGear: string;
        flaps: string;
        rpm: string;
        verticalSpeed: string;
    };
    // Edit Mode
    editMode: {
        title: string;
        subtitle: string;
        statusDesign: string;
        minimapShape: string;
        speedometerType: string;
        options: string;
        snapToGrid: string;
        showDeathScreen: string;
        exitEdit: string;
        resetLayout: string;
    };
    // Status Designs
    statusDesigns: {
        circular: string;
        bar: string;
        vertical: string;
        minimal: string;
        arc: string;
    };
    // Minimap Shapes
    minimapShapes: {
        square: string;
        round: string;
    };
    // Speedometer Types
    speedometerTypes: {
        car: string;
        plane: string;
        boat: string;
        helicopter: string;
        motorcycle: string;
        bicycle: string;
    };
    // General
    general: {
        cash: string;
        bank: string;
        blackMoney: string;
        voice: string;
        whisper: string;
        normal: string;
        shout: string;
    };
    // Notifications
    notifications: {
        title: string;
    };
    // Demo Mode
    demo: {
        title: string;
        teamChatAccess: string;
        adminRights: string;
        teamChatVisibility: string;
        hidden: string;
        locked: string;
    };
}

// Default/Fallback translations for demo mode
export const translations: Record<Language, Translations> = {
    de: {
        death: {
            title: "BEWUSSTLOS",
            critical: "KRITISCH",
            respawnIn: "RESPAWN MÖGLICH IN",
            waitTime: "Wartezeit",
            infoText: "Warte auf den Rettungsdienst oder respawne im Krankenhaus",
            helpButton: "HILFE",
            respawnButton: "RESPAWN",
            syncButton: "Sync",
            defaultMessage: "Du wurdest schwer verletzt und benötigst medizinische Hilfe",
        },
        chat: {
            title: "Chat",
            commands: "Commands",
            send: "Senden",
            placeholder: "Nachricht eingeben...",
        },
        teamChat: {
            title: "Team-Chat",
            online: "Online",
            noAccess: "Kein Zugriff",
            locked: "Gesperrt",
            placeholder: "Team-Nachricht...",
        },
        status: {
            health: "Gesundheit",
            armor: "Rüstung",
            hunger: "Hunger",
            thirst: "Durst",
            stamina: "Ausdauer",
            stress: "Stress",
            oxygen: "Sauerstoff",
        },
        vehicle: {
            speed: "Geschwindigkeit",
            fuel: "Kraftstoff",
            gear: "Gang",
            altitude: "Höhe",
            heading: "Kurs",
            pedaling: "Treten",
            stopped: "Gestoppt",
            anchor: "Anker",
            depth: "Tiefe",
            landingGear: "Fahrwerk",
            flaps: "Klappen",
            rpm: "Drehzahl",
            verticalSpeed: "Vertikalgeschwindigkeit",
        },
        editMode: {
            title: "HUD Bearbeiten",
            subtitle: "Widgets ziehen & per Ecke skalieren (50%–300%).",
            statusDesign: "Status Design",
            minimapShape: "Minimap Form",
            speedometerType: "Tacho Typ",
            options: "Optionen",
            snapToGrid: "Am Raster ausrichten",
            showDeathScreen: "Death-Screen anzeigen",
            exitEdit: "Bearbeitung beenden",
            resetLayout: "Layout zurücksetzen",
        },
        statusDesigns: {
            circular: "Kreis",
            bar: "Balken",
            vertical: "Vertikal",
            minimal: "Minimal",
            arc: "Bogen",
        },
        minimapShapes: {
            square: "Eckig",
            round: "Rund",
        },
        speedometerTypes: {
            car: "Auto",
            plane: "Flugzeug",
            boat: "Boot",
            helicopter: "Heli",
            motorcycle: "Motorrad",
            bicycle: "Fahrrad",
        },
        general: {
            cash: "Bargeld",
            bank: "Bank",
            blackMoney: "Schwarzgeld",
            voice: "Stimme",
            whisper: "Flüstern",
            normal: "Normal",
            shout: "Schreien",
        },
        notifications: {
            title: "Benachrichtigungen",
        },
        demo: {
            title: "Demo Modus",
            teamChatAccess: "Team-Chat",
            adminRights: "Admin",
            teamChatVisibility: "Sichtbarkeit",
            hidden: "Versteckt",
            locked: "Gesperrt",
        },
    },
    en: {
        death: {
            title: "UNCONSCIOUS",
            critical: "CRITICAL",
            respawnIn: "RESPAWN AVAILABLE IN",
            waitTime: "Wait Time",
            infoText: "Wait for emergency services or respawn at the hospital",
            helpButton: "HELP",
            respawnButton: "RESPAWN",
            syncButton: "Sync",
            defaultMessage: "You have been severely injured and need medical attention",
        },
        chat: {
            title: "Chat",
            commands: "Commands",
            send: "Send",
            placeholder: "Enter message...",
        },
        teamChat: {
            title: "Team Chat",
            online: "Online",
            noAccess: "No Access",
            locked: "Locked",
            placeholder: "Team message...",
        },
        status: {
            health: "Health",
            armor: "Armor",
            hunger: "Hunger",
            thirst: "Thirst",
            stamina: "Stamina",
            stress: "Stress",
            oxygen: "Oxygen",
        },
        vehicle: {
            speed: "Speed",
            fuel: "Fuel",
            gear: "Gear",
            altitude: "Altitude",
            heading: "Heading",
            pedaling: "Pedaling",
            stopped: "Stopped",
            anchor: "Anchor",
            depth: "Depth",
            landingGear: "Landing Gear",
            flaps: "Flaps",
            rpm: "RPM",
            verticalSpeed: "Vertical Speed",
        },
        editMode: {
            title: "Edit HUD",
            subtitle: "Drag widgets & scale via corner (50%–300%).",
            statusDesign: "Status Design",
            minimapShape: "Minimap Shape",
            speedometerType: "Speedometer Type",
            options: "Options",
            snapToGrid: "Snap to Grid",
            showDeathScreen: "Show Death Screen",
            exitEdit: "Exit Edit Mode",
            resetLayout: "Reset Layout",
        },
        statusDesigns: {
            circular: "Circle",
            bar: "Bar",
            vertical: "Vertical",
            minimal: "Minimal",
            arc: "Arc",
        },
        minimapShapes: {
            square: "Square",
            round: "Round",
        },
        speedometerTypes: {
            car: "Car",
            plane: "Plane",
            boat: "Boat",
            helicopter: "Heli",
            motorcycle: "Bike",
            bicycle: "Bicycle",
        },
        general: {
            cash: "Cash",
            bank: "Bank",
            blackMoney: "Black Money",
            voice: "Voice",
            whisper: "Whisper",
            normal: "Normal",
            shout: "Shout",
        },
        notifications: {
            title: "Notifications",
        },
        demo: {
            title: "Demo Mode",
            teamChatAccess: "Team Chat",
            adminRights: "Admin",
            teamChatVisibility: "Visibility",
            hidden: "Hidden",
            locked: "Locked",
        },
    },
};

// Default language
export const DEFAULT_LANGUAGE: Language = "de";

// Get translation helper
export const getTranslation = (lang: Language): Translations => {
    return translations[lang] || translations[DEFAULT_LANGUAGE];
};
