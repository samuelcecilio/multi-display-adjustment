const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value))

function getPossibleBoolean(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_boolean()
    }

    return false
}

function devLog(...args) {
    // Enable during development to see the logs in journalctl -xef
    // log(...args)
}

/**
 * Development inside of nested session is limited
 *   dbus-run-session -- gnome-shell --nested
 * 
 * It is not possible to control the displays. Yet the GUI can partially work
 * if correct list of displays and corresponding connectors is provided.
 */
function devOverrideOutputNames(outputNames) {
    // return ["EV2436W@DP-1", "DELL U2711@DP-2", "DELL 2209WA@HDMI-2"]
    return outputNames
}

export { areSetsEqual, devLog, devOverrideOutputNames, getPossibleBoolean }
