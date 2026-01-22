-- ============================================================================
-- VARIABLES
-- ============================================================================

local teamChatOpen = false
local teamChatInputActive = false

-- Permission Cache
local cachedTeamAccess = false
local cachedStaffRank = nil
local cachedStaffRankName = nil
local cachedStaffRankConfig = nil
local cachedIsAdmin = false
local cachedOnlineCount = 0

local sendInitialData = true

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

local function RequestPermissionData()
    TriggerServerEvent("hud:requestTeamPermissions")
end

RegisterNetEvent("hud:teamPermissionsResponse", function(data)
    cachedTeamAccess = data.hasAccess or false
    cachedStaffRank = data.rankId
    cachedStaffRankName = data.rankName
    cachedStaffRankConfig = data.rankConfig
    cachedIsAdmin = data.isAdmin or false
    cachedOnlineCount = data.onlineCount or 0
    
    if sendInitialData then
        sendInitialData = false
        SendNUI("teamChatUpdate", {
            hasAccess = cachedTeamAccess,
            teamType = cachedStaffRank or "supporter",
            teamName = Config and Config.TeamChatName or "Team-Chat",
            onlineMembers = cachedOnlineCount,
            isAdmin = cachedIsAdmin
        })
    end
end)

AddEventHandler("onClientResourceStart", function(res)
    if res ~= GetCurrentResourceName() then return end
    SetTextChatEnabled(false)
end)

AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD TeamChat] Loading permissions')
    end
    
    RequestPermissionData()
    
    CreateThread(function()
        while true do
            Wait(30000)
            RequestPermissionData()
        end
    end)
end)

-- ============================================================================
-- TEAM CHAT LOGIC
-- ============================================================================

local function CreateTeamChatMessageData(sender, rank, message, isImportant, rankColor)
    return {
        id = tostring(GetGameTimer()),
        sender = sender,
        rank = rank,
        rankColor = rankColor,
        message = message,
        isImportant = isImportant or false
    }
end

local function CreateTeamChatMessage(sender, rank, message, isImportant, rankColor)
    SendNUI("teamChatUpdate", {
        message = CreateTeamChatMessageData(sender, rank, message, isImportant, rankColor)
    })
end

-- ============================================================================
-- OPEN / CLOSE
-- ============================================================================

function OpenTeamChat()
    if not cachedTeamAccess then
        TriggerEvent('hud:notify', 'error', 'Kein Zugriff', 'Nur für Team-Mitglieder.', 3000)
        return
    end

    teamChatInputActive = true
    teamChatOpen = true
    SetNuiFocus(true, false)

    SendNUI("teamChatUpdate", {
        isInputActive = true,
        hasAccess = true,
        teamType = cachedStaffRank or "supporter",
        teamName = Config and Config.TeamChatName or "Team-Chat",
        onlineMembers = cachedOnlineCount,
        isAdmin = cachedIsAdmin
    })
end

function CloseTeamChat(message)
    teamChatInputActive = false
    SetNuiFocus(false, false)
    if message then
        SendNUI("teamChatUpdate", {
            isInputActive = false,
            message = message
        })
    else
        SendNUI("teamChatUpdate", {
            isInputActive = false,
        })
    end
end

-- ============================================================================
-- COMMANDS
-- ============================================================================

RegisterCommand("tc", OpenTeamChat, false)
RegisterKeyMapping("tc", "Team-Chat öffnen", "keyboard", Config and Config.TeamChatKey or "Y")

RegisterCommand("closetc", CloseTeamChat, false)

-- ============================================================================
-- NUI
-- ============================================================================

RegisterNUICallback("sendTeamChatMessage", function(data, cb)
    if data.message and data.message ~= "" and cachedTeamAccess then
        TriggerServerEvent("hud:sendTeamChatMessage", data.message)
        
        local name = GetPlayerName(PlayerId()) or "Unknown"
        local rankColor = cachedStaffRankConfig and cachedStaffRankConfig.color or nil
        CloseTeamChat(CreateTeamChatMessageData(name, cachedStaffRankName, data.message, false, rankColor))
    end
    cb({ success = true })
end)

RegisterNUICallback("closeTeamChat", function(_, cb)
    CloseTeamChat()
    cb({ success = true })
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

RegisterNetEvent("hud:receiveTeamChatMessage", function(sender, rank, message, isImportant, rankColor)
    CreateTeamChatMessage(sender, rank, message, isImportant, rankColor)
end)

RegisterNetEvent("hud:clearTeamChat", function()
    SendNUI("teamChatUpdate", {
        clearChat = true
    })
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("openTeamChat", OpenTeamChat)
exports("closeTeamChat", CloseTeamChat)
exports("isTeamChatOpen", function() return teamChatOpen end)
exports("isTeamChatInputActive", function() return teamChatInputActive end)
exports("hasTeamChatAccess", function() return cachedTeamAccess end)
exports("sendTeamChatMessage", CreateTeamChatMessage)
exports("clearTeamChat", function()
    SendNUI("teamChatUpdate", {
        clearChat = true
    })
end)
