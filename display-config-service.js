import Gio from 'gi://Gio'

import { devLog, getPossibleBoolean, getPossibleString, startsWith } from './code-convenience.js'


class DisplayConfigService {
    /**
     * Mutter offers DBus interface to read and write configuration of displays.
     * Code below should be able to retrieve description of this interface.
     * 
     *   import { loadInterfaceXML } from 'resource:///org/gnome/shell/misc/fileUtils.js'
     *   ...
     *   this._displayConfigInterface = loadInterfaceXML('org.gnome.Mutter.DisplayConfig')
     * 
     * Unfortunately org.gnome.Mutter.DisplayConfig.xml is not packaged by Ubuntu,
     * or maybe it is not packaged in general. At least, it is missing in the latest
     * Ubuntu 24.04 LTS with GNOME/Mutter 46.0.
     * 
     * This is why a copy of org.gnome.Mutter.DisplayConfig.xml is hard-coded here.
     * The copy includes only one signal and one method which this extension is using.
     * 
     * Notes:
     *  - Another project that talks to Mutter https://github.com/jadahl/gnome-monitor-config
     *    also ships it's own copy of org.gnome.Mutter.DisplayConfig.xml.
     *  - The content have been copied from https://gitlab.gnome.org/GNOME/mutter 46.2.
     *  - The latest version can be found at
     *    https://gitlab.gnome.org/GNOME/mutter/-/blob/main/data/dbus-interfaces/org.gnome.Mutter.DisplayConfig.xml
     */
    _displayConfigInterface = `
        <!DOCTYPE node PUBLIC
        '-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
        'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
        <node>
            <interface name="org.gnome.Mutter.DisplayConfig">
        
            <signal name="MonitorsChanged" />
        
            <method name="GetCurrentState">
                <arg name="serial" direction="out" type="u" />
                <arg name="monitors" direction="out" type="a((ssss)a(siiddada{sv})a{sv})" />
                <arg name="logical_monitors" direction="out" type="a(iiduba(ssss)a{sv})" />
                <arg name="properties" direction="out" type="a{sv}" />
            </method>

            </interface>
        </node>`

    async _initProxy() {
        devLog("[multi-display-adjustment] Initializing DisplayConfig DBus proxy...")

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

        devLog("[multi-display-adjustment] DisplayConfig DBus proxy is ready")
    }

    async init() {
        await this._initProxy()
    }

    /**
     * It only affects the order of the displays in the menu.
     *
     * Ordering left to right is simple but not ideal when
     * dealing with mulptiple rows of displays. Displays sharing
     * a column are ordered top to bottom.
     */
    _orderLeftToRight(displays) {
        return [...displays].sort((a, b) => a.x - b.x || a.y - b.y)
    }

    async _getLayoutFromMutter() {
        devLog("[multi-display-adjustment] Retrieving displays layout from Mutter...")

        const currentState = await this._proxy.GetCurrentStateAsync()

        let layout = { }

        for (const monitor of currentState[1]) {
            const monitorSpec = monitor[0]
            const modes = monitor[1]
            const monitorProperties = monitor[2]

            const connector = monitorSpec[0]
            const vendor = monitorSpec[1]
            const model = monitorSpec[2]
            const serial = monitorSpec[3]

            if (startsWith(connector, "None")) {
                continue
            }

            /**
             * Mutter exposes the same human readable name that Settings shows,
             * for example `LG Electronics 27"`. It is localized and it is a nicer
             * label than the raw EDID model, so it is preferred when available.
             */
            const name = getPossibleString(monitorProperties, "display-name") || `${vendor} ${model}`.trim() || connector

            for (const mode of modes) {
                const modeProperties = mode[6]

                if (getPossibleBoolean(modeProperties, "is-current")) {
                    layout[connector] = {
                        connector,
                        vendor,
                        model,
                        serial,
                        name,
                        width: mode[1],
                        height: mode[2],
                        enabled: true
                    }

                    break
                }
            }

            if (!(connector in layout)) {
                for (const mode of modes) {
                    const modeProperties = mode[6]

                    if (getPossibleBoolean(modeProperties, "is-preferred")) {
                        layout[connector] = {
                            connector,
                            vendor,
                            model,
                            serial,
                            name,
                            width: mode[1],
                            height: mode[2],
                            enabled: false
                        }

                        break
                    }
                }
            }
        }

        for (const logicalMonitor of currentState[2]) {
            const x = logicalMonitor[0]
            const y = logicalMonitor[1]

            for (const monitorSpec of logicalMonitor[5]) {
                const connector = monitorSpec[0]

                if (!(connector in layout)) {
                    continue
                }

                layout[connector]["x"] = x
                layout[connector]["y"] = y
            }
        }

        devLog("[multi-display-adjustment] Retrieved displays layout from Mutter", Object.values(layout))

        return Object.values(layout)
    }

    /**
     * Enabled displays, ordered by position, each one carrying the key
     * that ddcutil-service displays are matched against.
     *
     * Two displays of the same model can report the same key, so the result
     * is a list and not a map. Collapsing them into a map used to hide one
     * of the two sliders on setups with a pair of identical displays.
     */
    async getDisplays() {
        const layout = await this._getLayoutFromMutter()

        const enabledDisplays = layout
            .filter(display => display["enabled"])
            .map(display => ({ ...display, key: `${display["model"]}#${display["serial"]}` }))

        return this._orderLeftToRight(enabledDisplays)
    }
}

export { DisplayConfigService }
