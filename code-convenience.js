function getPossibleBoolean(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_boolean()
    }

    return false
}

function getPossibleString(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_string()[0]
    }

    return null
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

export { areArraysEqual, devLog, getPossibleBoolean, getPossibleString, setIntersection, startsWith }
