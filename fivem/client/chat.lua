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
-- STAFF RANK DETECTION (Uses Config.TeamChatRanks)
-- ============================================================================

-- Get player's staff rank based on configured Ace Permissions
function GetPlayerStaffRank()
    local playerId = PlayerId()
    
    -- Check ranks in order (first match = highest rank player has)
    for _, rank in ipairs(Config.TeamChatRanks) do
        if IsPlayerAceAllowed(playerId, rank.permission) then
            return rank.id, rank.name, rank
        end
    end
    
    -- Check general permission
    if Config.TeamChatGeneralPermission and IsPlayerAceAllowed(playerId, Config.TeamChatGeneralPermission) then
        -- Return first (lowest) rank as default
        local defaultRank = Config.TeamChatRanks[#Config.TeamChatRanks]
        if defaultRank then
            return defaultRank.id, defaultRank.name, defaultRank
        end
    end
    
    return nil, nil, nil
end

-- Get rank config by ID
function GetRankConfig(rankId)
    for _, rank in ipairs(Config.TeamChatRanks) do
        if rank.id == rankId then
            return rank
        end
    end
    return nil
end

function GetTeamOnlineCount()
    -- This would normally query the server for online staff members
    -- For now, return a placeholder value
    return 3
end

function IsPlayerTeamAdmin()
    local playerId = PlayerId()
    
    -- Check each rank for admin flag
    for _, rank in ipairs(Config.TeamChatRanks) do
        if rank.isAdmin and IsPlayerAceAllowed(playerId, rank.permission) then
            return true
        end
    end
    
    return false
end

-- ============================================================================
-- ACE PERMISSION CHECKS (Uses Config)
-- ============================================================================

function HasTeamChatAccess()
    local playerId = PlayerId()
    
    -- Check general permission first
    if Config.TeamChatGeneralPermission and IsPlayerAceAllowed(playerId, Config.TeamChatGeneralPermission) then
        return true
    end
    
    -- Check each configured rank
    for _, rank in ipairs(Config.TeamChatRanks) do
        if IsPlayerAceAllowed(playerId, rank.permission) then
            return true
        end
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
        SendNotification("error", "Kein Zugriff", "Nur für Team-Mitglieder.", 3000)
        return
    end
    
    isTeamChatOpen = true
    SetNuiFocus(true, false)
    
    local teamType, teamName, rankConfig = GetPlayerStaffRank()
    if not teamType then
        teamType = "default"
        teamName = "Staff"
    end
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        hasAccess = true,
        teamType = teamType,
        teamName = Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin(),
        rankConfig = rankConfig -- Send rank config for styling
    })
end

function CloseTeamChat()
    isTeamChatOpen = false
    SetNuiFocus(false, false)
    
    local teamType, _, rankConfig = GetPlayerStaffRank()
    
    SendNUI("updateTeamChat", {
        isOpen = false,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType or "default",
        teamName = Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin(),
        rankConfig = rankConfig
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
