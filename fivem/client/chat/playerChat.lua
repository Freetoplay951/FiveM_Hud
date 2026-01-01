-- ============================================================================
-- VARIABLES
-- ============================================================================

local chatMessages = {}
local chatVisible = false
local chatInputActive = false
local chatHideTimer = nil

-- ============================================================================
-- UTILITY
-- ============================================================================

local function ResetChatHideTimer()
    local fadeTime = (Config and Config.ChatFadeTime or 10) * 1000
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

-- ============================================================================
-- CHAT LOGIC
-- ============================================================================

local function SendChatMessage(msgType, sender, message)
    local maxMessages = Config and Config.ChatMaxMessages or 50

    table.insert(chatMessages, {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message,
        timestamp = GetTimestamp()
    })

    if #chatMessages > maxMessages then
        table.remove(chatMessages, 1)
    end

    chatVisible = true
    ResetChatHideTimer()

    SendNUI("updateChat", {
        isOpen = true,
        isVisible = true,
        messages = chatMessages,
        unreadCount = chatInputActive and 0 or 1
    })
end

-- ============================================================================
-- OPEN / CLOSE
-- ============================================================================

function OpenChat()
    chatInputActive = true
    chatVisible = true
    chatHideTimer = nil
    SetNuiFocus(true, false)

    SendNUI("updateChat", {
        isOpen = true,
        isVisible = true,
        messages = chatMessages,
        unreadCount = 0
    })
end

function CloseChat()
    chatInputActive = false
    SetNuiFocus(false, false)
    ResetChatHideTimer()

    SendNUI("updateChat", {
        isOpen = false,
        isVisible = chatVisible,
        messages = chatMessages,
        unreadCount = 0
    })
end

-- ============================================================================
-- COMMANDS & KEYS
-- ============================================================================

RegisterCommand("chat", OpenChat, false)
RegisterKeyMapping("chat", "Chat öffnen", "keyboard", Config and Config.ChatKey or "T")

RegisterCommand("closechat", CloseChat, false)

-- ============================================================================
-- NUI
-- ============================================================================

RegisterNUICallback("sendChatMessage", function(data, cb)
    local msg = (data.message or ""):match("^%s*(.-)%s*$")
    if msg == "" then return cb({ success = false }) end

    if msg:sub(1, 1) == "/" then
        CloseChat()
        ExecuteCommand(msg:sub(2))
        return cb({ success = true })
    end

    TriggerServerEvent("hud:sendChatMessage", msg)
    CloseChat()
    cb({ success = true })
end)

RegisterNUICallback("closeChat", function(_, cb)
    CloseChat()
    cb({ success = true })
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

RegisterNetEvent("hud:receiveChatMessage", function(msgType, sender, message)
    SendChatMessage(msgType, sender, message)
end)

RegisterNetEvent("hud:systemMessage", function(message)
    SendChatMessage("system", nil, message)
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("openChat", OpenChat)
exports("closeChat", CloseChat)
exports("isChatOpen", function() return chatInputActive end)
exports("isChatVisible", function() return chatVisible end)
exports("sendChatMessage", SendChatMessage)
exports("sendSystemMessage", function(msg)
    SendChatMessage("system", nil, msg)
end)
