/* extension.js
 *
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
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import { QuickMenuToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { PopupMenuSection, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { BrightnessSlider } from './brightness.js'
import { ContrastSlider } from './contrast.js'
import { devLog, emptyObject } from './code-convenience.js'
import { DisplayConfig } from './display-config.js'
import { DdcutilService } from './ddcutil-service.js'

const ToggleDisplaysMenuToggle = GObject.registerClass(
class ToggleDisplaysMenuToggle extends QuickMenuToggle {
    _refreshEntries(displays) {
        this._itemsSection.removeAll()

        const menu = this

        for (const [key, display] of Object.entries(displays)) {
            let label = display.model

            // .setOrnament(display.enabled ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE)

            if (display.enabled) {
                label += " ✔"
            }

            this._itemsSection.addAction(_(label), async () => {
                // gdbus call --session \
                //     --dest=org.gnome.Mutter.DisplayConfig \
                //     --object-path /org/gnome/Mutter/DisplayConfig \
                //     --method org.gnome.Mutter.DisplayConfig.ApplyMonitorsConfig \
                //     17 1 "[(0, 240, 1.0, 0, false, [('DP-1', '1920x1200@59.950', [])]), (1920, 0, 1.0, 0, true, [('DP-2', '2560x1440@59.951', [])]), (4480, 390, 1.0, 0, false, [('HDMI-2', '1680x1050@59.954', [])])]" "[]"

                display.enabled = !display.enabled

                await menu._displayConfig.applyLayout(displays)
                menu._refreshEntries(displays)
                menu._updateToggleState(displays)
            })
        }
    }

    _updateToggleState(displays) {
        let allDisplaysEnabled = true

        for (const [key, display] of Object.entries(displays)) {
            if (!display.enabled) {
                allDisplaysEnabled = false
                break
            }
        }

        this.checked = allDisplaysEnabled
    }

    async _setupToggleAction(displays) {
        this._updateToggleState(displays)

        this.connect('clicked', async () => {
            if (this.checked) {
                devLog("[toggle-displays] Enabling extra displays")

                for (const [key, display] of Object.entries(displays)) {
                    display.enabled = true
                }
            } else {
                devLog("[toggle-displays] Disabling extra displays")

                for (const [key, display] of Object.entries(displays)) {
                    if (!display.primary) {
                        display.enabled = false
                    }
                }
            }

            await this._displayConfig.applyLayout(displays)
            this._refreshEntries(displays)
            this._updateToggleState(displays)
        })
    }

    _init(displayConfig) {
        super._init({
            title: _('Displays'),
            iconName: 'video-display-symbolic',
            toggleMode: true,
        })

        this._displayConfig = displayConfig

        this.menu.setHeader('video-display-symbolic', _('Displays'))

        this._itemsSection = new PopupMenuSection()
        this.menu.addMenuItem(this._itemsSection)

        this.menu.addMenuItem(new PopupSeparatorMenuItem())
        this.menu.addSettingsAction(_('Display Settings'), 'gnome-display-panel.desktop')
    }
})

const ToggleDisplaysIndicator = GObject.registerClass(
class ToggleDisplaysIndicator extends SystemIndicator {
    _init() {
        super._init()

        // this._toggleDisplaysIndicator = this._addIndicator()
        // this._toggleDisplaysIndicator.iconName = 'video-display-symbolic'
    }
})

const DisplayAdjustmentIndicator = GObject.registerClass(
class DisplayAdjustmentIndicator extends SystemIndicator {
    _init() {
        super._init()

        // this._indicator = this._addIndicator()
        // this._indicator.iconName = 'video-display-symbolic'
    }
})

export default class ToggleDisplaysExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._displayConfig = new DisplayConfig(metadata.path)
        this._ddcutilService = new DdcutilService()
    }

    _storeLayout(displays) {
        let serializedDisplays = {}

        for (const [key, display] of Object.entries(displays)) {
            if (display.enabled) {
                const serializedDisplay = new GLib.Variant('a{sv}', {
                    x: GLib.Variant.new_uint32(display.x),
                    y: GLib.Variant.new_uint32(display.y),
                    scale: GLib.Variant.new_double(display.scale),
                    primary: GLib.Variant.new_boolean(display.primary),
                    connector: GLib.Variant.new_string(display.connector),
                    model: GLib.Variant.new_string(display.model),
                    serial: GLib.Variant.new_string(display.serial),
                    width: GLib.Variant.new_uint32(display.width),
                    height: GLib.Variant.new_uint32(display.height),
                    rate: GLib.Variant.new_double(display.rate),
                    rawRate: GLib.Variant.new_string(display.rawRate),
                    enabled: GLib.Variant.new_boolean(display.enabled)
                })

                serializedDisplays[display.model + "@" + display.connector] = serializedDisplay
            }
        }

        this._settings.set_value("layout", new GLib.Variant('a{sv}', serializedDisplays))
    }

    _loadLayout() {
        return this._settings.get_value("layout").recursiveUnpack()
    }

    async _correctLayout() {
        for (const display of await this._displayConfig._getLayoutFromMutter()) {
            const key = display.model + "@" + display.connector

            if (key in this._displays) {
                this._displays[key].enabled = display.enabled
            }
        }
    }

    _displayAdjustmentSliders = []

    async _destroyDisplayAdjustmentSliders() {
        this._displayAdjustmentSliders.forEach(item => item.destroy())
        this._displayAdjustmentSliders = []
    }

    async _rebuildSliders() {
        const ddcDisplays = await this._ddcutilService._getDisplays()

        this._destroyDisplayAdjustmentSliders()

        for (const ddcDisplay of ddcDisplays) {
            const brightnessSlider = new BrightnessSlider(this, ddcDisplay.displayId)
            this._displayAdjustmentSliders.push(brightnessSlider)
            this._displayAdjustmentIndicator.quickSettingsItems.push(brightnessSlider)
            
            const contrastSlider = new ContrastSlider(this, ddcDisplay.displayId)
            this._displayAdjustmentSliders.push(contrastSlider)
            this._displayAdjustmentIndicator.quickSettingsItems.push(contrastSlider)
            
            brightnessSlider._fetchInitialBrightness()
            contrastSlider._fetchInitialContrast()
        }

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._displayAdjustmentIndicator, 2)
    }

    async _init() {
        await this._displayConfig.init()
        this._displays = await this._displayConfig.getDisplays()

        if (!emptyObject(this._displays)) {
            devLog("[toggle-displays] Storing monitor config", this._displays)

            this._storeLayout(this._displays)
        } else {
            devLog("[toggle-displays] No matching layout have been found, restoring from storage")

            this._displays = this._loadLayout()
            await this._correctLayout()

            devLog("[toggle-displays] Restored layout", this._displays)
        }

        this._toggleDisplaysMenu._refreshEntries(this._displays)
        this._toggleDisplaysMenu._setupToggleAction(this._displays)

        await this._ddcutilService._init()
        await this._rebuildSliders()
    }

    enable() {
        devLog("[toggle-displays] Starting extension...")

        this._settings = this.getSettings()
        this._toggleDisplaysIndicator = new ToggleDisplaysIndicator()
        this._toggleDisplaysMenu = new ToggleDisplaysMenuToggle(this._displayConfig)
        this._toggleDisplaysIndicator.quickSettingsItems.push(this._toggleDisplaysMenu)
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._toggleDisplaysIndicator)

        this._displayAdjustmentIndicator = new DisplayAdjustmentIndicator()

        this._init()

        devLog("[toggle-displays] Done starting extension")
    }

    disable() {
        this._toggleDisplaysIndicator.quickSettingsItems.forEach(item => item.destroy())
        this._toggleDisplaysMenu.destroy()
        this._toggleDisplaysMenu = null
        this._toggleDisplaysIndicator.destroy()
        this._toggleDisplaysIndicator = null

        this._displayAdjustmentIndicator.quickSettingsItems.forEach(item => item.destroy())
        this._destroyDisplayAdjustmentSliders()
        this._displayAdjustmentIndicator.destroy()
        this._displayAdjustmentIndicator = null

        this._settings = null
    }
}
