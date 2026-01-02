-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- CHAT LOGIC
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

local function SendRegisteredCommandsToNUI()
    local commandList = CollectCommands()
    SendNUI("updateCommands", commandList)
    if Config and Config.Debug then
        print('[HUD Chat] Sent ' .. #commandList .. ' commands to NUI')
    end
end

local function CommandExists(cmdName)
    local commands = GetRegisteredCommands()
    for _, cmd in ipairs(commands) do
        if cmd.name == cmdName then
            return true
        end
    end
    return false
end

-- ============================================================================
-- START HANDLER
-- ============================================================================

AddEventHandler("onClientResourceStart", function(res)
    if res ~= GetCurrentResourceName() then return end
    SetTextChatEnabled(false)
end)

-- ============================================================================
-- VARIABLES
-- ============================================================================

local chatOpen = false
local chatInputActive = false

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
        local cmd = msg:sub(2)
        local cmdName = cmd:match("^(%S+)") or cmd
        
        if CommandExists(cmdName) then
            CloseChat()
            ExecuteCommand(cmdName)
        else
            TriggerEvent("hud:error", "Ausführung fehlgeschlagen", "Der Command '/" .. cmdName .. "' existiert nicht.")
        end
        
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

RegisterNUICallback("getCommands", function(data, cb)
    local commandList = CollectCommands()
    cb({ success = true, commands = commandList })
end)

-- ============================================================================
-- COMMAND SYNC
-- ============================================================================

CreateThread(function()
    while true do
        Wait(30000)
        SendRegisteredCommandsToNUI()
    end
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
