const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value))

function getPossibleBoolean(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_boolean()
    }

    return false
}

export { areSetsEqual, getPossibleBoolean }
