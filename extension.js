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
import { QuickToggle, QuickMenuToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js'
import { PopupMenuSection } from 'resource:///org/gnome/shell/ui/popupMenu.js'


const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value))


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
    refreshEntries = (displays, proxy) => {
        let menu = this

        this._itemsSection.removeAll()

        for (const [key, display] of Object.entries(displays)) {
            let label = display.model

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

                // menu.refreshEntries(displays, proxy)
            })
        }
    }

    _init(extensionObject) {
        super._init({
            title: _('Displays'),
            iconName: 'video-display-symbolic',
            toggleMode: true,
        })

        this.menu.setHeader('video-display-symbolic', _('Displays'))

        this.connect('clicked', () => {
            if (this.checked) {
                console.log("[toggle-displays] Displays enabled")
            } else {
                console.log("[toggle-displays] Displays disabled")
            }
        })
    }
});

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    async _initProxy() {
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

        return proxy
    }

    async _readDisplays() {
        console.log("[toggle-displays] Reading configuration of displays...")

        // gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources

        // Get display resources
        const displayResources = await proxy.GetResourcesAsync()
        // console.log("[toggle-displays] Display resources", displayResources)
        const [rawSerial, crtcs, outputs, modes] = displayResources


        // Get display current state
        const currentState = await proxy.GetCurrentStateAsync()
        // console.log("[toggle-displays] Current displays state", currentState)
        const [_rawSerial, monitors, logicalMonitors, _properties] = currentState


        let resources = []

        for (const output of outputs) {
            const outputName = output[4]
            const modelName = output[7].product.unpack()

            resources.push({
                "outputName": outputName,
                "modelName": modelName,
                "enabled": true
            })
        }

        let displays = []

        if (resources.length == 1) {
            for (const monitor of monitors) {
                const outputName = monitor[0][0]
                const modelName = monitor[0][2]
                const mode = monitor[1][0][0]
                const enabled = true
                let isPrimary = false

                let x = 0
                let y = 0
                const width = 1366
                const height = 768

                // if (modelName == "EV2436W") { 
                //     x = 0
                //     y = 240
                // }

                // if (modelName == "DELL U2711") {
                //     x = 1920
                //     y = 0
                //     isPrimary = true
                // }

                // if (modelName == "DELL 2209WA") {
                //     x = 4480
                //     y = 390
                // }

                if (modelName == "MetaMonitor") {
                    isPrimary = true
                }

                displays.push({ outputName, x, y, width, height, isPrimary, mode, modelName, enabled })
            }
        } else {
            displays.push({
                outputName: "DP-1",
                x: 0,
                y: 240,
                width: 1920,
                height: 1200,
                isPrimary: false,
                mode: "1920x1200@59.950",
                modelName: "EV2436W",
                enabled: false
            })

            displays.push({
                outputName: "DP-2",
                x: 1920,
                y: 0,
                width: 2560,
                height: 1440,
                isPrimary: true,
                mode: "2560x1440@59.951",
                modelName: "DELL U2711",
                enabled: true
            })

            displays.push({
                outputName: "HDMI-2",
                x: 4480,
                y: 390,
                width: 1680,
                height: 1050,
                isPrimary: false,
                mode: "1680x1050@59.954",
                modelName: "DELL 2209WA",
                enabled: false
            })
        }

        this._displays = displays
    }

    async _getCurrentConnectors(proxy) {
        console.log("[toggle-displays] Reading configuration of displays...")

        // gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources

        const currentState = await proxy.GetCurrentStateAsync()
        const logicalMonitors = currentState[2]

        let outputNames = []

        for (const logicalMonitor of logicalMonitors) {
            for (const monitorSpec of logicalMonitor[5]) {
                outputNames.push(monitorSpec[2] + "@" + monitorSpec[0])
            }
        }

        return outputNames
    }

    async _getMonitorConfig() {
        Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async')

        // let rawMonitorsConfig = GLib.file_get_contents(GLib.get_home_dir() + '/.config/monitors.xml').toString()

        const proc = Gio.Subprocess.new(['python3', GLib.get_home_dir() + '/.local/share/gnome-shell/extensions/toggle-displays@w8jcik.gitlab.com/parse-monitors-config.py'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        const [stdout, stderr] = await proc.communicate_utf8_async(null, null);

        if (!proc.get_successful()) {
            throw new Error(stderr);
        }

        return stdout
    }

    sortPreset(preset) {
        return Object.fromEntries(
            Object.entries(preset).sort(([,a],[,b]) => a.x - b.x)
        )
    }

    async _setup() {
        this._proxy = await this._initProxy()
        const outputNames = await this._getCurrentConnectors(this._proxy)

        this._getMonitorConfig().then((rawPresets) => {
            for (const preset of JSON.parse(rawPresets)["presets"]) {
                if (areSetsEqual(new Set(Object.keys(preset)), new Set(outputNames))) {
                    this._displays = this.sortPreset(preset)
                    this._menu.refreshEntries(this._displays, this._proxy)
                    break
                }
            }

            this._displays = []
        })

        // this._readDisplays().then(() => {
        //     this._menu.refreshEntries(this._displays, this._proxy)
        // })
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

        this._setup()

        console.log("[toggle-displays] Done starting extension")
    }
})

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator()
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator)
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy())
        this._indicator.destroy()

        // this._menu.destroy()
    }
}
