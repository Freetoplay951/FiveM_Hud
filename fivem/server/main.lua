-- Server-side HUD Functions
-- Notification Helper und Server Events

-- ============================================================================
-- NOTIFICATION FUNCTIONS
-- ============================================================================

function NotifyPlayer(source, notificationType, title, message, duration)
    TriggerClientEvent('hud:notify', source, notificationType, title, message, duration)
end

function NotifyAll(notificationType, title, message, duration)
    TriggerClientEvent('hud:notify', -1, notificationType, title, message, duration)
end

-- ============================================================================
-- EVENTS
-- ============================================================================

RegisterNetEvent('hud:server:notify', function(targetId, notificationType, title, message, duration)
    if targetId == -1 then
        NotifyAll(notificationType, title, message, duration)
    else
        NotifyPlayer(targetId, notificationType, title, message, duration)
    end
end)

-- Medic Ruf
RegisterNetEvent('hud:callMedic', function(coords)
    local source = source
    local playerName = GetPlayerName(source)
    
    -- Event für EMS/Medic Scripts
    TriggerEvent('hud:medicCalled', source, coords, playerName)
    
    -- Optional: An alle EMS Spieler senden
    -- TriggerClientEvent('hud:notify', -1, 'warning', 'Notruf', playerName .. ' braucht medizinische Hilfe!', 10000)
    
    print('[HUD] Medic called by ' .. playerName .. ' at ' .. tostring(coords))
end)

-- Position Sync
RegisterNetEvent('hud:syncPosition', function(x, y, z)
    local source = source
    SetEntityCoords(GetPlayerPed(source), x, y, z, false, false, false, false)
end)

-- Respawn Event
RegisterNetEvent('hud:playerRespawned', function()
    local source = source
    print('[HUD] Player ' .. GetPlayerName(source) .. ' respawned')
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

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

exports('revivePlayer', function(playerId, healAmount)
    TriggerClientEvent('hud:revivePlayer', playerId, healAmount)
end)

-- ============================================================================
-- COMMANDS
-- ============================================================================

RegisterCommand('notifyall', function(source, args)
    if source == 0 or IsPlayerAceAllowed(source, 'command.notifyall') then
        local message = table.concat(args, ' ')
        NotifyAll('info', 'Server', message, 10000)
    end
end, true)

RegisterCommand('revive', function(source, args)
    if source == 0 or IsPlayerAceAllowed(source, 'command.revive') then
        local targetId = tonumber(args[1]) or source
        TriggerClientEvent('hud:revivePlayer', targetId)
        print('[HUD] Revived player ' .. targetId)
    end
end, true)
