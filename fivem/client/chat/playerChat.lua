-- ============================================================================
-- VARIABLES
-- ============================================================================

local chatOpen = false
local chatInputActive = false

-- ============================================================================
-- CHAT LOGIC
-- ============================================================================

local function CreateChatMessage(msgType, sender, message)
    local maxMessages = Config and Config.ChatMaxMessages or 50

    local newMessage = {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message,
        timestamp = GetTimestamp()
    }

    -- Send createMessage event to NUI
    SendNUI("chatCreateMessage", newMessage)
end

-- ============================================================================
-- OPEN / CLOSE
-- ============================================================================

function OpenChat()
    chatInputActive = true
    chatOpen = true
    SetNuiFocus(true, false)

    SendNUI("chatOpen", {
        isInputActive = true
    })
end

function CloseChat()
    chatInputActive = false
    SetNuiFocus(false, false)

    SendNUI("chatClose", {})
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
    CreateChatMessage(msgType, sender, message)
end)

RegisterNetEvent("hud:systemMessage", function(message)
    CreateChatMessage("system", nil, message)
end)

RegisterNetEvent("hud:clearChat", function()
    SendNUI("chatClear", {})
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("openChat", OpenChat)
exports("closeChat", CloseChat)
exports("isChatOpen", function() return chatOpen end)
exports("isChatInputActive", function() return chatInputActive end)
exports("sendChatMessage", CreateChatMessage)
exports("sendSystemMessage", function(msg)
    CreateChatMessage("system", nil, msg)
end)
exports("clearChat", function()
    SendNUI("chatClear", {})
end)
