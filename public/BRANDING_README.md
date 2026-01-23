# 📌 BRANDING_README.md

## Branding Widget Konfiguration

Die Datei `public/branding.json` ermöglicht die vollständige Anpassung des Branding-Widgets im HUD.

---

## Beispiel-Konfiguration

```json
{
    "segments": [
        {
            "text": "COMMUNITY",
            "color": {
                "type": "gradient",
                "from": "188 100% 50%",
                "to": "270 100% 60%",
                "angle": 90
            }
        },
        { "text": "RP", "color": "0 100% 50%" }
    ],
    "style": {
        "fontSize": "lg",
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

### Einfarbiges Segment

```json
{ "text": "CITY", "color": "188 100% 50%" }
```

### Gradient-Segment

```json
{
    "text": "HORIZON",
    "color": {
        "type": "gradient",
        "from": "270 100% 60%",
        "to": "188 100% 50%",
        "angle": 135
    }
}
```

---

## Style Optionen

- fontSize: sm \| md \| lg \| xl \| 2xl
- letterSpacing: z.B. 0.25em
- showUnderline: true / false
- showParticles: true / false
- showGlitchEffect: true / false
- showScanlines: true / false
- particleCount: 1--12 empfohlen

---

## Decorations

- dots
- lines
- brackets
- none

---

## Tipps

- Gradients funktionieren besonders gut bei dunklem HUD
- Für Performance Glitch & Partikel deaktivieren
- Lightness ≥ 50% empfohlen
