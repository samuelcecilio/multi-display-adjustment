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
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'
import { QuickMenuToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { PopupMenuSection, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { areSetsEqual, getPossibleBoolean } from './code-convenience.js'


// import { loadInterfaceXML } from 'resource:///org/gnome/shell/misc/fileUtils.js'
// const displayConfigInterface = loadInterfaceXML('org.gnome.Mutter.DisplayConfig')

const displayConfigInterface = `
<!DOCTYPE node PUBLIC
'-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
<node>
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


const ExampleMenuToggle = GObject.registerClass(
class ExampleMenuToggle extends QuickMenuToggle {
    refreshEntries = (displays, proxy) => {
        const menu = this

        this._itemsSection.removeAll()

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

                const method = 1
                let logicalMonitors = []
                const properties = { }

                let disabledX = 0

                for (const [key, display] of Object.entries(displays)) {
                    if (!display.enabled) {
                        disabledX += display.width
                        continue
                    }

                    logicalMonitors.push([
                        display.x - disabledX, display.y, 1.0, 0, display.primary, [[ display.connector, '' + display.width + 'x' + display.height + '@' + display.rawRate, { } ]]
                    ])
                }

                log(logicalMonitors)

                const [rawSerial, _crtcs, _outputs, _modes] = await proxy.GetResourcesAsync()

                proxy.ApplyMonitorsConfigAsync(parseInt(rawSerial), method, logicalMonitors, properties)

                menu.refreshEntries(displays, proxy)
            })
        }
    }

    async setupToggleAction(displays, proxy) {
        let allDisplaysEnabled = true

        for (const [key, display] of Object.entries(displays)) {
            if (!display.enabled) {
                allDisplaysEnabled = false
            }
        }

        this.checked = allDisplaysEnabled

        this.connect('clicked', async () => {
            if (this.checked) {
                console.log("[toggle-displays] Enabling extra displays")

                for (const [key, display] of Object.entries(displays)) {
                    display.enabled = true
                }
            } else {
                console.log("[toggle-displays] Disabling extra displays")

                for (const [key, display] of Object.entries(displays)) {
                    if (!display.primary) {
                        display.enabled = false
                    }
                }
            }

            const method = 1
            let logicalMonitors = []
            const properties = { }

            let disabledX = 0

            for (const [key, display] of Object.entries(displays)) {
                if (!display.enabled) {
                    disabledX += display.width
                    continue
                }

                logicalMonitors.push([
                    display.x - disabledX, display.y, 1.0, 0, display.primary, [[ display.connector, '' + display.width + 'x' + display.height + '@' + display.rawRate, { } ]]
                ])
            }

            log(logicalMonitors)

            const [rawSerial, _crtcs, _outputs, _modes] = await proxy.GetResourcesAsync()

            proxy.ApplyMonitorsConfigAsync(parseInt(rawSerial), method, logicalMonitors, properties)

            this.refreshEntries(displays, proxy)
        })
    }

    _init(extensionObject) {
        super._init({
            title: _('Displays'),
            iconName: 'video-display-symbolic',
            toggleMode: true,
        })

        this.menu.setHeader('video-display-symbolic', _('Displays'))

        this._itemsSection = new PopupMenuSection()
        this.menu.addMenuItem(this._itemsSection)

        this.menu.addMenuItem(new PopupSeparatorMenuItem())
        this.menu.addSettingsAction(_('Display Settings'), 'gnome-display-panel.desktop')
    }
})

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    _init(extensionObject) {
        super._init()

        // this._indicator = this._addIndicator()
        // this._indicator.iconName = 'video-display-symbolic'
    }
})

export default class ExampleExtension extends Extension {
    constructor(metadata) {
        super(metadata)

        this._extensionLocation = metadata.path
    }

    async _initProxy() {
        // log("[toggle-displays] Initializing DBus proxy...")

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

            log("[toggle-displays] DBus proxy is ready")
        } catch (error) {
            console.debug(error)
        }

        return proxy
    }

    async _getMonitorConfigDirectly() {
        // log("[toggle-displays] Retrieving monitor config directly...")

        const currentState = await this._proxy.GetCurrentStateAsync()
        const [_rawSerial, rawMonitors, _rawLogicalMonitors, _rawProperties] = currentState

        let layout = []

        for (const rawMonitor of rawMonitors) {
            const rawMonitorSpec = rawMonitor[0]
            const rawModes = rawMonitor[1]

            for (const rawMode of rawModes) {
                const rawProperties = rawMode[6]

                if (getPossibleBoolean(rawProperties, "is-preferred")) {
                    layout.push({
                        connector: rawMonitorSpec[0],
                        model: rawMonitorSpec[2],
                        serial: rawMonitorSpec[3],
                        width: rawMode[1],
                        height: rawMode[2],
                        rate: rawMode[3],
                        rawRate: rawMode[0].split("@")[1],
                        enabled: getPossibleBoolean(rawProperties, "is-current")
                    })

                    break
                }
            }
        }

        log("[toggle-displays] Retrieved monitor config directly", layout)

        return layout
    }

    _getCurrentConnectors(layout) {
        // log("[toggle-displays] Retrieving connectors...")

        let outputNames = []

        for (const display of layout) {
            outputNames.push(display["model"] + "@" + display["connector"])
        }

        log("[toggle-displays] Found connectors", outputNames)

        return outputNames
    }

    async _getMonitorConfig() {
        // log("[toggle-displays] Retrieving monitor config...")

        Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async')

        // let rawMonitorsConfig = GLib.file_get_contents(GLib.get_home_dir() + '/.config/monitors.xml').toString()

        const proc = Gio.Subprocess.new(['python', this._extensionLocation + '/parse-monitors-config.py'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE)
        const [stdout, stderr] = await proc.communicate_utf8_async(null, null)

        if (!proc.get_successful()) {
            throw new Error(stderr)
        }

        log("[toggle-displays] Retrieved monitor config", stdout)

        return stdout
    }

    sortPreset(preset) {
        return Object.fromEntries(
            Object.entries(preset).sort(([, a],[, b]) => a.x - b.x)
        )
    }

    async _getPresetIndirectly(connectors) {
        const rawPresets = await this._getMonitorConfig()

        for (const preset of JSON.parse(rawPresets)["presets"]) {
            if (areSetsEqual(new Set(Object.keys(preset)), new Set(connectors))) {
                return this.sortPreset(preset)
            }
        }

        return []
    }

    async _asyncSetup() {
        this._proxy = await this._initProxy()

        const layout = await this._getMonitorConfigDirectly()
        const connectors = this._getCurrentConnectors(layout)

        this._displays = await this._getPresetIndirectly(connectors)

        this._menu.refreshEntries(this._displays, this._proxy)
        this._menu.setupToggleAction(this._displays, this._proxy)
    }

    enable() {
        // log("[toggle-displays] Starting extension...")

        this._indicator = new ExampleIndicator(this)
        this._menu = new ExampleMenuToggle(this)

        this._indicator.quickSettingsItems.push(this._menu)
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator)

        this._asyncSetup()

        log("[toggle-displays] Done starting extension")
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy())

        this._indicator.destroy()
        this._indicator = null

        // this._menu.destroy()
        // this._menu = null
    }
}
