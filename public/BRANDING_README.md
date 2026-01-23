# Branding Widget Konfiguration

Die Datei `public/branding.json` ermöglicht die vollständige Anpassung des Branding-Widgets im HUD.

## Beispiel-Konfiguration

```json
{
    "segments": [
        { "text": "COMMUNITY", "color": "188 100% 50%" },
        { "text": "RP", "color": "0 100% 50%" }
    ],
    "style": {
        "fontSize": "2xl",
        "letterSpacing": "0.25em",
        "showUnderline": true,
        "showParticles": true,
        "showGlitchEffect": true,
        "showScanlines": false,
        "particleCount": 6
    },
    "decorations": {
        "type": "dots",
        "showDecorations": true
    }
}
```

---

## Segments (Text-Segmente)

Ein Array von Text-Segmenten, die nebeneinander angezeigt werden.

| Eigenschaft | Typ      | Beschreibung                       |
| ----------- | -------- | ---------------------------------- |
| `text`      | `string` | Der anzuzeigende Text              |
| `color`     | `string` | Farbe im HSL-Format (ohne `hsl()`) |

### Beispiele für Farben

```json
"color": "188 100% 50%"   // Cyan
"color": "0 100% 50%"     // Rot
"color": "120 100% 50%"   // Grün
"color": "270 100% 50%"   // Lila
"color": "45 100% 50%"    // Orange
"color": "210 100% 50%"   // Blau
```

### Mehrere Segmente

Du kannst beliebig viele Segmente hinzufügen:

```json
"segments": [
  { "text": "MEIN", "color": "45 100% 50%" },
  { "text": "SERVER", "color": "188 100% 50%" },
  { "text": "RP", "color": "0 100% 50%" }
]
```

---

## Style (Stil-Optionen)

| Eigenschaft        | Typ       | Beschreibung                  | Werte                                   |
| ------------------ | --------- | ----------------------------- | --------------------------------------- |
| `fontSize`         | `string`  | Schriftgröße                  | `"sm"`, `"md"`, `"lg"`, `"xl"`, `"2xl"` |
| `letterSpacing`    | `string`  | Buchstabenabstand             | z.B. `"0.1em"`, `"0.25em"`, `"0.5em"`   |
| `showUnderline`    | `boolean` | Animierte Unterlinie anzeigen | `true` / `false`                        |
| `showParticles`    | `boolean` | Schwebende Partikel anzeigen  | `true` / `false`                        |
| `showGlitchEffect` | `boolean` | Glitch-Effekt aktivieren      | `true` / `false`                        |
| `showScanlines`    | `boolean` | Scanlines-Overlay anzeigen    | `true` / `false`                        |
| `particleCount`    | `number`  | Anzahl der Partikel           | `1` - `12` empfohlen                    |

### Schriftgrößen

| Wert  | Desktop    | Mobile     |
| ----- | ---------- | ---------- |
| `sm`  | `text-xl`  | `text-lg`  |
| `md`  | `text-2xl` | `text-xl`  |
| `lg`  | `text-3xl` | `text-2xl` |
| `xl`  | `text-4xl` | `text-3xl` |
| `2xl` | `text-5xl` | `text-4xl` |

---

## Decorations (Dekorationen)

| Eigenschaft       | Typ       | Beschreibung          | Werte                                       |
| ----------------- | --------- | --------------------- | ------------------------------------------- |
| `type`            | `string`  | Art der Dekoration    | `"dots"`, `"lines"`, `"brackets"`, `"none"` |
| `showDecorations` | `boolean` | Dekorationen anzeigen | `true` / `false`                            |

### Dekorationstypen

| Typ        | Beschreibung                      |
| ---------- | --------------------------------- |
| `dots`     | Animierte Punkte links und rechts |
| `lines`    | Horizontale Linien mit Gradient   |
| `brackets` | Animierte Klammern `‹ ›`          |
| `none`     | Keine Dekorationen                |

---

## Vollständiges Beispiel mit allen Optionen

```json
{
    "segments": [
        { "text": "HORIZON", "color": "270 100% 60%" },
        { "text": "CITY", "color": "188 100% 50%" },
        { "text": "RP", "color": "45 100% 50%" }
    ],
    "style": {
        "fontSize": "xl",
        "letterSpacing": "0.3em",
        "showUnderline": true,
        "showParticles": true,
        "showGlitchEffect": true,
        "showScanlines": true,
        "particleCount": 8
    },
    "decorations": {
        "type": "brackets",
        "showDecorations": true
    }
}
```

---

## Tipps

- **Farben**: Nutze [HSL Color Picker](https://hslpicker.com/) um Farben zu finden
- **Performance**: Bei schwächeren Clients `showParticles` und `showGlitchEffect` deaktivieren
- **Lesbarkeit**: Helle Farben (hohe Lightness %) funktionieren besser auf dunklem Hintergrund
- **Kontrast**: Wähle Farben mit unterschiedlichem Hue für bessere Unterscheidung
