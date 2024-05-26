import Gio from 'gi://Gio'

import { areSetsEqual, devLog, getPossibleBoolean } from './code-convenience.js'

/**
 * Retrieves layout of displays using Mutter interface called DisplayConfig
 * and GNOME configuration file stored in ~/.config/monitors.xml.
 * 
 * Using only current state:
 *  - Disabled displays are missing x/y shifts.
 * 
 * Using only configuration file:
 *  - Multiple configurations are available.  
 *    List of connected displays is needed to pick the right one.
 *  - Doesn't tell which display is on.
 *
 * As a consequence both sources need to be used to retrieve current layout
 * of the displays.
 */
class DisplayConfig {
    constructor(extensionLocation) {
        this._extensionLocation = extensionLocation
    }

    /**
     * Mutter offers DBus interface to read and write configuration of displays.
     * Code below should be able to retrieve description of this interface.
     * 
     *   import { loadInterfaceXML } from 'resource:///org/gnome/shell/misc/fileUtils.js'
     *   ...
     this._displayConfigInterface = loadInterfaceXML('org.gnome.Mutter.DisplayConfig')
     * 
     * Unfortunately org.gnome.Mutter.DisplayConfig.xml is not packaged by Ubuntu,
     * or maybe it is not packaged in general. At least, it is missing in the latest
     * Ubuntu 24.04 LTS with GNOME/Mutter 46.0.
     * 
     * This is why a copy of org.gnome.Mutter.DisplayConfig.xml is hard-coded here.
     * 
     * Notes:
     *  - Another project that talks to Mutter https://github.com/jadahl/gnome-monitor-config
     *    also ships it's own copy of org.gnome.Mutter.DisplayConfig.xml.
     *  - The content have been copied from https://gitlab.gnome.org/GNOME/mutter 46.2.
     */
    _displayConfigInterface = `
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

    async _initProxy() {
        devLog("[toggle-displays] Initializing DBus proxy...")

        const TestProxy = Gio.DBusProxy.makeProxyWrapper(this._displayConfigInterface)

        this._proxy = await new Promise((resolve, reject) => {
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

        devLog("[toggle-displays] DBus proxy is ready")
    }

    async init() {
        await this._initProxy()
    }

    /**
     * It only affects the order of the displays in the menu.
     * 
     * Ordering left to right is simple but not ideal when
     * dealing with mulptiple rows of displays.
     */
    _orderLeftToRight(preset) {
        return Object.fromEntries(
            Object.entries(preset).sort(([, a],[, b]) => a.x - b.x)
        )
    }

    /**
     * Retrieving layouts stored in ~/.config/monitors.xml. Parsing is done
     * with external Python script.
     */
    async _getLayoutsFromConfigFile() {
        devLog("[toggle-displays] Retrieving monitor config...")

        Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async')

        const proc = Gio.Subprocess.new(['python', this._extensionLocation + '/parse-monitors-config.py'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE)
        const [stdout, stderr] = await proc.communicate_utf8_async(null, null)

        if (!proc.get_successful()) {
            throw new Error(stderr)
        }

        devLog("[toggle-displays] Retrieved monitor config", stdout)

        return stdout
    }

    /** Pick layout based on currently connected set of displays. */
    async _getLayoutFromConfigFile(connectors) {
        const rawPresets = await this._getLayoutsFromConfigFile()

        for (const preset of JSON.parse(rawPresets)["presets"]) {
            if (areSetsEqual(new Set(Object.keys(preset)), new Set(connectors))) {
                return this._orderLeftToRight(preset)
            }
        }

        return []
    }

    async _getLayoutFromMutter() {
        devLog("[toggle-displays] Retrieving monitor config directly...")

        const currentState = await this._proxy.GetCurrentStateAsync()

        let layout = []

        for (const monitor of currentState[1]) {
            const monitorSpec = monitor[0]
            const modes = monitor[1]

            for (const mode of modes) {
                const modeProperties = mode[6]

                if (getPossibleBoolean(modeProperties, "is-preferred")) {
                    layout.push({
                        connector: monitorSpec[0],
                        model: monitorSpec[2],
                        serial: monitorSpec[3],
                        width: mode[1],
                        height: mode[2],
                        rate: mode[3],
                        rawRate: mode[0].split("@")[1],
                        enabled: getPossibleBoolean(modeProperties, "is-current")
                    })

                    break
                }
            }
        }

        devLog("[toggle-displays] Retrieved monitor config directly", layout)

        return layout
    }

    _getCurrentConnectors(layout) {
        devLog("[toggle-displays] Retrieving connectors...")

        let outputNames = []

        for (const display of layout) {
            outputNames.push(display["model"] + "@" + display["connector"])
        }

        devLog("[toggle-displays] Found connectors", outputNames)

        return outputNames
    }

    async getDisplays() {
        return await this._getLayoutFromConfigFile(this._getCurrentConnectors(await this._getLayoutFromMutter()))
    }

    /** Configure displays through Mutter. */
    async applyLayout(displays) {
        let xs = []
        let ys = []

        for (const [key, display] of Object.entries(displays)) {
            if (display.enabled) {
              xs.push(display.x)
              ys.push(display.y)
            }
        }

        const minX = Math.min(...xs)
        const minY = Math.min(...ys)

        let logicalMonitors = []

        for (const [key, display] of Object.entries(displays)) {
            if (!display.enabled) {
                continue
            }

            logicalMonitors.push([
                display.x - minX, display.y - minY, 1.0, 0, display.primary, [[ display.connector, '' + display.width + 'x' + display.height + '@' + display.rawRate, { } ]]
            ])
        }

        devLog("[toggle-displays] Applying layout", logicalMonitors)

        const serial = parseInt((await this._proxy.GetResourcesAsync())[0])
        const method = 1
        const properties = { }

        this._proxy.ApplyMonitorsConfigAsync(serial, method, logicalMonitors, properties)
    }
}

export { DisplayConfig }
