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
import { DisplayConfig } from './display-config.js'
import { DdcutilService } from './ddcutil-service.js'


const DisplayAdjustmentIndicator = GObject.registerClass(
class DisplayAdjustmentIndicator extends SystemIndicator {
    _init() {
        super._init()
    }
})

export default class ToggleDisplaysExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._displayConfig = new DisplayConfig(metadata.path)
        this._ddcutilService = new DdcutilService()

        this._displayAdjustmentSliders = []
        this._previousSlidersDisplaysIds = new Set()
    }

    async _correctLayout(displays) {
        for (const display of await this._displayConfig._getLayoutFromMutter()) {
            const key = display.model + "@" + display.connector

            if (key in displays) {
                displays[key].enabled = display.enabled
            }
        }

        return displays
    }

    async _destroyDisplayAdjustmentSliders() {
        this._displayAdjustmentIndicator.quickSettingsItems.forEach(item => item.destroy())
        this._displayAdjustmentIndicator.quickSettingsItems = []
        this._displayAdjustmentSliders = []
    }

    async _rebuildSliders() {
        const ddcDisplays = await this._ddcutilService._getDisplays()

        let ddcCapableDisplayIds = new Set()

        for (const ddcDisplay of ddcDisplays) {
            ddcCapableDisplayIds.add(`${ddcDisplay.model}#${ddcDisplay.serial}`)
        }

        let enabledDisplaysIds = new Set()

        for (const [key, display] of Object.entries(this._displays)) {
            if (!display["enabled"]) {
                continue
            }

            enabledDisplaysIds.add(`${display.model}#${display.serial}`)
        }

        let slidersDisplaysIds = setIntersection(ddcCapableDisplayIds, enabledDisplaysIds)

        devLog("[displays-adjustments] previous slider ids", "slider ids", Array.from(this._previousSlidersDisplaysIds), Array.from(slidersDisplaysIds))

        if (areArraysEqual(Array.from(this._previousSlidersDisplaysIds), Array.from(slidersDisplaysIds)) && this._displayAdjustmentIndicator.quickSettingsItems.length != 0) {
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

            this._displayAdjustmentIndicator.quickSettingsItems.push(brightnessSlider)
            this._displayAdjustmentIndicator.quickSettingsItems.push(contrastSlider)
            
            brightnessSlider._fetchInitialBrightness()
            contrastSlider._fetchInitialContrast()
        }

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._displayAdjustmentIndicator, 2)
    }

    async _getLastMatchingDisplayConfig() {
        await this._displayConfig.init()
        let displays = await this._displayConfig.getDisplays()

        const allDisplays = await this._displayConfig._getLayoutFromMutter()
        let allDisplaysIds = new Set()

        for (const display of allDisplays) {
            allDisplaysIds.add(`${display["model"]}@${display["connector"]}`)
        }

        let enabledDisplaysIds = new Set()

        for (const [key, display] of Object.entries(displays)) {
            enabledDisplaysIds.add(key)
        }

        return displays
    }

    async _init() {
        this._displays = await this._getLastMatchingDisplayConfig()

        await this._ddcutilService._init()
        await this._rebuildSliders()

        this._handlerId = this._displayConfig._proxy.connectSignal('MonitorsChanged', (_proxy, nameOwner, args) => {
            this._rebuildSliders()
        })
    }

    enable() {
        devLog("[displays-adjustments] Starting extension...")

        this._displayAdjustmentIndicator = new DisplayAdjustmentIndicator()

        this._init()

        devLog("[displays-adjustments] Done starting extension")
    }

    disable() {
        this._displayAdjustmentIndicator.quickSettingsItems.forEach(item => item.destroy())
        this._destroyDisplayAdjustmentSliders()
        this._displayAdjustmentIndicator.destroy()
        this._displayAdjustmentIndicator = null

        this._displayConfig._proxy.disconnectSignal(this._handlerId)
    }
}
