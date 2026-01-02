-- ============================================================================
-- FUNCTIONS
-- ============================================================================

local function CreateChatMessageData(msgType, sender, message)
    return {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message,
        timestamp = GetTimestamp()
    }
end

local function CreateChatMessage(msgType, sender, message)
    SendNUI("chatUpdate", {
        message = CreateChatMessageData(msgType, sender, message)
    })
end

local function CollectCommands()
    local commands = GetRegisteredCommands()
    local commandSet = {}
    local commandList = {}

    local excludedPrefixes = {"_", "-", "sv_", "onesync_", "rateLimiter_", "adhesive_"} 

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

    SendNUI("chatUpdate", {
        isInputActive = true
    })
end

function CloseChat(message)
    chatInputActive = false
    SetNuiFocus(false, false)
    if message then
        SendNUI("chatUpdate", {
            isInputActive = false,
            message = message
        })
    else
        SendNUI("chatUpdate", {
            isInputActive = false
        })
    end
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
    
    local name = GetPlayerName(PlayerId()) or "Unknown"
    
    TriggerServerEvent("hud:sendChatMessage", msg)
    CloseChat(CreateChatMessageData("normal", name, msg))
    
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

AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD] Loading Commands')
    end
    
    SendRegisteredCommandsToNUI()
    
    CreateThread(function()
        while true do
            Wait(30000)
            SendRegisteredCommandsToNUI()
        end
    end)
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
    SendNUI("chatUpdate", {
        clearChat = true
    })
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
    SendNUI("chatUpdate", {
        clearChat = true
    })
end)
