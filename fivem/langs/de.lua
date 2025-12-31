-- German Translations / Deutsche Übersetzungen
-- Diese Datei enthält alle UI-Texte für das HUD

Lang = Lang or {}

Lang.de = {
    -- Death Screen
    death = {
        title = "BEWUSSTLOS",
        critical = "KRITISCH",
        respawnIn = "RESPAWN MÖGLICH IN",
        waitTime = "Wartezeit",
        infoText = "Warte auf den Rettungsdienst oder respawne im Krankenhaus",
        helpButton = "HILFE",
        respawnButton = "RESPAWN",
        syncButton = "Sync",
        defaultMessage = "Du wurdest schwer verletzt und benötigst medizinische Hilfe",
    },
    
    -- Chat
    chat = {
        title = "Chat",
        commands = "Commands",
        send = "Senden",
        placeholder = "Nachricht eingeben...",
    },
    
    -- Team Chat
    teamChat = {
        title = "Team-Chat",
        online = "Online",
        noAccess = "Kein Zugriff",
        locked = "Gesperrt",
        placeholder = "Team-Nachricht...",
    },
    
    -- Status
    status = {
        health = "Gesundheit",
        armor = "Rüstung",
        hunger = "Hunger",
        thirst = "Durst",
        stamina = "Ausdauer",
        stress = "Stress",
        oxygen = "Sauerstoff",
    },
    
    -- Vehicle
    vehicle = {
        speed = "Geschwindigkeit",
        fuel = "Kraftstoff",
        gear = "Gang",
        altitude = "Höhe",
        heading = "Kurs",
        pedaling = "Treten",
        stopped = "Gestoppt",
        anchor = "Anker",
        depth = "Tiefe",
        landingGear = "Fahrwerk",
        flaps = "Klappen",
        rpm = "Drehzahl",
        verticalSpeed = "Vertikalgeschwindigkeit",
    },
    
    -- Edit Mode
    editMode = {
        title = "HUD Bearbeiten",
        subtitle = "Widgets ziehen & per Ecke skalieren (50%–300%).",
        statusDesign = "Status Design",
        minimapShape = "Minimap Form",
        speedometerType = "Tacho Typ",
        options = "Optionen",
        snapToGrid = "Am Raster ausrichten",
        showDeathScreen = "Death-Screen anzeigen",
        exitEdit = "Bearbeitung beenden",
        resetLayout = "Layout zurücksetzen",
    },
    
    -- Status Designs
    statusDesigns = {
        circular = "Kreis",
        bar = "Balken",
        vertical = "Vertikal",
        minimal = "Minimal",
        arc = "Bogen",
    },
    
    -- Minimap Shapes
    minimapShapes = {
        square = "Eckig",
        round = "Rund",
    },
    
    -- Speedometer Types
    speedometerTypes = {
        car = "Auto",
        plane = "Flugzeug",
        boat = "Boot",
        helicopter = "Heli",
        motorcycle = "Motorrad",
        bicycle = "Fahrrad",
    },
    
    -- General
    general = {
        cash = "Bargeld",
        bank = "Bank",
        blackMoney = "Schwarzgeld",
        voice = "Stimme",
        whisper = "Flüstern",
        normal = "Normal",
        shout = "Schreien",
    },
    
    -- Notifications
    notifications = {
        title = "Benachrichtigungen",
    },
    
    -- Demo Mode
    demo = {
        title = "Demo Modus",
        teamChatAccess = "Team-Chat",
        adminRights = "Admin",
    },
}
