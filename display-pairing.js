/**
 * Matches the displays Mutter reports against the ones ddcutil-service found.
 *
 * Both sides identify a display by model and serial. A pair of identical
 * displays shares that identity, so displays of the same key are paired in
 * order instead of by lookup, which keeps both of them controllable.
 *
 * The result keeps the order of `mutterDisplays`, which is the order the
 * displays are arranged on the desk.
 */
function pairDisplays(mutterDisplays, ddcDisplays) {
    let pairedCountPerKey = new Map()
    let pairedDisplays = []

    for (const mutterDisplay of mutterDisplays) {
        const candidates = ddcDisplays.get(mutterDisplay.key)

        if (candidates === undefined) {
            continue
        }

        const alreadyPaired = pairedCountPerKey.get(mutterDisplay.key) ?? 0

        if (alreadyPaired >= candidates.length) {
            continue
        }

        pairedCountPerKey.set(mutterDisplay.key, alreadyPaired + 1)

        pairedDisplays.push({ ...mutterDisplay, displayId: candidates[alreadyPaired].displayId })
    }

    return pairedDisplays
}

export { pairDisplays }
