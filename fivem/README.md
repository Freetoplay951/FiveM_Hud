# HUD - FiveM Resource

## Installation

### 1. React App bauen

```bash
# Im Hauptverzeichnis des Projekts
yarn build
# oder
npm run build
```

### 2. Build-Ordner kopieren

Kopiere den generierten `dist` Ordner in diesen `fivem` Ordner und benenne ihn zu `build` um:

```bash
cp -r dist fivem/build
# oder unter Windows:
xcopy dist fivem\build /E /I
```

### 3. Resource in FiveM einbinden

Kopiere den gesamten `fivem` Ordner in dein FiveM `resources` Verzeichnis und benenne ihn ggf. um (z.B. `rp-hud`).

### 4. In server.cfg eintragen

```cfg
ensure rp-hud
```

## Struktur

```
rp-hud/
├── build/              # React Build (von yarn build)
│   ├── index.html
│   └── assets/
├── client/
│   ├── main.lua        # Hauptlogik, Framework-Integration
│   ├── vehicle.lua     # Fahrzeug-Updates
│   ├── status.lua      # Spieler-Status (Health, Armor, etc.)
│   └── notifications.lua # Notification-System
├── server/
│   └── main.lua        # Server-seitige Notifications
├── config.lua          # Konfiguration
├── fxmanifest.lua      # Resource Manifest
└── README.md
```

## Konfiguration (config.lua)

| Option                  | Standard    | Beschreibung                         |
| ----------------------- | ----------- | ------------------------------------ |
| `StatusUpdateInterval`  | 500         | Update-Intervall für Status in ms    |
| `VehicleUpdateInterval` | 100         | Update-Intervall für Fahrzeuge in ms |
| `Framework`             | 'auto'      | 'esx', 'qb', oder 'auto'             |
| `VoiceResource`         | 'pma-voice' | Voice-System für Mikrofon-Anzeige    |
| `EditModeKey`           | 'F7'        | Taste für Edit-Mode                  |

## Verwendung

### Notifications aus anderen Resourcen

**Client-seitig:**

```lua
-- Exports
exports['rp-hud']:success('Titel', 'Nachricht', 5000)
exports['rp-hud']:error('Fehler', 'Etwas ist schiefgelaufen')
exports['rp-hud']:warning('Warnung', 'Aufgepasst!')
exports['rp-hud']:info('Info', 'Wichtige Information')
exports['rp-hud']:notify('success', 'Titel', 'Nachricht', 5000)

-- Events
TriggerEvent('hud:success', 'Titel', 'Nachricht')
TriggerEvent('hud:notify', 'error', 'Titel', 'Nachricht', 5000)
```

**Server-seitig:**

```lua
-- Exports
exports['rp-hud']:notifyPlayer(source, 'success', 'Titel', 'Nachricht', 5000)
exports['rp-hud']:notifyAll('warning', 'Server', 'Neustart in 5 Minuten')
exports['rp-hud']:success(source, 'Titel', 'Nachricht')

-- Events
TriggerClientEvent('hud:success', source, 'Titel', 'Nachricht')
TriggerClientEvent('hud:notify', -1, 'info', 'An Alle', 'Broadcast')
```

### Status Updates

```lua
-- Einzelnen Status aktualisieren
exports['rp-hud']:updateStatus('stress', 50)

-- Event
TriggerEvent('hud:updateStatus', 'hunger', 75)
```

### HUD ein/ausblenden

```lua
exports['rp-hud']:hideHud()
exports['rp-hud']:showHud()
local visible = exports['rp-hud']:isHudVisible()
```

## Framework-Support

### ESX

-   Automatische Geld-Updates (cash, bank, black_money)
-   Job-Anzeige
-   esx_status Integration (hunger, thirst)

### QB-Core

-   Automatische Geld-Updates (cash, bank, crypto)
-   Job-Anzeige
-   Metadata Integration (hunger, thirst, stress)

### Standalone

Ohne Framework werden nur die Basis-Werte angezeigt:

-   Health, Armor, Stamina, Oxygen
-   Fahrzeug-Daten
-   Location/Compass

## Edit Mode

Drücke **F7** (oder die konfigurierte Taste) um den Edit-Mode zu öffnen:

-   Widgets verschieben (Drag & Drop)
-   Größe ändern (Ecke ziehen)
-   Ein-/Ausblenden (Augen-Icon)
-   Layout zurücksetzen

Das Layout wird automatisch im Browser gespeichert.
