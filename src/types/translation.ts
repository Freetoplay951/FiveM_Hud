export type Language = "de" | "en";

export interface Locales {
    defaultLanguage: Language;
    languages: Record<Language, string>;
}

export interface Translations {
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
    chat: {
        title: string;
        commands: string;
        send: string;
        placeholder: string;
    };
    teamChat: {
        title: string;
        online: string;
        noAccess: string;
        locked: string;
        placeholder: string;
    };
    status: {
        health: string;
        armor: string;
        hunger: string;
        thirst: string;
        stamina: string;
        stress: string;
        oxygen: string;
    };
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
        unknown: string;
        kmh: string;
        knots: string;
        kts: string;
        alt: string;
        rotor: string;
    };
    editMode: {
        title: string;
        subtitle: string;
        statusDesign: string;
        minimapShape: string;
        speedometerType: string;
        heliSimpleMode: string;
        options: string;
        snapToGrid: string;
        exitEdit: string;
        resetLayout: string;
    };
    statusDesigns: {
        circular: string;
        bar: string;
        vertical: string;
        minimal: string;
        arc: string;
    };
    minimapShapes: {
        square: string;
        round: string;
    };
    speedometerTypes: {
        car: string;
        plane: string;
        boat: string;
        helicopter: string;
        motorcycle: string;
        bicycle: string;
    };
    general: {
        cash: string;
        bank: string;
        blackMoney: string;
        voice: string;
        whisper: string;
        normal: string;
        shout: string;
        megaphone: string;
    };
    radio: {
        title: string;
        participants: string;
    };
    notifications: {
        title: string;
    };
    demo: {
        title: string;
        teamChatAccess: string;
        adminRights: string;
        teamChatVisibility: string;
        hidden: string;
        locked: string;
    };
}
