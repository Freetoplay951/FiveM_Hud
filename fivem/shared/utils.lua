--[[
    Shared Utility Functions
    Used by both client and server scripts
]]

--- Format a number with thousands separators
--- @param number number The number to format
--- @param decimals number? Optional decimal places (default 0)
--- @return string
function FormatNumber(number, decimals)
    decimals = decimals or 0
    local formatted = string.format("%." .. decimals .. "f", number)
    
    -- Add thousands separators (German style with dots)
    local k
    while true do
        formatted, k = formatted:gsub("^(-?%d+)(%d%d%d)", "%1.%2")
        if k == 0 then break end
    end
    
    return formatted
end

--- Format seconds to MM:SS format
--- @param seconds number The seconds to format
--- @return string
function FormatTime(seconds)
    local mins = math.floor(seconds / 60)
    local secs = seconds % 60
    return string.format("%02d:%02d", mins, secs)
end

--- Format seconds to HH:MM:SS format
--- @param seconds number The seconds to format
--- @return string
function FormatTimeHMS(seconds)
    local hours = math.floor(seconds / 3600)
    local mins = math.floor((seconds % 3600) / 60)
    local secs = seconds % 60
    return string.format("%02d:%02d:%02d", hours, mins, secs)
end

--- Clamp a value between min and max
--- @param value number The value to clamp
--- @param min number? Minimum value (default 0)
--- @param max number? Maximum value (default 100)
--- @return number
function ClampPercent(value, min, max)
    min = min or 0
    max = max or 100
    return math.max(min, math.min(max, value))
end

--- Convert heading degrees to compass direction
--- @param heading number The heading in degrees
--- @return string
function HeadingToDirection(heading)
    local directions = {'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'}
    local index = math.floor(((heading % 360) + 22.5) / 45) % 8 + 1
    return directions[index]
end

--- Format money with currency symbol
--- @param amount number The amount to format
--- @param compact boolean? Use compact format (1K, 1M) (default false)
--- @return string
function FormatMoney(amount, compact)
    if compact then
        if amount >= 1000000 then
            return string.format("$%.1fM", amount / 1000000)
        elseif amount >= 1000 then
            return string.format("$%.1fK", amount / 1000)
        end
    end
    return "$" .. FormatNumber(amount)
end

--- Calculate percentage safely (avoid division by zero)
--- @param value number Current value
--- @param total number Total/max value
--- @return number Percentage between 0-100
function CalculatePercentage(value, total)
    if total == 0 then return 0 end
    return ClampPercent((value / total) * 100)
end

--- Generate a simple unique ID
--- @return string
function GenerateId()
    return tostring(GetGameTimer()) .. "-" .. tostring(math.random(100000, 999999))
end

--- Debug print (only when Config.Debug is true)
--- @param ... any Values to print
function DebugPrint(...)
    if Config and Config.Debug then
        print('[HUD Debug]', ...)
    end
end

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

--- Lerp (Linear interpolation) between two values
--- @param a number Start value
--- @param b number End value
--- @param t number Interpolation factor (0-1)
--- @return number
function Lerp(a, b, t)
    return a + (b - a) * ClampPercent(t, 0, 1) / 100 * 100
end

--- Round a number to specified decimal places
--- @param num number The number to round
--- @param decimals number? Decimal places (default 0)
--- @return number
function Round(num, decimals)
    decimals = decimals or 0
    local mult = 10 ^ decimals
    return math.floor(num * mult + 0.5) / mult
end
