-- Chat System
-- Handles global and team chat with FiveM Ace Permissions

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isChatOpen = false
local isTeamChatOpen = false
local isChatInputActive = false
local isTeamChatInputActive = false
local chatMessages = {}
local teamChatMessages = {}
local lastChatActivity = 0
local lastTeamChatActivity = 0
local chatVisible = false
local teamChatVisible = false

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

local function GetTimestamp()
    local hour = GetClockHours()
    local minute = GetClockMinutes()
    return string.format("%02d:%02d", hour, minute)
end

-- ============================================================================
-- STAFF RANK & PERMISSION FUNCTIONS
-- ============================================================================

function GetPlayerStaffRank()
    local playerId = PlayerId()
    
    if not Config or not Config.TeamChatRanks then
        return nil, nil, nil
    end
    
    for _, rank in ipairs(Config.TeamChatRanks) do
        if IsPlayerAceAllowed(playerId, rank.permission) then
            return rank.id, rank.name, rank
        end
    end
    
    if Config.TeamChatGeneralPermission and IsPlayerAceAllowed(playerId, Config.TeamChatGeneralPermission) then
        local defaultRank = Config.TeamChatRanks[#Config.TeamChatRanks]
        if defaultRank then
            return defaultRank.id, defaultRank.name, defaultRank
        end
    end
    
    return nil, nil, nil
end

function GetRankConfig(rankId)
    if not Config or not Config.TeamChatRanks then return nil end
    
    for _, rank in ipairs(Config.TeamChatRanks) do
        if rank.id == rankId then
            return rank
        end
    end
    return nil
end

function GetTeamOnlineCount()
    return 3
end

function IsPlayerTeamAdmin()
    local playerId = PlayerId()
    
    if not Config or not Config.TeamChatRanks then return false end
    
    for _, rank in ipairs(Config.TeamChatRanks) do
        if rank.isAdmin and IsPlayerAceAllowed(playerId, rank.permission) then
            return true
        end
    end
    
    return false
end

function HasTeamChatAccess()
    local playerId = PlayerId()
    
    if not Config then return false end
    
    if Config.TeamChatGeneralPermission and IsPlayerAceAllowed(playerId, Config.TeamChatGeneralPermission) then
        return true
    end
    
    if Config.TeamChatRanks then
        for _, rank in ipairs(Config.TeamChatRanks) do
            if IsPlayerAceAllowed(playerId, rank.permission) then
                return true
            end
        end
    end
    
    return false
end

function GetPlayerTeamInfo()
    local rankId, rankName, rankConfig = GetPlayerStaffRank()
    if rankId then
        return rankId, Config.TeamChatName or "Team-Chat"
    end
    return "default", Config.TeamChatName or "Team-Chat"
end

-- ============================================================================
-- CHAT FUNCTIONS
-- ============================================================================

local function SendChatMessage(msgType, sender, message)
    local maxMessages = Config.ChatMaxMessages or 50
    
    local msg = {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message,
        timestamp = GetTimestamp()
    }
    
    table.insert(chatMessages, msg)
    if #chatMessages > maxMessages then
        table.remove(chatMessages, 1)
    end
    
    lastChatActivity = GetGameTimer()
    chatVisible = true
    
    SendNUI("updateChat", {
        isOpen = isChatOpen,
        isInputActive = isChatInputActive,
        isVisible = chatVisible,
        messages = chatMessages,
        unreadCount = isChatOpen and 0 or 1
    })
end

local function SendTeamChatMessage(sender, rank, message, isImportant)
    local maxMessages = Config.ChatMaxMessages or 50
    
    local msg = {
        id = tostring(GetGameTimer()),
        sender = sender,
        rank = rank,
        message = message,
        timestamp = GetTimestamp(),
        isImportant = isImportant or false
    }
    
    table.insert(teamChatMessages, msg)
    if #teamChatMessages > maxMessages then
        table.remove(teamChatMessages, 1)
    end
    
    lastTeamChatActivity = GetGameTimer()
    teamChatVisible = true
    
    local teamType, teamName = GetPlayerTeamInfo()
    local onlineMembers = GetTeamOnlineCount()
    
    SendNUI("updateTeamChat", {
        isOpen = isTeamChatOpen,
        isInputActive = isTeamChatInputActive,
        isVisible = teamChatVisible,
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
-- CHAT OPEN/CLOSE
-- ============================================================================

function OpenChat()
    isChatOpen = true
    isChatInputActive = true
    chatVisible = true
    lastChatActivity = GetGameTimer()
    SetNuiFocus(true, false)
    
    SendNUI("updateChat", {
        isOpen = true,
        isInputActive = true,
        isVisible = true,
        messages = chatMessages,
        unreadCount = 0
    })
    
    if Config.Debug then
        print('[HUD Chat] Chat opened')
    end
end

function CloseChat()
    isChatOpen = false
    isChatInputActive = false
    SetNuiFocus(false, false)
    lastChatActivity = GetGameTimer()
    
    SendNUI("updateChat", {
        isOpen = false,
        isInputActive = false,
        isVisible = chatVisible,
        messages = chatMessages,
        unreadCount = 0
    })
    
    if Config.Debug then
        print('[HUD Chat] Chat closed')
    end
end

function OpenTeamChat()
    if not HasTeamChatAccess() then
        SendNUI("notify", {
            type = "error",
            title = "Kein Zugriff",
            message = "Nur für Team-Mitglieder.",
            duration = 3000
        })
        return
    end
    
    isTeamChatOpen = true
    isTeamChatInputActive = true
    teamChatVisible = true
    lastTeamChatActivity = GetGameTimer()
    SetNuiFocus(true, false)
    
    local teamType, teamName, rankConfig = GetPlayerStaffRank()
    if not teamType then
        teamType = "default"
        teamName = "Staff"
    end
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        isInputActive = true,
        isVisible = true,
        hasAccess = true,
        teamType = teamType,
        teamName = Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin(),
        rankConfig = rankConfig
    })
    
    if Config.Debug then
        print('[HUD Chat] Team chat opened')
    end
end

function CloseTeamChat()
    isTeamChatOpen = false
    isTeamChatInputActive = false
    SetNuiFocus(false, false)
    lastTeamChatActivity = GetGameTimer()
    
    local teamType, _, rankConfig = GetPlayerStaffRank()
    
    SendNUI("updateTeamChat", {
        isOpen = false,
        isInputActive = false,
        isVisible = teamChatVisible,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType or "default",
        teamName = Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin(),
        rankConfig = rankConfig
    })
    
    if Config.Debug then
        print('[HUD Chat] Team chat closed')
    end
end

-- ============================================================================
-- CHAT FADE TIMER
-- ============================================================================

CreateThread(function()
    while true do
        Wait(1000)
        
        local fadeTime = (Config.ChatFadeTime or 10) * 1000
        local currentTime = GetGameTimer()
        
        if chatVisible and not isChatInputActive then
            if currentTime - lastChatActivity > fadeTime then
                chatVisible = false
                SendNUI("updateChat", {
                    isOpen = false,
                    isInputActive = false,
                    isVisible = false,
                    messages = chatMessages,
                    unreadCount = 0
                })
            end
        end
        
        if teamChatVisible and not isTeamChatInputActive then
            if currentTime - lastTeamChatActivity > fadeTime then
                teamChatVisible = false
                SendNUI("updateTeamChat", {
                    isOpen = false,
                    isInputActive = false,
                    isVisible = false,
                    hasAccess = HasTeamChatAccess(),
                    teamType = "default",
                    teamName = Config.TeamChatName or "Team-Chat",
                    messages = teamChatMessages,
                    unreadCount = 0,
                    onlineMembers = GetTeamOnlineCount(),
                    isAdmin = IsPlayerTeamAdmin()
                })
            end
        end
    end
end)

-- ============================================================================
-- KEY BINDINGS
-- ============================================================================

RegisterCommand("+openchat", function()
    if not isChatOpen and not isTeamChatOpen then
        OpenChat()
    end
end, false)

RegisterCommand("-openchat", function() end, false)
RegisterKeyMapping("+openchat", "Chat öffnen", "keyboard", "T")

RegisterCommand("+openteamchat", function()
    if not isTeamChatOpen and not isChatOpen then
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
        TriggerServerEvent("hud:sendChatMessage", data.message)
        CloseChat()
    end
    cb({ success = true })
end)

RegisterNUICallback("sendTeamChatMessage", function(data, cb)
    if data.message and data.message ~= "" and HasTeamChatAccess() then
        TriggerServerEvent("hud:sendTeamChatMessage", data.message)
        CloseTeamChat()
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

RegisterNetEvent("hud:receiveChatMessage", function(msgType, sender, message)
    SendChatMessage(msgType, sender, message)
end)

RegisterNetEvent("hud:receiveTeamChatMessage", function(sender, rank, message, isImportant)
    SendTeamChatMessage(sender, rank, message, isImportant)
end)

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
