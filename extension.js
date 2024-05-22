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
import Gio from 'gi://Gio'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import { QuickToggle, QuickMenuToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { PopupMenuSection, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'


// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources

const displayConfigInterface = `
<!DOCTYPE node PUBLIC
'-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
<node>
    <!--
        org.gnome.Mutter.DisplayConfig:
        @short_description: display configuration interface

        This interface is used by mutter and gnome-settings-daemon
        to apply multiple monitor configuration.
    -->

    <interface name="org.gnome.Mutter.DisplayConfig">
    <method name="GetResources">
        <arg name="serial" direction="out" type="u" />
        <arg name="crtcs" direction="out" type="a(uxiiiiiuaua{sv})" />
        <arg name="outputs" direction="out" type="a(uxiausauaua{sv})" />
        <arg name="modes" direction="out" type="a(uxuudu)" />
        <arg name="max_screen_width" direction="out" type="i" />
        <arg name="max_screen_height" direction="out" type="i" />
    </method>

    <method name="ApplyConfiguration">
        <arg name="serial" direction="in" type="u" />
        <arg name="persistent" direction="in" type="b" />
        <arg name="crtcs" direction="in" type="a(uiiiuaua{sv})" />
        <arg name="outputs" direction="in" type="a(ua{sv})" />
    </method>

    <method name="ChangeBacklight">
        <arg name="serial" direction="in" type="u" />
        <arg name="output" direction="in" type="u" />
        <arg name="value" direction="in" type="i" />
        <arg name="new_value" direction="out" type="i" />
    </method>

    <method name="GetCrtcGamma">
        <arg name="serial" direction="in" type="u" />
        <arg name="crtc" direction="in" type="u" />
        <arg name="red" direction="out" type="aq" />
        <arg name="green" direction="out" type="aq" />
        <arg name="blue" direction="out" type="aq" />
    </method>

    <method name="SetCrtcGamma">
        <arg name="serial" direction="in" type="u" />
        <arg name="crtc" direction="in" type="u" />
        <arg name="red" direction="in" type="aq" />
        <arg name="green" direction="in" type="aq" />
        <arg name="blue" direction="in" type="aq" />
    </method>

    <property name="PowerSaveMode" type="i" access="readwrite" />

    <property name="PanelOrientationManaged" type="b" access="read" />

    <property name="ApplyMonitorsConfigAllowed" type="b" access="read" />

    <property name="NightLightSupported" type="b" access="read" />

    <signal name="MonitorsChanged" />

    <method name="GetCurrentState">
        <arg name="serial" direction="out" type="u" />
        <arg name="monitors" direction="out" type="a((ssss)a(siiddada{sv})a{sv})" />
        <arg name="logical_monitors" direction="out" type="a(iiduba(ssss)a{sv})" />
        <arg name="properties" direction="out" type="a{sv}" />
    </method>

    <method name="ApplyMonitorsConfig">
        <arg name="serial" direction="in" type="u" />
        <arg name="method" direction="in" type="u" />
        <arg name="logical_monitors" direction="in" type="a(iiduba(ssa{sv}))" />
        <arg name="properties" direction="in" type="a{sv}" />
    </method>

    <method name="SetOutputCTM">
        <arg name="serial" direction="in" type="u" />
        <arg name="output" direction="in" type="u" />
        <arg name="ctm" direction="in" type="(ttttttttt)" />
    </method>
    </interface>
</node>`


const ExampleToggle = GObject.registerClass(
class ExampleToggle extends QuickToggle {
    constructor() {
        super({
            title: _('Smile'),
            iconName: 'face-smile-symbolic',
            toggleMode: true
        })
    }
})

const ExampleMenuToggle = GObject.registerClass(
class ExampleMenuToggle extends QuickMenuToggle {
    addEntries = (displayNames) => {
        for (const displayName of displayNames) {
            this._itemsSection.addAction(_(displayName), () => console.debug(displayName))
        }
    }

    _init(extensionObject) {
        super._init({
            title: _('Displays'),
            iconName: 'video-display-symbolic',
            toggleMode: true,
        })

        this.menu.setHeader('video-display-symbolic', _('Displays'))
    }
});

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    async _readDisplays() {
        console.log("[toggle-displays] Reading configuration of displays...")

        const TestProxy = Gio.DBusProxy.makeProxyWrapper(displayConfigInterface)

        let proxy

        try {
            proxy = await new Promise((resolve, reject) => {
                TestProxy(
                    Gio.DBus.session, 'org.gnome.Mutter.DisplayConfig', '/org/gnome/Mutter/DisplayConfig',
                    (proxy, error) => {
                        if (error === null) {
                            resolve(proxy)
                        } else {
                            reject(error)
                        }
                    },
                    null, Gio.DBusProxyFlags.NONE
                )
            })
        } catch (error) {
            console.debug(error)
        }

        const results = await proxy.GetResourcesAsync()

        console.log("[toggle-displays] Results", results)

        const [serial, crtcs, outputs, modes] = results

        let displays = []

        for (const output of outputs) {
            const outputName = output[4]
            const modelName = output[7].product.unpack()

            displays.push(modelName)
        }

        this._displays = displays
    }

    constructor() {
        super();

        console.log("[toggle-displays] Starting extension...")

        this._indicator = this._addIndicator()
        this._indicator.iconName = 'video-display-symbolic'

        this._menu = new ExampleMenuToggle()
        this._menu._itemsSection = new PopupMenuSection()
        this._menu.menu.addMenuItem(this._menu._itemsSection)
        this.quickSettingsItems.push(this._menu)

        this._readDisplays().then(() => {
            this._menu.addEntries(this._displays)
        })

        console.log("[toggle-displays] Done starting extension")
    }
});

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator()
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator)
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy())
        this._indicator.destroy()

        this._menu.destroy()
    }
}
