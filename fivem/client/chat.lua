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

-- Cached values (updated via server callbacks)
local cachedTeamAccess = false
local cachedStaffRank = nil
local cachedStaffRankName = nil
local cachedStaffRankConfig = nil
local cachedIsAdmin = false
local cachedOnlineCount = 0
local lastPermissionCheck = 0

-- Request permission data from server
local function RequestPermissionData()
    TriggerServerEvent('hud:requestTeamPermissions')
end

-- Event handler for permission response from server
RegisterNetEvent('hud:teamPermissionsResponse', function(data)
    cachedTeamAccess = data.hasAccess or false
    cachedStaffRank = data.rankId
    cachedStaffRankName = data.rankName
    cachedIsAdmin = data.isAdmin or false
    cachedOnlineCount = data.onlineCount or 0
    
    if data.rankConfig then
        cachedStaffRankConfig = data.rankConfig
    end
    
    lastPermissionCheck = GetGameTimer()
    
    if Config and Config.Debug then
        print('[HUD Chat] Permission data received - Access: ' .. tostring(cachedTeamAccess) .. ', Rank: ' .. tostring(cachedStaffRankName) .. ', Online: ' .. tostring(cachedOnlineCount))
    end
end)

-- Request permissions on resource start
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    Wait(1000)
    RequestPermissionData()
    -- Send registered commands to NUI
    SendRegisteredCommandsToNUI()
end)

-- Refresh permissions periodically (every 30 seconds)
CreateThread(function()
    while true do
        Wait(30000)
        RequestPermissionData()
        -- Also refresh commands periodically
        SendRegisteredCommandsToNUI()
    end
end)
-- Generische Funktion zum Sammeln von Befehlen
local function CollectCommands()
    local commands = GetRegisteredCommands()
    local commandSet = {}
    local commandList = {}

    local excludedPrefixes = {"_", "sv_", "onesync_", "rateLimiter_", "adhesive_"} 

    for _, cmd in ipairs(commands) do
        local name = cmd.name
        local skip = false

        -- Interne Ressourcen ausschließen
        if cmd.resource == "internal" or cmd.resource == "monitor" then
            skip = true
        end

        -- Präfixe prüfen
        for _, prefix in ipairs(excludedPrefixes) do
            if name:match("^" .. prefix) then
                skip = true
                break
            end
        end

        if not skip and type(name) == "string" then
            local commandName = "/" .. name
            if not commandSet[commandName] then
                commandSet[commandName] = true
                table.insert(commandList, {
                    command = commandName,
                    description = "", -- FiveM liefert keine Beschreibungen
                    usage = commandName
                })
            end
        end
    end

    -- Alphabetisch sortieren
    table.sort(commandList, function(a, b)
        return a.command:lower() < b.command:lower()
    end)

    return commandList
end

-- Send all registered commands to NUI
function SendRegisteredCommandsToNUI()
    local commandList = CollectCommands()
    SendNUI("updateCommands", commandList)
    if Config and Config.Debug then
        print('[HUD Chat] Sent ' .. #commandList .. ' commands to NUI')
    end
end

-- NUI Callback to request commands
RegisterNUICallback("getCommands", function(data, cb)
    local commandList = CollectCommands()
    cb({ success = true, commands = commandList })
end)

function GetPlayerStaffRank()
    return cachedStaffRank, cachedStaffRankName, cachedStaffRankConfig
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
    return cachedOnlineCount
end

function IsPlayerTeamAdmin()
    return cachedIsAdmin
end

function HasTeamChatAccess()
    return cachedTeamAccess
end

function GetPlayerTeamInfo()
    if cachedStaffRank then
        return cachedStaffRank, Config and Config.TeamChatName or "Team-Chat"
    end
    return "default", Config and Config.TeamChatName or "Team-Chat"
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

function CommandExists(cmdName)
    local commands = GetRegisteredCommands()
    for _, cmd in ipairs(commands) do
        if cmd.name == cmdName then
            return true
        end
    end
    return false
end

RegisterNUICallback("sendChatMessage", function(data, cb)
    local msg = data.message
    if not msg then
        return cb({ success = false })
    end

    msg = msg:match("^%s*(.-)%s*$") -- trim

    if msg == "" then
        return cb({ success = false })
    end

    if msg:sub(1, 1) == "/" then
        -- IMPORTANT: close chat BEFORE executing commands, otherwise CloseChat() can override focus changes
        CloseChat()

        local cmd = msg:sub(2)
        if CommandExists(cmd) then
            ExecuteCommand(cmd)
        else
            TriggerEvent("hud:error", "Ausführung fehlgeschlagen", "Der Command '/" .. cmd .. "' existiert nicht.")
        end

        return cb({ success = true })
    end

    TriggerServerEvent("hud:sendChatMessage", msg)
    CloseChat()
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
