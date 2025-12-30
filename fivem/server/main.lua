-- Server-seitige Notification Helper

-- Notification an einen Spieler senden
function NotifyPlayer(source, type, title, message, duration)
    TriggerClientEvent('hud:notify', source, type, title, message, duration)
end

-- Notification an alle Spieler senden
function NotifyAll(type, title, message, duration)
    TriggerClientEvent('hud:notify', -1, type, title, message, duration)
end

-- Events
RegisterNetEvent('hud:server:notify')
AddEventHandler('hud:server:notify', function(targetId, type, title, message, duration)
    if targetId == -1 then
        NotifyAll(type, title, message, duration)
    else
        NotifyPlayer(targetId, type, title, message, duration)
    end
end)

-- Exports
exports('notifyPlayer', NotifyPlayer)
exports('notifyAll', NotifyAll)
exports('success', function(source, title, message, duration)
    NotifyPlayer(source, 'success', title, message, duration)
end)
exports('error', function(source, title, message, duration)
    NotifyPlayer(source, 'error', title, message, duration)
end)
exports('warning', function(source, title, message, duration)
    NotifyPlayer(source, 'warning', title, message, duration)
end)
exports('info', function(source, title, message, duration)
    NotifyPlayer(source, 'info', title, message, duration)
end)

-- Beispiel Admin Commands
RegisterCommand('notifyall', function(source, args, rawCommand)
    if source == 0 or IsPlayerAceAllowed(source, 'command.notifyall') then
        local message = table.concat(args, ' ')
        NotifyAll('info', 'Server', message, 10000)
    end
end, true)

-- Beispiel-Nutzung in anderen Server-Scripts:
-- exports['neon-hud']:notifyPlayer(source, 'success', 'Erfolg!', 'Du hast Geld erhalten', 5000)
-- exports['neon-hud']:notifyAll('warning', 'Warnung', 'Server Neustart in 5 Minuten')
