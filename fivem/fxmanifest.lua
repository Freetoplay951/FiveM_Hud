fx_version 'cerulean'
game 'gta5'

name 'Hud System'
author 'IronSystems (MrFox)'
version '1.0.0'

ui_page 'build/index.html'
files {
    'build/index.html',
    'build/**/*'
}

shared_scripts {
    'shared/enums.lua',
    'config.lua',
    'shared/utils.lua'
}

client_scripts {
    'client/main.lua',
    'client/voice.lua',
    'client/vehicle.lua',
    'client/status.lua',
    'client/notifications.lua',
    'client/minimap.lua',
    'client/death.lua',
    'client/radio.lua',
    'client/utility.lua',
    'client/keybinds.lua',
    'client/chat/playerChat.lua',
    'client/chat/teamChat.lua'
}

server_scripts {
    'server/main.lua'
}

escrow_ignore {
    'client/main.lua',
    'client/vehicle.lua',
    'client/status.lua',
    'client/notifications.lua',
    'client/death.lua',
    'client/radio.lua',
    'client/utility.lua',
    'client/chat/playerChat.lua',
    'client/chat/teamChat.lua',
    'config.lua',
    'shared/enums.lua',
    'shared/utils.lua',
    'server/main.lua'
}