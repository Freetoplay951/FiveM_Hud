-- ============================================================================
-- CORE NOTIFICATION FUNCTION
-- ============================================================================

function SendNotification(notificationType, title, message, duration)
    local nType = notificationType or NotificationType.INFO
    
    -- Validierung (optional, Fallback auf INFO)
    if not IsValidNotificationType(nType) then
        nType = NotificationType.INFO
    end
    
    SendNUI('notify', {
        type = nType,
        title = title or '',
        message = message or '',
        duration = duration or 5000
    })
end

-- ============================================================================
-- EVENTS
-- ============================================================================

-- Haupt-Notification Event
RegisterNetEvent('hud:notify', function(notificationType, title, message, duration)
    SendNotification(notificationType, title, message, duration)
end)

-- Kurzform Events
RegisterNetEvent('hud:success', function(title, message, duration)
    SendNotification(NotificationType.SUCCESS, title, message, duration)
end)

RegisterNetEvent('hud:error', function(title, message, duration)
    SendNotification(NotificationType.ERROR, title, message, duration)
end)

RegisterNetEvent('hud:warning', function(title, message, duration)
    SendNotification(NotificationType.WARNING, title, message, duration)
end)

RegisterNetEvent('hud:info', function(title, message, duration)
    SendNotification(NotificationType.INFO, title, message, duration)
end)

-- Objekt-basiertes Event (für komplexere Notifications)
RegisterNetEvent('hud:notification', function(data)
    if type(data) == 'table' then
        SendNotification(data.type, data.title, data.message, data.duration)
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

-- Haupt Export
exports('notify', function(notificationType, title, message, duration)
    SendNotification(notificationType, title, message, duration)
end)

-- Kurzform Exports
exports('success', function(title, message, duration)
    SendNotification(NotificationType.SUCCESS, title, message, duration)
end)

exports('error', function(title, message, duration)
    SendNotification(NotificationType.ERROR, title, message, duration)
end)

exports('warning', function(title, message, duration)
    SendNotification(NotificationType.WARNING, title, message, duration)
end)

exports('info', function(title, message, duration)
    SendNotification(NotificationType.INFO, title, message, duration)
end)

-- Objekt Export
exports('showNotification', function(data)
    if type(data) == 'table' then
        SendNotification(data.type, data.title, data.message, data.duration)
    elseif type(data) == 'string' then
        SendNotification(NotificationType.INFO, '', data, 5000)
    end
end)

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback('dismissNotification', function(data, cb)
    -- Optional: Event triggern wenn Notification geschlossen wird
    if data.id then
        TriggerEvent('hud:notificationDismissed', data.id)
    end
    cb({ success = true })
end)

--[[
============================================================================
USAGE EXAMPLES
============================================================================

-- Von anderen Client-Scripts:
exports['rp-hud']:notify('success', 'Erfolg!', 'Aktion wurde ausgeführt', 5000)
exports['rp-hud']:success('Titel', 'Nachricht')
exports['rp-hud']:error('Fehler', 'Etwas ist schief gelaufen')
exports['rp-hud']:warning('Warnung', 'Achtung!')
exports['rp-hud']:info('Info', 'Hier ist eine Information')

-- Objekt-basiert:
exports['rp-hud']:showNotification({
    type = 'success',
    title = 'Erfolg',
    message = 'Aktion erfolgreich',
    duration = 3000
})

-- Einfache Nachricht:
exports['rp-hud']:showNotification('Dies ist eine einfache Nachricht')

-- Von Server-Scripts:
TriggerClientEvent('hud:notify', source, 'success', 'Titel', 'Nachricht', 5000)
TriggerClientEvent('hud:success', source, 'Titel', 'Nachricht')

============================================================================
]]
