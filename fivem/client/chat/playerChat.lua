-- ============================================================================
-- FUNCTIONS
-- ============================================================================

local function CreateChatMessageData(msgType, sender, message)
    return {
        id = tostring(GetGameTimer()),
        type = msgType or "normal",
        sender = sender,
        message = message
    }
end

local function CreateChatMessage(msgType, sender, message)
    SendNUI("chatUpdate", {
        message = CreateChatMessageData(msgType, sender, message)
    })
end

-- Cache für Server-Commands
local serverCommandsCache = {}
local serverCommandsLoaded = false
local function CollectLocalCommands()
    local commands = GetRegisteredCommands()
    local commandSet = {}
    local commandList = {}

    for _, cmd in ipairs(commands) do
        if not ShouldSkipCommand(cmd) then
            local commandName = "/" .. cmd.name
            if not commandSet[commandName] then
                commandSet[commandName] = true
                table.insert(commandList, {
                    command = commandName,
                    description = "",
                    usage = commandName,
                    isServerCommand = false
                })
            end
        end
    end

    return commandList, commandSet
end

local function MergeCommands(localCommands, localSet, serverCommands)
    local merged = { table.unpack(localCommands) } -- lokale Commands direkt übernehmen

    for _, cmd in ipairs(serverCommands) do
        if not localSet[cmd.command] then
            table.insert(merged, cmd)
        end
    end

    table.sort(merged, function(a, b)
        return a.command:lower() < b.command:lower()
    end)

    return merged
end

local function CollectCommands()
    local localCommands, localSet = CollectLocalCommands()
    return MergeCommands(localCommands, localSet, serverCommandsCache)
end

local function RequestServerCommands()
    TriggerServerEvent('hud:requestServerCommands')
end

local function SendRegisteredCommandsToNUI()
    local commandList = CollectCommands()
    SendNUI("updateCommands", commandList)
    if Config and Config.Debug then
        print('[HUD Chat] Sent ' .. #commandList .. ' commands to NUI')
    end
end

RegisterNetEvent('hud:serverCommandsResponse', function(commands)
    serverCommandsCache = commands or {}
    serverCommandsLoaded = true
    
    if Config and Config.Debug then
        print('[HUD Chat] Received ' .. #serverCommandsCache .. ' server commands')
    end
    
    SendRegisteredCommandsToNUI()
end)

local function CommandExists(cmdName)
    for _, cmd in ipairs(GetRegisteredCommands() or {}) do
        if cmd.name == cmdName then
            return true
        end
    end

    local prefixedName = "/" .. cmdName
    for _, cmd in ipairs(serverCommandsCache or {}) do
        if cmd.command == prefixedName then
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
            ExecuteCommand(cmd)
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
        print('[HUD Chat] Loading commands')
    end
    
    -- Server-Commands anfordern (triggert automatisch SendRegisteredCommandsToNUI nach Response)
    RequestServerCommands()
    
    -- Fallback: Lokale Commands sofort senden
    SendRegisteredCommandsToNUI()
    
    -- Periodisch aktualisieren
    CreateThread(function()
        while true do
            Wait(30000)
            RequestServerCommands()
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
