import GObject from 'gi://GObject'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'

import { BrightnessSlider } from './brightness.js'
import { ContrastSlider } from './contrast.js'
import { areArraysEqual, devLog, setIntersection } from './code-convenience.js'
import { DisplayConfigService } from './display-config-service.js'
import { DdcutilService } from './ddcutil-service.js'


const DisplaysAdjustmentsIndicator = GObject.registerClass(
class DisplaysAdjustmentsIndicator extends SystemIndicator {
    
})

export default class DisplaysAdjustmentsExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._displayConfigService = new DisplayConfigService()
        this._ddcutilService = new DdcutilService()

        this._previousSlidersDisplaysIds = new Set()
    }

    async _destroySliders() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy())
        this._indicator.quickSettingsItems = []
    }

    async _rebuildSliders() {
        const mutterDisplays = await this._displayConfigService.getDisplays()
        const ddcDisplays = await this._ddcutilService.getDisplays()

        let ddcCapableDisplayIds = new Set()

        for (const ddcDisplay of ddcDisplays) {
            ddcCapableDisplayIds.add(`${ddcDisplay.model}#${ddcDisplay.serial}`)
        }

        let enabledDisplaysIds = new Set()

        for (const [key, display] of Object.entries(mutterDisplays)) {
            if (!display["enabled"]) {
                continue
            }

            enabledDisplaysIds.add(`${display.model}#${display.serial}`)
        }

        let slidersDisplaysIds = setIntersection(enabledDisplaysIds, ddcCapableDisplayIds)

        devLog("[displays-adjustments] previous slider ids", Array.from(this._previousSlidersDisplaysIds), "slider ids", Array.from(slidersDisplaysIds))

        if (areArraysEqual(Array.from(this._previousSlidersDisplaysIds), Array.from(slidersDisplaysIds)) && this._indicator.quickSettingsItems.length != 0) {
            return
        }

        this._previousSlidersDisplaysIds = slidersDisplaysIds

        this._destroySliders()

        for (const ddcDisplay of ddcDisplays) {
            if (!slidersDisplaysIds.has(`${ddcDisplay.model}#${ddcDisplay.serial}`)) {
                continue
            }

            const brightnessSlider = new BrightnessSlider(this._ddcutilService, ddcDisplay.displayId)
            const contrastSlider = new ContrastSlider(this._ddcutilService, ddcDisplay.displayId)

            this._indicator.quickSettingsItems.push(brightnessSlider)
            this._indicator.quickSettingsItems.push(contrastSlider)
            
            brightnessSlider._fetchInitialBrightness()
            contrastSlider._fetchInitialContrast()
        }

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator, 2)
    }

    async enable() {
        devLog("[displays-adjustments] Starting extension...")

        this._indicator = new DisplaysAdjustmentsIndicator()

        await this._displayConfigService.init()
        await this._ddcutilService._init()

        this._monitorsChangedSignalHandle = this._displayConfigService._proxy.connectSignal('MonitorsChanged', (proxy, nameOwner, args) => {
            this._rebuildSliders()
        })

        await this._rebuildSliders()

        devLog("[displays-adjustments] Done starting extension")
    }

    async disable() {
        this._destroySliders()

        this._indicator.destroy()
        this._indicator = null

        this._displayConfigService._proxy.disconnectSignal(this._monitorsChangedSignalHandle)
    }
}
