fx_version 'cerulean'
game 'gta5'

name 'neon-hud'
description 'Neon HUD für FiveM'
author 'Dein Name'
version '1.0.0'

-- UI Seite (gebaut mit yarn build)
ui_page 'build/index.html'

-- Alle Build-Dateien
files {
    'build/index.html',
    'build/**/*'
}

-- Client Scripts
client_scripts {
    'client/main.lua',
    'client/vehicle.lua',
    'client/status.lua',
    'client/notifications.lua'
}

-- Server Scripts (optional)
server_scripts {
    'server/main.lua'
}

-- Shared Config
shared_scripts {
    'config.lua'
}
