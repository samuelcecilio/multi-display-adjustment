/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

function getPossibleBoolean(variable, _property) {
    if (_property in variable) {
        return variable[_property].get_boolean()
    }

    return false
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

export { areArraysEqual, devLog, getPossibleBoolean, setIntersection, startsWith }
