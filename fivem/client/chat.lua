-- Chat System
-- Handles global and team chat with FiveM Ace Permissions

-- ============================================================================
-- VARIABLES
-- ============================================================================

local chatMessages = {}
local teamChatMessages = {}
local chatVisible = false
local teamChatVisible = false
local chatInputActive = false
local teamChatInputActive = false

-- Auto-close timer
local chatHideTimer = nil
local teamChatHideTimer = nil

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

local function GetTimestamp()
    local hour = GetClockHours()
    local minute = GetClockMinutes()
    return string.format("%02d:%02d", hour, minute)
end

local function ResetChatHideTimer()
    local fadeTime = (Config and Config.ChatFadeTime or 10) * 1000
    
    if chatHideTimer then
        -- Cancel previous timer by setting flag
        chatHideTimer = nil
    end
    
    local timerId = GetGameTimer()
    chatHideTimer = timerId
    
    SetTimeout(fadeTime, function()
        if chatHideTimer == timerId and chatVisible and not chatInputActive then
            chatVisible = false
            SendNUI("updateChat", {
                isOpen = false,
                isVisible = false,
                messages = chatMessages,
                unreadCount = 0
            })
        end
    end)
end

local function ResetTeamChatHideTimer()
    local fadeTime = (Config and Config.ChatFadeTime or 10) * 1000
    
    if teamChatHideTimer then
        teamChatHideTimer = nil
    end
    
    local timerId = GetGameTimer()
    teamChatHideTimer = timerId
    
    SetTimeout(fadeTime, function()
        if teamChatHideTimer == timerId and teamChatVisible and not teamChatInputActive then
            teamChatVisible = false
            local teamType, teamName = GetPlayerTeamInfo()
            SendNUI("updateTeamChat", {
                isOpen = false,
                isVisible = false,
                hasAccess = HasTeamChatAccess(),
                teamType = teamType,
                teamName = teamName,
                messages = teamChatMessages,
                unreadCount = 0,
                onlineMembers = GetTeamOnlineCount(),
                isAdmin = IsPlayerTeamAdmin()
            })
        end
    end)
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
    -- TODO: Implement via server callback
    return 3
end

function IsPlayerTeamAdmin()
    -- Check via server callback since IsPlayerAceAllowed only works on server
    -- For now, return false - admin status should be checked server-side
    local rankId, _, rankConfig = GetPlayerStaffRank()
    return rankConfig and rankConfig.isAdmin or false
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
    local maxMessages = Config and Config.ChatMaxMessages or 50
    
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
    
    -- Show chat and reset timer
    chatVisible = true
    ResetChatHideTimer()
    
    SendNUI("updateChat", {
        isOpen = true,
        isVisible = true,
        messages = chatMessages,
        unreadCount = chatInputActive and 0 or 1
    })
end

local function SendTeamChatMessage(sender, rank, message, isImportant)
    local maxMessages = Config and Config.ChatMaxMessages or 50
    
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
    
    -- Show team chat and reset timer
    teamChatVisible = true
    ResetTeamChatHideTimer()
    
    local teamType, teamName = GetPlayerTeamInfo()
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        isVisible = true,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType,
        teamName = teamName,
        messages = teamChatMessages,
        unreadCount = teamChatInputActive and 0 or 1,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin()
    })
end

-- ============================================================================
-- CHAT OPEN/CLOSE
-- ============================================================================

function OpenChat()
    chatInputActive = true
    chatVisible = true
    SetNuiFocus(true, false)
    
    -- Cancel auto-hide timer
    chatHideTimer = nil
    
    SendNUI("updateChat", {
        isOpen = true,
        isVisible = true,
        messages = chatMessages,
        unreadCount = 0
    })
    
    if Config and Config.Debug then
        print('[HUD Chat] Chat opened')
    end
end

function CloseChat()
    chatInputActive = false
    SetNuiFocus(false, false)
    
    -- Start auto-hide timer
    ResetChatHideTimer()
    
    SendNUI("updateChat", {
        isOpen = false,
        isVisible = chatVisible,
        messages = chatMessages,
        unreadCount = 0
    })
    
    if Config and Config.Debug then
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
    
    teamChatInputActive = true
    teamChatVisible = true
    SetNuiFocus(true, false)
    
    -- Cancel auto-hide timer
    teamChatHideTimer = nil
    
    local teamType, teamName = GetPlayerTeamInfo()
    
    SendNUI("updateTeamChat", {
        isOpen = true,
        isVisible = true,
        hasAccess = true,
        teamType = teamType,
        teamName = Config and Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin()
    })
    
    if Config and Config.Debug then
        print('[HUD Chat] Team chat opened')
    end
end

function CloseTeamChat()
    teamChatInputActive = false
    SetNuiFocus(false, false)
    
    -- Start auto-hide timer
    ResetTeamChatHideTimer()
    
    local teamType, teamName = GetPlayerTeamInfo()
    
    SendNUI("updateTeamChat", {
        isOpen = false,
        isVisible = teamChatVisible,
        hasAccess = HasTeamChatAccess(),
        teamType = teamType,
        teamName = Config and Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = GetTeamOnlineCount(),
        isAdmin = IsPlayerTeamAdmin()
    })
    
    if Config and Config.Debug then
        print('[HUD Chat] Team chat closed')
    end
end

-- ============================================================================
-- KEY BINDINGS
-- ============================================================================

RegisterCommand("chat", function()
    OpenChat()
end, false)
RegisterKeyMapping("chat", "Chat öffnen", "keyboard", Config and Config.ChatKey or "T")

RegisterCommand("closechat", function() 
    CloseChat()
end, false)

RegisterCommand("tc", function()
    OpenTeamChat()
end, false)
RegisterKeyMapping("tc", "Team-Chat öffnen", "keyboard", Config and Config.TeamChatKey or "Y")

RegisterCommand("closetc", function() 
    CloseTeamChat()
end, false)

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
exports("isChatOpen", function() return chatInputActive end)
exports("isTeamChatOpen", function() return teamChatInputActive end)
exports("isChatVisible", function() return chatVisible end)
exports("isTeamChatVisible", function() return teamChatVisible end)
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
