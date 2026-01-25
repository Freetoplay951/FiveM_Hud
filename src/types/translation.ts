export type Language = "de" | "en";

export interface LanguageConfig {
    name: string;
    locale: string;
    keyboard: string;
}

export interface Locales {
    defaultLanguage: Language;
    locale: string;
    languages: Record<Language, LanguageConfig>;
}

export interface KeyboardLayoutData {
    name: string;
    rows: string[][];
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
        commandOnlyPlaceholder: string;
        commandOnlyHint: string;
        commandOnlyError: string;
        navigation: string;
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
        brandingPosition: string;
        simpleMode: string;
        options: string;
        snapToGrid: string;
        exitEdit: string;
        resetLayout: string;
        snappingTitle: string;
        snappingDrag: string;
        snappingKeyboard: string;
        snappingCtrl: string;
    };
    brandingPositions: {
        center: string;
        right: string;
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
        muted: string;
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
        commandOnly: string;
        adminRights: string;
        teamChatVisibility: string;
        hidden: string;
        locked: string;
    };
    keybinds: {
        title: string;
        subtitle: string;
        search: string;
        keyboard: string;
        noBinding: string;
        oneBinding: string;
        conflict: string;
        filter: string;
        noKeybindsFound: string;
        key: string;
        closeHint: string;
        action: string;
    };
}
