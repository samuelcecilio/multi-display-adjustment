import Gio from 'gi://Gio'

class DdcutilService {
    // https://github.com/digitaltrails/ddcutil-service/blob/master/ddcutil-service.7
    _ddcutilInterface = `
        <!DOCTYPE node PUBLIC
        '-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
        'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
        <node>
            <interface name="com.ddcutil.DdcutilInterface">
                <method name="GetVcp">
                    <arg name="display_number" direction="in" type="i" />
                    <arg name="edid_txt" direction="in" type="s" />
                    <arg name="vcp_code" direction="in" type="y" />
                    <arg name="flags" direction="in" type="u" />
                    <arg name="vcp_current_value" direction="out" type="q" />
                    <arg name="vcp_max_value" direction="out" type="q" />
                    <arg name="vcp_formatted_value" direction="out" type="s" />
                    <arg name="error_status" direction="out" type="i" />
                    <arg name="error_message" direction="out" type="s" />
                </method>

                <method name="SetVcp">
                    <arg name="display_number" direction="in" type="i" />
                    <arg name="edid_txt" direction="in" type="s" />
                    <arg name="vcp_code" direction="in" type="y" />
                    <arg name="vcp_new_value" direction="in" type="q" />
                    <arg name="flags" direction="in" type="u" />
                    <arg name="error_status" direction="out" type="i" />
                    <arg name="error_message" direction="out" type="s" />
                </method>

                <method name="Detect">
                    <arg name="flags" direction="in" type="u" />
                    <arg name="number_of_displays" direction="out" type="i" />
                    <arg name="detected_displays" direction="out" type="a(iiisssqsu)" />
                    <arg name="error_status" direction="out" type="i" />
                    <arg name="error_message" direction="out" type="s" />
                </method>
            </interface>
        </node>`

    async _initBrightnessProxy() {
        const BrightnessProxy = Gio.DBusProxy.makeProxyWrapper(this._ddcutilInterface)

        this._proxy = await new Promise((resolve, reject) => {
            BrightnessProxy(
                Gio.DBus.session, 'com.ddcutil.DdcutilService', '/com/ddcutil/DdcutilObject',
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
    }

    async _init() {
        await this._initBrightnessProxy()
    }

    async _getDisplays() {
        const ddcOnly = true

        const reply = await this._proxy.DetectAsync(ddcOnly ? 0 : 1)

        let ddcDisplays = []

        for (const display of reply[1]) {
            const displayId = display[0]
            const model = display[4]
            const serial = display[5]

            ddcDisplays.push({displayId, model, serial})
        }

        return ddcDisplays
    }

    async _getBrightness(displayId) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject \
        //     --method com.ddcutil.DdcutilInterface.GetVcp \
        //     2 "" 16 0

        const result = await this._proxy.GetVcpAsync(displayId, "", 16, 0)
        const current = result[0]
        const max = result[1]
    
        return { current, max }
    }

    async _setBrightness(displayId, newValue) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject \
        //     --method com.ddcutil.DdcutilInterface.SetVcp \
        //     2 "" 16 35 0

        await this._proxy.SetVcpAsync(displayId, "", 16, newValue, 0)
    }
}

export { DdcutilService }
