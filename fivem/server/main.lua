-- Server-side HUD Functions
-- Notification Helper, Chat Sync und Server Events

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
-- CHAT SYNCHRONIZATION
-- ============================================================================

-- Spielernamen bekommen
local function GetPlayerDisplayName(source)
    local name = GetPlayerName(source)
    return name or "Unknown"
end

-- Chat-Nachricht von Client empfangen und an alle senden
RegisterNetEvent('hud:sendChatMessage', function(message)
    local source = source
    local playerName = GetPlayerDisplayName(source)
    
    -- An alle Spieler senden (inkl. Sender)
    TriggerClientEvent('hud:receiveChatMessage', -1, 'normal', playerName, message)
    
    if Config and Config.Debug then
        print('[HUD Chat] ' .. playerName .. ': ' .. message)
    end
end)

-- Chat-Nachricht mit Typ senden (action, ooc, etc.)
RegisterNetEvent('hud:sendChatMessageType', function(msgType, message)
    local source = source
    local playerName = GetPlayerDisplayName(source)
    
    -- An alle Spieler senden
    TriggerClientEvent('hud:receiveChatMessage', -1, msgType, playerName, message)
    
    if Config and Config.Debug then
        print('[HUD Chat] [' .. msgType .. '] ' .. playerName .. ': ' .. message)
    end
end)

-- System-Nachricht an alle senden
function SendSystemMessage(message)
    TriggerClientEvent('hud:receiveChatMessage', -1, 'system', nil, message)
end

-- ============================================================================
-- TEAM CHAT SYNCHRONIZATION (Staff only)
-- ============================================================================

-- Team-Chat Nachricht empfangen und an alle Team-Mitglieder senden
RegisterNetEvent('hud:sendTeamChatMessage', function(message)
    local source = source
    local playerName = GetPlayerDisplayName(source)
    
    -- Rang des Spielers ermitteln (Server-seitig via Ace Permissions)
    local rank = "Staff"
    
    -- Prüfe Ränge aus Config (falls vorhanden)
    if Config and Config.TeamChatRanks then
        for _, rankConfig in ipairs(Config.TeamChatRanks) do
            if IsPlayerAceAllowed(source, rankConfig.permission) then
                rank = rankConfig.name
                break
            end
        end
    end
    
    -- An alle Spieler senden die Team-Chat Zugriff haben
    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        
        -- Prüfen ob Spieler Zugriff auf Team-Chat hat
        local hasAccess = false
        
        -- Allgemeine Permission prüfen
        if Config and Config.TeamChatGeneralPermission then
            if IsPlayerAceAllowed(targetId, Config.TeamChatGeneralPermission) then
                hasAccess = true
            end
        end
        
        -- Spezifische Rang-Permissions prüfen
        if not hasAccess and Config and Config.TeamChatRanks then
            for _, rankConfig in ipairs(Config.TeamChatRanks) do
                if IsPlayerAceAllowed(targetId, rankConfig.permission) then
                    hasAccess = true
                    break
                end
            end
        end
        
        -- Nachricht senden wenn Zugriff
        if hasAccess then
            TriggerClientEvent('hud:receiveTeamChatMessage', targetId, playerName, rank, message, false)
        end
    end
    
    if Config and Config.Debug then
        print('[HUD TeamChat] [' .. rank .. '] ' .. playerName .. ': ' .. message)
    end
end)

-- Wichtige Team-Chat Nachricht (vom Server)
function SendTeamChatMessage(sender, rank, message, isImportant)
    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        
        local hasAccess = false
        if Config and Config.TeamChatGeneralPermission then
            if IsPlayerAceAllowed(targetId, Config.TeamChatGeneralPermission) then
                hasAccess = true
            end
        end
        
        if not hasAccess and Config and Config.TeamChatRanks then
            for _, rankConfig in ipairs(Config.TeamChatRanks) do
                if IsPlayerAceAllowed(targetId, rankConfig.permission) then
                    hasAccess = true
                    break
                end
            end
        end
        
        if hasAccess then
            TriggerClientEvent('hud:receiveTeamChatMessage', targetId, sender, rank, message, isImportant or false)
        end
    end
end

-- ============================================================================
-- TEAM PERMISSION SYSTEM (Server-side Ace checks)
-- ============================================================================

-- Get staff rank for a player
local function GetPlayerStaffRank(source)
    if not Config or not Config.TeamChatRanks then
        return nil, nil, nil
    end
    
    for _, rank in ipairs(Config.TeamChatRanks) do
        if IsPlayerAceAllowed(source, rank.permission) then
            return rank.id, rank.name, rank
        end
    end
    
    if Config.TeamChatGeneralPermission and IsPlayerAceAllowed(source, Config.TeamChatGeneralPermission) then
        local defaultRank = Config.TeamChatRanks[#Config.TeamChatRanks]
        if defaultRank then
            return defaultRank.id, defaultRank.name, defaultRank
        end
    end
    
    return nil, nil, nil
end

-- Check if player has team chat access
local function HasTeamChatAccess(source)
    if not Config then return false end
    
    if Config.TeamChatGeneralPermission then
        if IsPlayerAceAllowed(source, Config.TeamChatGeneralPermission) then
            return true
        end
    end
    
    if Config.TeamChatRanks then
        for _, rank in ipairs(Config.TeamChatRanks) do
            if IsPlayerAceAllowed(source, rank.permission) then
                return true
            end
        end
    end
    
    return false
end

-- Count online team members
local function GetTeamOnlineCount()
    local count = 0
    local players = GetPlayers()
    
    for _, playerId in ipairs(players) do
        local targetId = tonumber(playerId)
        if HasTeamChatAccess(targetId) then
            count = count + 1
        end
    end
    
    return count
end

-- Client requests permission data
RegisterNetEvent('hud:requestTeamPermissions', function()
    local source = source
    local rankId, rankName, rankConfig = GetPlayerStaffRank(source)
    local hasAccess = HasTeamChatAccess(source)
    local isAdmin = rankConfig and rankConfig.isAdmin or false
    local onlineCount = GetTeamOnlineCount()
    
    TriggerClientEvent('hud:teamPermissionsResponse', source, {
        hasAccess = hasAccess,
        rankId = rankId,
        rankName = rankName,
        rankConfig = rankConfig,
        isAdmin = isAdmin,
        onlineCount = onlineCount
    })
    
    if Config and Config.Debug then
        print('[HUD Server] Sent permission data to player ' .. source .. ' - Access: ' .. tostring(hasAccess) .. ', Online: ' .. onlineCount)
    end
end)

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
exports('sendSystemMessage', SendSystemMessage)
exports('sendTeamChatMessage', SendTeamChatMessage)

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

-- Chat Commands
RegisterCommand('say', function(source, args)
    if source == 0 then
        -- Server-Console Nachricht
        SendSystemMessage('[SERVER] ' .. table.concat(args, ' '))
    end
end, true)

RegisterCommand('announce', function(source, args)
    if source == 0 or IsPlayerAceAllowed(source, 'command.announce') then
        local message = table.concat(args, ' ')
        SendSystemMessage('[ANKÜNDIGUNG] ' .. message)
    end
end, true)

RegisterCommand('teamchat', function(source, args)
    if source == 0 or IsPlayerAceAllowed(source, 'command.teamchat') then
        local message = table.concat(args, ' ')
        SendTeamChatMessage('Server', 'System', message, true)
    end
end, true)
