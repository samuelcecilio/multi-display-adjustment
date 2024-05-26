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

export { areSetsEqual, devLog, getPossibleBoolean }
