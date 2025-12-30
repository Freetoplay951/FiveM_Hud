-- Chat System
-- Handles global and team chat with FiveM Ace Permissions

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

local MAX_MESSAGES = 50 -- Maximum messages to keep in history
local CHAT_FADE_TIME = 10 -- Seconds before chat fades

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isChatOpen = false
local isTeamChatOpen = false
local chatMessages = {}
local teamChatMessages = {}

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

local function GetTimestamp()
    local hour = GetClockHours()
    local minute = GetClockMinutes()
    return string.format("%02d:%02d", hour, minute)
end

-- ============================================================================
-- CHAT FUNCTIONS
-- ============================================================================

-- Send chat message to NUI
local function SendChatMessage(msgType, sender, message)
    local msg = {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message,
        timestamp = GetTimestamp()
    }
    
    -- Add to local history
    table.insert(chatMessages, msg)
    if #chatMessages > MAX_MESSAGES then
        table.remove(chatMessages, 1)
    end
    
    -- Send to NUI
    SendNUI("updateChat", {
        isOpen = isChatOpen,
        messages = chatMessages,
        unreadCount = isChatOpen and 0 or 1
    })
end

-- Send team chat message to NUI
local function SendTeamChatMessage(sender, rank, message, isImportant)
    local msg = {
        id = tostring(GetGameTimer()),
        sender = sender,
        rank = rank,
        message = message,
        timestamp = GetTimestamp(),
        isImportant = isImportant or false
    }
    
    -- Add to local history
    table.insert(teamChatMessages, msg)
    if #teamChatMessages > MAX_MESSAGES then
        table.remove(teamChatMessages, 1)
    end
    
    -- Get team info
    local teamType, teamName = GetPlayerTeamInfo()
    local onlineMembers = GetTeamOnlineCount(teamType)
    
    -- Send to NUI
    SendNUI("updateTeamChat", {
        isOpen = isTeamChatOpen,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType,
        teamName = teamName,
        messages = teamChatMessages,
        unreadCount = isTeamChatOpen and 0 or 1,
        onlineMembers = onlineMembers,
        isAdmin = IsPlayerTeamAdmin()
    })
end

-- ============================================================================
-- TEAM/JOB DETECTION
-- ============================================================================

function GetPlayerTeamInfo()
    local teamType = "default"
    local teamName = "Team"
    
    if Framework == "esx" and FrameworkObject then
        local playerData = FrameworkObject.GetPlayerData()
        if playerData and playerData.job then
            local jobName = playerData.job.name
            teamName = playerData.job.label or jobName
            
            -- Map job names to team types
            if jobName == "police" or jobName == "sheriff" or jobName == "lspd" then
                teamType = "police"
            elseif jobName == "ambulance" or jobName == "ems" or jobName == "doctor" then
                teamType = "ems"
            elseif jobName == "mechanic" or jobName == "bennys" then
                teamType = "mechanic"
            elseif jobName == "taxi" or jobName == "uber" then
                teamType = "taxi"
            end
        end
    elseif Framework == "qb" and FrameworkObject then
        local PlayerData = FrameworkObject.Functions.GetPlayerData()
        if PlayerData and PlayerData.job then
            local jobName = PlayerData.job.name
            teamName = PlayerData.job.label or jobName
            
            if jobName == "police" or jobName == "sheriff" or jobName == "lspd" then
                teamType = "police"
            elseif jobName == "ambulance" or jobName == "ems" or jobName == "doctor" then
                teamType = "ems"
            elseif jobName == "mechanic" or jobName == "bennys" then
                teamType = "mechanic"
            elseif jobName == "taxi" or jobName == "uber" then
                teamType = "taxi"
            end
        end
    end
    
    return teamType, teamName
end

function GetTeamOnlineCount(teamType)
    -- This would normally query the server for online team members
    -- For now, return a placeholder value
    return 5
end

function IsPlayerTeamAdmin()
    -- Check if player has admin ace permission
    return IsPlayerAceAllowed(PlayerId(), "hud.teamchat.admin")
end

-- ============================================================================
-- ACE PERMISSION CHECKS
-- ============================================================================

function HasTeamChatAccess()
    -- Check various ace permissions for team chat access
    local playerId = PlayerId()
    
    -- Check general team chat permission
    if IsPlayerAceAllowed(playerId, "hud.teamchat") then
        return true
    end
    
    -- Check job-specific permissions
    local teamType, _ = GetPlayerTeamInfo()
    
    if teamType == "police" and IsPlayerAceAllowed(playerId, "hud.teamchat.police") then
        return true
    end
    if teamType == "ems" and IsPlayerAceAllowed(playerId, "hud.teamchat.ems") then
        return true
    end
    if teamType == "mechanic" and IsPlayerAceAllowed(playerId, "hud.teamchat.mechanic") then
        return true
    end
    if teamType == "taxi" and IsPlayerAceAllowed(playerId, "hud.teamchat.taxi") then
        return true
    end
    
    -- Admin always has access
    if IsPlayerAceAllowed(playerId, "hud.teamchat.admin") then
        return true
    end
    
    -- Default: check if player has any job (for ESX/QB)
    if Framework then
        return true -- Most frameworks give job-based access
    end
    
    return false
end

-- ============================================================================
-- CHAT OPEN/CLOSE
-- ============================================================================

function OpenChat()
    isChatOpen = true
    SetNuiFocus(true, false) -- Focus for typing, no mouse cursor
    
    SendNUI("updateChat", {
        isOpen = true,
        messages = chatMessages,
        unreadCount = 0
    })
end

function CloseChat()
    isChatOpen = false
    SetNuiFocus(false, false)
    
    SendNUI("updateChat", {
        isOpen = false,
        messages = chatMessages,
        unreadCount = 0
    })
end

function OpenTeamChat()
    if not HasTeamChatAccess() then
        SendNotification("error", "Kein Zugriff", "Du hast keinen Zugriff auf den Team-Chat.", 3000)
        return
    end
    
    isTeamChatOpen = true
    SetNuiFocus(true, false)
    
    local teamType, teamName = GetPlayerTeamInfo()
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        hasAccess = true,
        teamType = teamType,
        teamName = teamName,
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(teamType),
        isAdmin = IsPlayerTeamAdmin()
    })
end

function CloseTeamChat()
    isTeamChatOpen = false
    SetNuiFocus(false, false)
    
    local teamType, teamName = GetPlayerTeamInfo()
    
    SendNUI("updateTeamChat", {
        isOpen = false,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType,
        teamName = teamName,
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(teamType),
        isAdmin = IsPlayerTeamAdmin()
    })
end

-- ============================================================================
-- KEY BINDINGS
-- ============================================================================

-- Chat öffnen (T)
RegisterCommand("+openchat", function()
    if not isChatOpen then
        OpenChat()
    end
end, false)

RegisterCommand("-openchat", function() end, false)
RegisterKeyMapping("+openchat", "Chat öffnen", "keyboard", "T")

-- Team Chat öffnen (Y)
RegisterCommand("+openteamchat", function()
    if not isTeamChatOpen then
        OpenTeamChat()
    end
end, false)

RegisterCommand("-openteamchat", function() end, false)
RegisterKeyMapping("+openteamchat", "Team-Chat öffnen", "keyboard", "Y")

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback("sendChatMessage", function(data, cb)
    if data.message and data.message ~= "" then
        -- Send to server
        TriggerServerEvent("hud:sendChatMessage", data.message)
    end
    cb({ success = true })
end)

RegisterNUICallback("sendTeamChatMessage", function(data, cb)
    if data.message and data.message ~= "" and HasTeamChatAccess() then
        -- Send to server
        TriggerServerEvent("hud:sendTeamChatMessage", data.message)
    end
    cb({ success = true })
end)

RegisterNUICallback("closeChat", function(data, cb)
    CloseChat()
    cb({ success = true })
end)

RegisterNUICallback("closeTeamChat", function(data, cb)
    CloseTeamChat()
    cb({ success = true })
end)

-- ============================================================================
-- EVENTS (From Server)
-- ============================================================================

-- Receive chat message from server
RegisterNetEvent("hud:receiveChatMessage", function(msgType, sender, message)
    SendChatMessage(msgType, sender, message)
end)

-- Receive team chat message from server
RegisterNetEvent("hud:receiveTeamChatMessage", function(sender, rank, message, isImportant)
    SendTeamChatMessage(sender, rank, message, isImportant)
end)

-- System message
RegisterNetEvent("hud:systemMessage", function(message)
    SendChatMessage("system", nil, message)
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("openChat", OpenChat)
exports("closeChat", CloseChat)
exports("openTeamChat", OpenTeamChat)
exports("closeTeamChat", CloseTeamChat)
exports("isChatOpen", function() return isChatOpen end)
exports("isTeamChatOpen", function() return isTeamChatOpen end)
exports("hasTeamChatAccess", HasTeamChatAccess)

exports("sendChatMessage", function(msgType, sender, message)
    SendChatMessage(msgType, sender, message)
end)

exports("sendTeamChatMessage", function(sender, rank, message, isImportant)
    SendTeamChatMessage(sender, rank, message, isImportant)
end)

exports("sendSystemMessage", function(message)
    SendChatMessage("system", nil, message)
end)
