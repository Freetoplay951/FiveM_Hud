-- Progressbar Client Script
-- Handles progressbar functionality with NUI-driven updates (no client-side loops)

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isProgressbarActive = false
local currentProgressbar = nil

-- Valid colors: "primary", "success", "warning", "critical", "info"
local ValidColors = {
    primary = true,
    success = true,
    warning = true,
    critical = true,
    info = true
}

-- ============================================================================
-- PROGRESSBAR FUNCTIONS
-- ============================================================================

--- Start a new progressbar
--- @param label string The label to display
--- @param duration number Duration in milliseconds
--- @param canCancel boolean|nil Whether the progressbar can be cancelled (default: false)
--- @param color string|nil The color theme: "primary", "success", "warning", "critical", "info" (default: "primary")
--- @param onFinish function|nil Callback when progressbar finishes
--- @param onCancel function|nil Callback when progressbar is cancelled
function StartProgressbar(label, duration, canCancel, color, onFinish, onCancel)
    if isProgressbarActive then
        if Config.Debug then
            print('[HUD Progressbar] Cannot start new progressbar - one is already active')
        end
        return false
    end
    
    -- Validate color
    local validColor = "primary"
    if color and ValidColors[color] then
        validColor = color
    end
    
    isProgressbarActive = true
    currentProgressbar = {
        label = label,
        duration = duration,
        canCancel = canCancel or false,
        color = validColor,
        onFinish = onFinish,
        onCancel = onCancel
    }
    
    -- Send start command to NUI - progress animation runs in browser
    SendNUI('progressbar:start', {
        label = label,
        duration = duration,
        canCancel = canCancel or false,
        color = validColor
    })
    
    if Config.Debug then
        print('[HUD Progressbar] Started: ' .. label .. ' (' .. duration .. 'ms, color: ' .. validColor .. ')')
    end
    
    return true
end

--- Cancel the current progressbar
function CancelProgressbar()
    if not isProgressbarActive then
        return false
    end
    
    local callback = currentProgressbar and currentProgressbar.onCancel
    
    isProgressbarActive = false
    currentProgressbar = nil
    
    SendNUI('progressbar:cancel', {})
    
    if callback then
        callback()
    end
    
    if Config.Debug then
        print('[HUD Progressbar] Cancelled')
    end
    
    return true
end

--- Check if a progressbar is currently active
--- @return boolean
function IsProgressbarActive()
    return isProgressbarActive
end

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

-- Called from NUI when progressbar finishes (reaches 100%)
RegisterNUICallback('progressbar:finish', function(data, cb)
    if not isProgressbarActive then
        cb({ success = false })
        return
    end
    
    local callback = currentProgressbar and currentProgressbar.onFinish
    
    isProgressbarActive = false
    currentProgressbar = nil
    
    if callback then
        callback()
    end
    
    if Config.Debug then
        print('[HUD Progressbar] Finished')
    end
    
    cb({ success = true })
end)

-- Called from NUI when progressbar is cancelled by user
RegisterNUICallback('progressbar:cancel', function(data, cb)
    if not isProgressbarActive then
        cb({ success = false })
        return
    end
    
    local callback = currentProgressbar and currentProgressbar.onCancel
    
    isProgressbarActive = false
    currentProgressbar = nil
    
    if callback then
        callback()
    end
    
    if Config.Debug then
        print('[HUD Progressbar] Cancelled by user')
    end
    
    cb({ success = true })
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('StartProgressbar', StartProgressbar)
exports('CancelProgressbar', CancelProgressbar)
exports('IsProgressbarActive', IsProgressbarActive)

-- ============================================================================
-- COMMANDS (Debug)
-- ============================================================================

if Config and Config.Debug then
    RegisterCommand('testprogress', function(source, args)
        local duration = tonumber(args[1]) or 5000
        local color = args[2] or 'primary'
        local canCancel = args[3] == 'true'
        
        StartProgressbar('Test Progressbar...', duration, canCancel, color, function()
            print('[HUD Progressbar] Test finished!')
        end, function()
            print('[HUD Progressbar] Test cancelled!')
        end)
    end, false)
end
