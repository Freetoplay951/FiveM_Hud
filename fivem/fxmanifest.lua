fx_version 'cerulean'
game 'gta5'

name 'Hud System'
author 'IronSystems (MrFox)'
version '1.0.0'

-- UI Seite (gebaut mit yarn build)
ui_page 'build/index.html'

-- Alle Build-Dateien
files {
    'build/index.html',
    'build/**/*'
}

-- Shared Config, Utils und Sprachen (muss zuerst geladen werden)
shared_scripts {
    'config.lua',
    'shared/utils.lua'
}

-- Client Scripts
client_scripts {
    'client/main.lua',
    'client/vehicle.lua',
    'client/status.lua',
    'client/notifications.lua',
    'client/minimap.lua',
    'client/death.lua',
    'client/radio.lua',
    'client/utility.lua',
    'client/chat/playerChat.lua',
    'client/chat/teamChat.lua'
}

-- Server Scripts (optional)
server_scripts {
    'server/main.lua'
}
