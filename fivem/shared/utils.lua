--- Print formatted table for debugging
--- @param tbl table The table to print
--- @param indent string? Indentation (internal use)
function DebugTable(tbl, indent)
    if not (Config and Config.Debug) then return end
    
    indent = indent or ""
    for key, value in pairs(tbl) do
        if type(value) == "table" then
            print(indent .. tostring(key) .. ":")
            DebugTable(value, indent .. "  ")
        else
            print(indent .. tostring(key) .. ": " .. tostring(value))
        end
    end
end

local excludedPrefixes = { "_", "+", "-", "sv_", "onesync_", "rateLimiter_", "adhesive_" }
function ShouldSkipCommand(cmd, playerId)
    if cmd.resource == "internal" then return true end
    if type(cmd.name) ~= "string" then return true end
    if cmd.name:find(":") then return true end
    
    for _, prefix in ipairs(excludedPrefixes) do
        if cmd.name:sub(1, #prefix) == prefix then
            return true
        end
    end

    if IsDuplicityVersion() then --isServer?
        if not IsPlayerAceAllowed(playerId, "command." .. cmd.name) then
            return true
        end
    end

    return false
end