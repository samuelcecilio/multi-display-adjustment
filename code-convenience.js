const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value))

function getPossibleBoolean(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_boolean()
    }

    return false
}

function emptyObject(object_) {
    return Object.keys(object_).length === 0
}

function startsWith(text, beginning) {
    return text.substr(0, beginning.length) == beginning
}

function devLog(...args) {
    // Enable during development to see the logs in journalctl -xef
    // log(...args)
}

function areArraysEqual(array, otherArray) {
    return JSON.stringify(array) == JSON.stringify(otherArray)
}

function setIntersection(set, otherSet) {
    return new Set([...set].filter(item => otherSet.has(item)))
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

export { areArraysEqual, areSetsEqual, devLog, devOverrideOutputNames, emptyObject, getPossibleBoolean, setIntersection, startsWith }
