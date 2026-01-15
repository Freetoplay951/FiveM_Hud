--[[
    Keybinds System for HUD
    Manages keybind registration and display using FiveM's native key mapping system
]]

-- ============================================================================
-- KEY CODE MAPPINGS
-- ============================================================================
-- Based on: https://gist.github.com/DemmyDemon/69d53b78b005a7c1a6fdb9036e401f4c

local KEY_CODES <const> = {
    b_4 = "D-pad Up",
    b_5 = "D-pad Down",
    b_6 = "D-pad Left",
    b_7 = "D-pad Right",
    b_16 = "Left Stick Press",
    b_18 = "Left Stick Up/Down",
    b_19 = "Left Stick Left/Right",
    b_25 = "Right Stick Press",
    b_27 = "Right Stick Up/Down",
    b_28 = "Right Stick Left/Right",
    b_30 = "A",
    b_31 = "B",
    b_32 = "X",
    b_33 = "Y",
    b_34 = "LB",
    b_35 = "LT",
    b_36 = "RB",
    b_37 = "RT",
    b_38 = "Start",
    b_39 = "Back",
    b_100 = "LMB",
    b_101 = "RMB",
    b_102 = "MMB",
    b_103 = "Mouse 4",
    b_104 = "Mouse 5",
    b_105 = "Mouse 6",
    b_106 = "Mouse 7",
    b_107 = "Mouse 8",
    b_108 = "Mouse Left",
    b_109 = "Mouse Right",
    b_110 = "Mouse Up",
    b_111 = "Mouse Down",
    b_112 = "Mouse Left/Right",
    b_113 = "Mouse Up/Down",
    b_114 = "Mouse",
    b_115 = "Scroll Up",
    b_116 = "Scroll Down",
    b_117 = "Scroll Wheel",
    b_130 = "Num -",
    b_131 = "Num +",
    b_134 = "Num *",
    b_135 = "Num Enter",
    b_136 = "Num 0",
    b_137 = "Num 1",
    b_138 = "Num 2",
    b_139 = "Num 3",
    b_140 = "Num 4",
    b_141 = "Num 5",
    b_142 = "Num 6",
    b_143 = "Num 7",
    b_144 = "Num 8",
    b_145 = "Num 9",
    b_170 = "F1",
    b_171 = "F2",
    b_172 = "F3",
    b_173 = "F4",
    b_174 = "F5",
    b_175 = "F6",
    b_176 = "F7",
    b_177 = "F8",
    b_178 = "F9",
    b_179 = "F10",
    b_180 = "F11",
    b_181 = "F12",
    b_194 = "Up Arrow",
    b_195 = "Down Arrow",
    b_196 = "Left Arrow",
    b_197 = "Right Arrow",
    b_198 = "Del",
    b_199 = "Esc",
    b_200 = "Ins",
    b_201 = "End",
    b_210 = "Delete",
    b_211 = "Insert",
    b_212 = "End",
    b_217 = "`",
    b_1000 = "L Shift",
    b_1001 = "R Shift",
    b_1002 = "Tab",
    b_1003 = "Enter",
    b_1004 = "Backspace",
    b_1005 = "Print Screen",
    b_1006 = "Scroll Lock",
    b_1007 = "Pause",
    b_1008 = "Home",
    b_1009 = "Page Up",
    b_1010 = "Page Down",
    b_1011 = "Num Lock",
    b_1012 = "Caps Lock",
    b_1013 = "L Ctrl",
    b_1014 = "R Ctrl",
    b_1015 = "L Alt",
    b_1016 = "R Alt",
    b_1017 = "Menu",
    b_1018 = "L Win",
    b_1019 = "R Win",
    b_2000 = "Space"
}

-- ============================================================================
-- VARIABLES
-- ============================================================================

local RegisteredKeybinds = {}
local isKeybindsOpen = false

-- ============================================================================
-- KEY MAPPING FUNCTIONS
-- ============================================================================

---Get the label of a key mapped command
---@param commandHash number
---@return string
local function GetKeyMappingKey(commandHash)
    local key = GetControlInstructionalButton(0, commandHash | 0x80000000, true)
    
    if string.find(key, "t_") then
        local label = string.gsub(key, "t_", "")
        return label
    else
        return KEY_CODES[key] or nil
    end
end

---Get key mappings for a list of command names using Fisher-Yates shuffle
---@param list table
---@return table
local function GetKeyMappings(list)
    -- Fisher-Yates shuffle
    local function shuffle(tbl)
        for i = #tbl, 2, -1 do
            local j = math.random(i)
            tbl[i], tbl[j] = tbl[j], tbl[i]
        end
    end

    local results = {}
    local invalid = {}

    for iteration = 1, 20 do
        shuffle(list)

        for _, v in ipairs(list) do
            if not invalid[v] then
                local key = GetKeyMappingKey(GetHashKey(v))

                if results[v] == nil then
                    results[v] = key
                elseif results[v] ~= key then
                    results[v] = nil
                    invalid[v] = true
                end
            end
        end
    end

    local final = {}
    for word, key in pairs(results) do
        if key ~= nil and not invalid[word] then
            final[word] = key
        end
    end

    return final
end

-- ============================================================================
-- COMMAND COLLECTION
-- ============================================================================

---Collect all registered commands and their keybinds
---@return table
local function CollectKeybindsAndCommands()
    local commands = GetRegisteredCommands()
    local finalCommands = {}
    local commandsForFunc = {}

    for _, cmd in ipairs(commands) do
        if not ShouldSkipCommand(cmd) then
            local commandData = {
                name = cmd.name,
                resource = cmd.resource,
                isAction = string.find(cmd.name, "+") ~= nil or string.find(cmd.name, "-") ~= nil
            }
            table.insert(finalCommands, commandData)
            table.insert(commandsForFunc, cmd.name)
        end
    end

    -- Get key mappings for all commands
    local keymappings = GetKeyMappings(commandsForFunc)

    -- Build final keybinds list
    local keybinds = {}
    local id = 1

    for _, cmd in ipairs(finalCommands) do
        local key = keymappings[cmd.name]
        if key then
            table.insert(keybinds, {
                id = tostring(id),
                command = "/" .. cmd.name,
                key = key,
                resource = cmd.resource,
                description = "",
                isAction = cmd.isAction
            })
            id = id + 1
        end
    end

    -- Add manually registered keybinds
    for _, bind in ipairs(RegisteredKeybinds) do
        table.insert(keybinds, {
            id = tostring(id),
            command = bind.command,
            key = bind.key,
            resource = bind.resource,
            description = bind.description,
            isAction = bind.isAction or false
        })
        id = id + 1
    end

    return keybinds
end

-- ============================================================================
-- KEYBINDS API
-- ============================================================================

local Keybinds = {}

---Register a keybind from another resource
---@param command string
---@param key string
---@param resource string|nil
---@param description string|nil
---@param isAction boolean|nil
function Keybinds.Register(command, key, resource, description, isAction)
    table.insert(RegisteredKeybinds, {
        command = command,
        key = key,
        resource = resource or GetCurrentResourceName(),
        description = description or "",
        isAction = isAction or false
    })
end

---Open keybinds menu
function Keybinds.Open()
    if isKeybindsOpen then return end
    
    local keybinds = CollectKeybindsAndCommands()
    
    SendNUI("keybindsUpdate", {
        isVisible = true,
        keybinds = keybinds
    })
    
    SetNuiFocus(true, true)
    isKeybindsOpen = true
    
    if Config and Config.Debug then
        print('[HUD Keybinds] Opened with ' .. #keybinds .. ' keybinds')
    end
end

---Close keybinds menu
function Keybinds.Close()
    if not isKeybindsOpen then return end
    
    SendNUI("keybindsUpdate", {
        isVisible = false
    })
    
    SetNuiFocus(false, false)
    isKeybindsOpen = false
    
    if Config and Config.Debug then
        print('[HUD Keybinds] Closed')
    end
end

---Toggle keybinds menu
function Keybinds.Toggle()
    if isKeybindsOpen then
        Keybinds.Close()
    else
        Keybinds.Open()
    end
end

---Check if keybinds menu is open
---@return boolean
function Keybinds.IsOpen()
    return isKeybindsOpen
end

-- ============================================================================
-- COMMANDS & KEY MAPPINGS
-- ============================================================================

RegisterKeyMapping('keybinds', 'Open Keybinds Menu', 'keyboard', Config and Config.KeybindsKey or 'k')

RegisterCommand('keybinds', function()
    Keybinds.Toggle()
end, false)

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback('closeKeybinds', function(data, cb)
    Keybinds.Close()
    cb({ success = true })
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('RegisterKeybind', Keybinds.Register)
exports('OpenKeybinds', Keybinds.Open)
exports('CloseKeybinds', Keybinds.Close)
exports('ToggleKeybinds', Keybinds.Toggle)
exports('IsKeybindsOpen', Keybinds.IsOpen)

return Keybinds
