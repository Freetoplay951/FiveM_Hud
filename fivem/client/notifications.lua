-- Notification System

-- Notification senden
function SendNotification(type, title, message, duration)
    SendNUI('notify', {
        type = type or 'info',
        title = title or '',
        message = message or '',
        duration = duration or 5000
    })
end

-- Events für Notifications
RegisterNetEvent('hud:notify')
AddEventHandler('hud:notify', function(type, title, message, duration)
    SendNotification(type, title, message, duration)
end)

-- Kurz-Events
RegisterNetEvent('hud:success')
AddEventHandler('hud:success', function(title, message, duration)
    SendNotification('success', title, message, duration)
end)

RegisterNetEvent('hud:error')
AddEventHandler('hud:error', function(title, message, duration)
    SendNotification('error', title, message, duration)
end)

RegisterNetEvent('hud:warning')
AddEventHandler('hud:warning', function(title, message, duration)
    SendNotification('warning', title, message, duration)
end)

RegisterNetEvent('hud:info')
AddEventHandler('hud:info', function(title, message, duration)
    SendNotification('info', title, message, duration)
end)

-- Exports für andere Resourcen
exports('notify', function(type, title, message, duration)
    SendNotification(type, title, message, duration)
end)

exports('success', function(title, message, duration)
    SendNotification('success', title, message, duration)
end)

exports('error', function(title, message, duration)
    SendNotification('error', title, message, duration)
end)

exports('warning', function(title, message, duration)
    SendNotification('warning', title, message, duration)
end)

exports('info', function(title, message, duration)
    SendNotification('info', title, message, duration)
end)

-- Beispiel-Nutzung in anderen Resourcen:
-- exports['neon-hud']:notify('success', 'Erfolg!', 'Aktion ausgeführt', 5000)
-- exports['neon-hud']:success('Titel', 'Nachricht')
-- TriggerClientEvent('hud:success', source, 'Titel', 'Nachricht')
