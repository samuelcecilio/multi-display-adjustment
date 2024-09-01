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
    _init() {
        super._init()
    }
})

export default class DisplaysAdjustmentsExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._displayConfigService = new DisplayConfigService(metadata.path)
        this._ddcutilService = new DdcutilService()

        this._displayAdjustmentSliders = []
        this._previousSlidersDisplaysIds = new Set()
    }

    async _correctLayout(displays) {
        for (const display of await this._displayConfigService._getLayoutFromMutter()) {
            const key = display.model + "@" + display.connector

            if (key in displays) {
                displays[key].enabled = display.enabled
            }
        }

        return displays
    }

    async _destroyDisplayAdjustmentSliders() {
        this._displaysAdjustmentsIndicator.quickSettingsItems.forEach(item => item.destroy())
        this._displaysAdjustmentsIndicator.quickSettingsItems = []
        this._displayAdjustmentSliders = []
    }

    async _rebuildSliders() {
        const mutterDisplays = await this._displayConfigService.getDisplays()
        const ddcDisplays = await this._ddcutilService._getDisplays()

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

        let slidersDisplaysIds = setIntersection(ddcCapableDisplayIds, enabledDisplaysIds)

        devLog("[displays-adjustments] previous slider ids", Array.from(this._previousSlidersDisplaysIds), "slider ids", Array.from(slidersDisplaysIds))

        if (areArraysEqual(Array.from(this._previousSlidersDisplaysIds), Array.from(slidersDisplaysIds)) && this._displaysAdjustmentsIndicator.quickSettingsItems.length != 0) {
            return
        }

        this._destroyDisplayAdjustmentSliders()

        this._previousSlidersDisplaysIds = slidersDisplaysIds

        for (const ddcDisplay of ddcDisplays) {
            if (!slidersDisplaysIds.has(`${ddcDisplay.model}#${ddcDisplay.serial}`)) {
                continue
            }

            const brightnessSlider = new BrightnessSlider(this._ddcutilService, ddcDisplay.displayId)
            this._displayAdjustmentSliders.push(brightnessSlider)
            
            const contrastSlider = new ContrastSlider(this._ddcutilService, ddcDisplay.displayId)
            this._displayAdjustmentSliders.push(contrastSlider)

            this._displaysAdjustmentsIndicator.quickSettingsItems.push(brightnessSlider)
            this._displaysAdjustmentsIndicator.quickSettingsItems.push(contrastSlider)
            
            brightnessSlider._fetchInitialBrightness()
            contrastSlider._fetchInitialContrast()
        }

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._displaysAdjustmentsIndicator, 2)
    }

    async enable() {
        devLog("[displays-adjustments] Starting extension...")

        this._displaysAdjustmentsIndicator = new DisplaysAdjustmentsIndicator()

        await this._displayConfigService.init()
        await this._ddcutilService._init()

        this._handlerId = this._displayConfigService._proxy.connectSignal('MonitorsChanged', (proxy, nameOwner, args) => {
            this._rebuildSliders()
        })

        await this._rebuildSliders()

        devLog("[displays-adjustments] Done starting extension")
    }

    async disable() {
        this._destroyDisplayAdjustmentSliders()
        this._displaysAdjustmentsIndicator.destroy()
        this._displaysAdjustmentsIndicator = null

        this._displayConfigService._proxy.disconnectSignal(this._handlerId)
    }
}
