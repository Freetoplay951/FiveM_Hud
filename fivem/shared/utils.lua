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

function GetTimestamp()
    local hour = GetClockHours()
    local minute = GetClockMinutes()
    return string.format("%02d:%02d", hour, minute)
end