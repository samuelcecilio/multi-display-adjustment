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
import GObject from 'gi://GObject'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import { QuickMenuToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { PopupMenuSection, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { devLog } from './code-convenience.js'
import { DisplayConfig } from './display-config.js'

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
            })
        }
    }

    async _setupToggleAction(displays) {
        let allDisplaysEnabled = true

        for (const [key, display] of Object.entries(displays)) {
            if (!display.enabled) {
                allDisplaysEnabled = false
            }
        }

        this.checked = allDisplaysEnabled

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

        // this._indicator = this._addIndicator()
        // this._indicator.iconName = 'video-display-symbolic'
    }
})

export default class ToggleDisplaysExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._displayConfig = new DisplayConfig(metadata.path)
    }

    async _asyncSetup() {
        await this._displayConfig.init()
        this._displays = await this._displayConfig.getDisplays()

        this._menu._refreshEntries(this._displays)
        this._menu._setupToggleAction(this._displays)
    }

    enable() {
        devLog("[toggle-displays] Starting extension...")

        this._indicator = new ToggleDisplaysIndicator()
        this._menu = new ToggleDisplaysMenuToggle(this._displayConfig)

        this._indicator.quickSettingsItems.push(this._menu)
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator)

        this._asyncSetup()

        devLog("[toggle-displays] Done starting extension")
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy())

        this._indicator.destroy()
        this._indicator = null

        // this._menu.destroy()
        // this._menu = null
    }
}
