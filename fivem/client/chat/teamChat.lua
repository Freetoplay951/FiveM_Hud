-- ============================================================================
-- VARIABLES
-- ============================================================================

local teamChatMessages = {}
local teamChatVisible = false
local teamChatInputActive = false
local teamChatHideTimer = nil

-- Permission Cache
local cachedTeamAccess = false
local cachedStaffRank = nil
local cachedStaffRankName = nil
local cachedStaffRankConfig = nil
local cachedIsAdmin = false
local cachedOnlineCount = 0

-- ============================================================================
-- UTILITY
-- ============================================================================

local function ResetTeamChatHideTimer()
    local fadeTime = (Config and Config.ChatFadeTime or 10) * 1000
    local timerId = GetGameTimer()
    teamChatHideTimer = timerId

    SetTimeout(fadeTime, function()
        if teamChatHideTimer == timerId and teamChatVisible and not teamChatInputActive then
            teamChatVisible = false
            SendNUI("updateTeamChat", {
                isOpen = false,
                isVisible = false,
                hasAccess = cachedTeamAccess,
                teamType = cachedStaffRank,
                teamName = Config and Config.TeamChatName or "Team-Chat",
                messages = teamChatMessages,
                unreadCount = 0,
                onlineMembers = cachedOnlineCount,
                isAdmin = cachedIsAdmin
            })
        end
    end)
end

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
end)

AddEventHandler("onClientResourceStart", function(res)
    if res ~= GetCurrentResourceName() then return end
    SetTextChatEnabled(false)
    Wait(1000)
    RequestPermissionData()
end)

CreateThread(function()
    while true do
        Wait(30000)
        RequestPermissionData()
    end
end)

-- ============================================================================
-- TEAM CHAT LOGIC
-- ============================================================================

local function SendTeamChatMessage(sender, rank, message, isImportant)
    local maxMessages = Config and Config.ChatMaxMessages or 50

    table.insert(teamChatMessages, {
        id = tostring(GetGameTimer()),
        sender = sender,
        rank = rank,
        message = message,
        timestamp = GetTimestamp(),
        isImportant = isImportant or false
    })

    if #teamChatMessages > maxMessages then
        table.remove(teamChatMessages, 1)
    end

    teamChatVisible = true
    ResetTeamChatHideTimer()

    SendNUI("updateTeamChat", {
        isOpen = true,
        isVisible = true,
        hasAccess = cachedTeamAccess,
        teamType = cachedStaffRank,
        teamName = Config and Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = teamChatInputActive and 0 or 1,
        onlineMembers = cachedOnlineCount,
        isAdmin = cachedIsAdmin
    })
end

-- ============================================================================
-- OPEN / CLOSE
-- ============================================================================

function OpenTeamChat()
    if not cachedTeamAccess then return end

    teamChatInputActive = true
    teamChatVisible = true
    teamChatHideTimer = nil
    SetNuiFocus(true, false)

    SendNUI("updateTeamChat", {
        isOpen = true,
        isVisible = true,
        hasAccess = true,
        teamType = cachedStaffRank,
        teamName = Config and Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = cachedOnlineCount,
        isAdmin = cachedIsAdmin
    })
end

function CloseTeamChat()
    teamChatInputActive = false
    SetNuiFocus(false, false)
    ResetTeamChatHideTimer()

    SendNUI("updateTeamChat", {
        isOpen = false,
        isVisible = teamChatVisible,
        hasAccess = cachedTeamAccess,
        teamType = cachedStaffRank,
        teamName = Config and Config.TeamChatName or "Team-Chat",
        messages = teamChatMessages,
        unreadCount = 0,
        onlineMembers = cachedOnlineCount,
        isAdmin = cachedIsAdmin
    })
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
        CloseTeamChat()
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

RegisterNetEvent("hud:receiveTeamChatMessage", SendTeamChatMessage)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("openTeamChat", OpenTeamChat)
exports("closeTeamChat", CloseTeamChat)
exports("isTeamChatOpen", function() return teamChatInputActive end)
exports("isTeamChatVisible", function() return teamChatVisible end)
exports("hasTeamChatAccess", function() return cachedTeamAccess end)
exports("sendTeamChatMessage", SendTeamChatMessage)
