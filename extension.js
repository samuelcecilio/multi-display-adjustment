import GObject from 'gi://GObject'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'

import { areArraysEqual, devLog } from './code-convenience.js'
import { DisplaysToggle } from './displays-menu.js'
import { DisplayConfigService } from './display-config-service.js'
import { DdcutilService } from './ddcutil-service.js'
import { pairDisplays } from './display-pairing.js'


const DisplaysAdjustmentsIndicator = GObject.registerClass(
class DisplaysAdjustmentsIndicator extends SystemIndicator {

})

export default class DisplaysAdjustmentsExtension extends Extension {
    async _syncDisplays() {
        /**
         * The extension can be disabled while these calls are in flight, for
         * example by the screen locking, which nulls the fields of this class.
         */
        const displayConfigService = this._displayConfigService
        const ddcutilService = this._ddcutilService

        const mutterDisplays = await displayConfigService.getDisplays()
        const ddcDisplays = await ddcutilService.getDisplays()

        if (this._toggle === null) {
            return
        }

        const displays = pairDisplays(mutterDisplays, ddcDisplays)

        const signature = displays.map(display => `${display.key}#${display.displayId}#${display.name}#${display.connector}`)

        devLog("[multi-display-adjustment] previous displays", this._previousSignature, "displays", signature)

        if (areArraysEqual(signature, this._previousSignature)) {
            return
        }

        this._previousSignature = signature

        this._toggle.setDisplays(displays)
    }

    async enable() {
        devLog("[multi-display-adjustment] Starting extension...")

        this._previousSignature = null

        this._displayConfigService = new DisplayConfigService()
        this._ddcutilService = new DdcutilService()

        this._indicator = new DisplaysAdjustmentsIndicator()
        this._toggle = new DisplaysToggle(
            this._ddcutilService, this.dir.get_child('icons'),
            this.getSettings(), () => this.openPreferences())

        this._indicator.quickSettingsItems.push(this._toggle)

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator)

        const displayConfigService = this._displayConfigService
        const ddcutilService = this._ddcutilService

        await displayConfigService.init()
        await ddcutilService._init()

        /**
         * disable can run while the proxies are being set up, for example when
         * the screen locks right after login. Nothing may be connected then.
         */
        if (this._toggle === null) {
            return
        }

        this._monitorsChangedSignalHandle = displayConfigService._proxy.connectSignal('MonitorsChanged', (proxy, nameOwner, args) => {
            this._syncDisplays()
        })

        await this._syncDisplays()

        devLog("[multi-display-adjustment] Done starting extension")
    }

    async disable() {
        if (this._monitorsChangedSignalHandle) {
            this._displayConfigService._proxy.disconnectSignal(this._monitorsChangedSignalHandle)
            this._monitorsChangedSignalHandle = null
        }

        this._indicator.quickSettingsItems.forEach(item => item.destroy())
        this._indicator.quickSettingsItems = []
        this._toggle = null

        this._indicator.destroy()
        this._indicator = null

        this._displayConfigService = null
        this._ddcutilService = null

        this._previousSignature = null
    }
}
