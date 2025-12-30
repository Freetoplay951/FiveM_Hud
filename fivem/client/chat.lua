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
-- STAFF RANK DETECTION
-- ============================================================================

-- Get player's staff rank based on Ace Permissions
function GetPlayerStaffRank()
    local playerId = PlayerId()
    
    -- Check from highest to lowest rank
    if IsPlayerAceAllowed(playerId, "hud.staff.owner") then
        return "owner", "Owner"
    elseif IsPlayerAceAllowed(playerId, "hud.staff.superadmin") then
        return "superadmin", "Super-Admin"
    elseif IsPlayerAceAllowed(playerId, "hud.staff.admin") then
        return "admin", "Admin"
    elseif IsPlayerAceAllowed(playerId, "hud.staff.moderator") then
        return "moderator", "Moderator"
    elseif IsPlayerAceAllowed(playerId, "hud.staff.supporter") then
        return "supporter", "Supporter"
    end
    
    return nil, nil
end

-- Get readable rank name
function GetStaffRankName(rankType)
    local rankNames = {
        owner = "Owner",
        superadmin = "Super-Admin",
        admin = "Admin",
        moderator = "Moderator",
        supporter = "Supporter"
    }
    return rankNames[rankType] or "Staff"
end

function GetTeamOnlineCount()
    -- This would normally query the server for online staff members
    -- For now, return a placeholder value
    return 3
end

function IsPlayerTeamAdmin()
    local playerId = PlayerId()
    -- Admin and above can use admin features
    return IsPlayerAceAllowed(playerId, "hud.staff.admin") or
           IsPlayerAceAllowed(playerId, "hud.staff.superadmin") or
           IsPlayerAceAllowed(playerId, "hud.staff.owner")
end

-- ============================================================================
-- ACE PERMISSION CHECKS (Staff only)
-- ============================================================================

function HasTeamChatAccess()
    local playerId = PlayerId()
    
    -- Check if player has any staff rank
    if IsPlayerAceAllowed(playerId, "hud.staff.supporter") then return true end
    if IsPlayerAceAllowed(playerId, "hud.staff.moderator") then return true end
    if IsPlayerAceAllowed(playerId, "hud.staff.admin") then return true end
    if IsPlayerAceAllowed(playerId, "hud.staff.superadmin") then return true end
    if IsPlayerAceAllowed(playerId, "hud.staff.owner") then return true end
    
    -- Generic staff permission
    if IsPlayerAceAllowed(playerId, "hud.staff") then return true end
    
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
        SendNotification("error", "Kein Zugriff", "Nur für Team-Mitglieder (Supporter, Admin, etc.).", 3000)
        return
    end
    
    isTeamChatOpen = true
    SetNuiFocus(true, false)
    
    local teamType, teamName = GetPlayerStaffRank()
    if not teamType then
        teamType = "supporter"
        teamName = "Team-Chat"
    end
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        hasAccess = true,
        teamType = teamType,
        teamName = "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin()
    })
end

function CloseTeamChat()
    isTeamChatOpen = false
    SetNuiFocus(false, false)
    
    local teamType, _ = GetPlayerStaffRank()
    
    SendNUI("updateTeamChat", {
        isOpen = false,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType or "supporter",
        teamName = "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
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
