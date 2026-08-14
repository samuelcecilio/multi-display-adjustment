import Gio from 'gi://Gio'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import { devLog } from './code-convenience.js'

class DdcutilService {
    // From github.com/digitaltrails/ddcutil-service/blob/main/ddcutil-service.c
    _ddcutilInterface = `
        <!DOCTYPE node PUBLIC
        '-//freedesktop//DTD D-BUS Object Introspection 1.0//EN'
        'http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd'>
        <node>
            <interface name='com.ddcutil.DdcutilInterface'>
                <!--
                    Detect:
                    @flags: If set to 1, any invalid VDUs will be included in the results.
                    @number_of_displays: The number of VDUs detected (the length of @detected_displays).
                    @detected_displays: An array of structures describing the VDUs.
                    @error_status: A libddcutil DDCRC error status.  DDCRC_OK (zero) if no errors have occurred.
                    @error_message: Text message for error_status.
            
                    Issues a detect and returns the VDUs detected.
            
                    The array @detected_displays will be of length @number_of_displays.
            
                    Each element of @detected_displays array will contain the fields
                    specified by the AttributesReturnedByDetect property.  The fields
                    will include the libddcutil display-number and a base64-encoded EDID.
                -->
                <method name='Detect'>
                    <arg name='flags' type='u' direction='in'/>
                    <arg name='number_of_displays' type='i' direction='out'/>
                    <arg name='detected_displays' type='a(iiisssqsu)' direction='out'/>
                    <arg name='error_status' type='i' direction='out'/>
                    <arg name='error_message' type='s' direction='out'/>
                </method>
            
                <!--
                    GetVcp:
                    @display_number: The libddcutil/ddcutil display number to query
                    @edid_txt: The base-64 encoded EDID of the display
                    @vcp_code: The VPC-code to query, for example, 16 (0x10) is brightness.
                    @flags: If 1, the @edid_txt is matched as a unique prefix of the EDID.
                    @vcp_current_value: The current numeric value as a unified 16 bit integer.
                    @vcp_max_value: The maximum possible value, to allow for easy calculation of current/max.
                    @vcp_formatted_value: A formatted version of the value including related info such as the max-value.
                    @error_status: A libddcutil DDCRC error status.  DDCRC_OK (zero) if no errors have occurred.
                    @error_message: Text message for error_status.
            
                    Retrieve the value for a VCP-code for the specified VDU.
            
                    For simplicity the @vcp_current_value returned will always be 16 bit integer. Most
                    VCP values are single byte 8-bit integers, very few are two-byte 16-bit.
            
                    The method's @flags parameter can be set to 2 (RETURN_RAW_VALUE),
                    see ddcutil-service.1 LIMITATIONS for an explanation.
            
                    The @vcp_formatted_value contains the current value along with any related info,
                    such as the maximum value, its similar to the output of the ddcutil getvcp shell-command.
                -->
                <method name='GetVcp'>
                    <arg name='display_number' type='i' direction='in'/>
                    <arg name='edid_txt' type='s' direction='in'/>
                    <arg name='vcp_code' type='y' direction='in'/>
                    <arg name='flags' type='u' direction='in'/>
                    <arg name='vcp_current_value' type='q' direction='out'/>
                    <arg name='vcp_max_value' type='q' direction='out'/>
                    <arg name='vcp_formatted_value' type='s' direction='out'/>
                    <arg name='error_status' type='i' direction='out'/>
                    <arg name='error_message' type='s' direction='out'/>
                </method>
            
                <!--
                    SetVcp:
                    @display_number: the libddcutil/ddcutil display number to alter
                    @edid_txt: the base-64 encoded EDID of the display
                    @vcp_code: the VPC-code to query.
                    @vcp_new_value: the numeric value as a 16 bit integer.
                    @flags: If 1, the @edid_txt is matched as a unique prefix of the EDID.
                    @error_status: A libddcutil DDCRC error status.  DDCRC_OK (zero) if no errors have occurred.
                    @error_message: Text message for error_status.
            
                    Set the value for a VCP-code for the specified VDU.
            
                    For simplicity the @vcp_new_value is always passed as a 16 bit integer (most
                    VCP values are single byte 8-bit integers, very few are two-byte 16-bit).
            
                    The method's @flags parameter can be set to 4 (NO_VERIFY) to disable
                    libddcutil verify and retry.  Verification and retry is the default.
                -->
                <method name='SetVcp'>
                    <arg name='display_number' type='i' direction='in'/>
                    <arg name='edid_txt' type='s' direction='in'/>
                    <arg name='vcp_code' type='y' direction='in'/>
                    <arg name='vcp_new_value' type='q' direction='in'/>
                    <arg name='flags' type='u' direction='in'/>
                    <arg name='error_status' type='i' direction='out'/>
                    <arg name='error_message' type='s' direction='out'/>
                </method>
            
                <!--
                    GetSleepMultiplier:
                    @display_number: the libddcutil/ddcutil display number to query
                    @edid_txt: the base-64 encoded EDID of the display
                    @vcp_code: the VPC-code to query, for example, 16 (0x10) is brightness.
                    @flags: If 1, the @edid_txt is matched as a unique prefix of the EDID.
                    @current_multiplier: the sleep multiplier.
                    @error_status: A libddcutil DDCRC error status.  DDCRC_OK (zero) if no errors have occurred.
                    @error_message: Text message for error_status.
            
                    Get the current libddcutil sleep multiplier for the specified VDU.
            
                    In more recent versions of libddcutil this value is generally managed automatically.
                -->
                <method name='GetSleepMultiplier'>
                    <arg name='display_number' type='i' direction='in'/>
                    <arg name='edid_txt' type='s' direction='in'/>
                    <arg name='flags' type='u' direction='in'/>
                    <arg name='current_multiplier' type='d' direction='out'/>
                    <arg name='error_status' type='i' direction='out'/>
                    <arg name='error_message' type='s' direction='out'/>
                </method>
            
                <!--
                    SetSleepMultiplier:
                    @display_number: The libddcutil/ddcutil display number to query
                    @edid_txt: The base-64 encoded EDID of the display
                    @vcp_code: The VPC-code to query, for example, 16 (0x10) is brightness.
                    @flags: If 1, the @edid_txt is matched as a unique prefix of the EDID.
                    @new_multiplier: The sleep multiplier.
                    @error_status: A libddcutil DDCRC error status.  DDCRC_OK (zero) if no errors have occurred.
                    @error_message: Text message for error_status.
            
                    Set the libddcutil sleep multiplier for the specified VDU.
            
                    In more recent versions of libddcutil this is generally managed automatically,
                    but this method is provided should manual control be necessary (due to problem hardware).
            
                    Prior to taking manual control of the sleep-multiplier, the DdcutilDynamicSleep property
                    should be set to false to prevent the multiplier from being automatically returned.
            
                    If the service is configuration-locked, an com.ddcutil.DdcutilService.Error.ConfigurationLocked
                    error is raised.
                -->
                <method name='SetSleepMultiplier'>
                    <arg name='display_number' type='i' direction='in'/>
                    <arg name='edid_txt' type='s' direction='in'/>
                    <arg name='new_multiplier' type='d' direction='in'/>
                    <arg name='flags' type='u' direction='in'/>
                    <arg name='error_status' type='i' direction='out'/>
                    <arg name='error_message' type='s' direction='out'/>
                </method>
            
                <!--
                    DdcutilDynamicSleep:
            
                    Enables/disables automatic adjustment of the sleep-multiplier. Before
                    using the SetSleepMultiplier method, this property should be set to false
                    to stop any automatic retuning of the multiplier.
            
                    Attempting to set this property when the service is configuration-locked
                    will result in an com.ddcutil.DdcutilService.Error.ConfigurationLocked error
                    being raised.
                -->
                <property type='b' name='DdcutilDynamicSleep' access='readwrite'/>
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

    async getDisplays() {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.Detect 8

        const ddcOnly = true

        let reply;

        try {
            reply = await this._proxy.DetectAsync(ddcOnly ? 0 : 1)
        } catch (exception) {
            if (exception.message.includes("org.freedesktop.DBus.Error.ServiceUnknown")) {
                Main.notify(
                    "Multi Display Adjustment extension",
                    "ddcutil-service is not available or failed to start. Please install ddcutil-service and login again to get the brightness and contrast control sliders. Alternatively disable or remove the Multi Display Adjustment extension."
                )
            }

            throw exception
        }

        /**
         * Keyed by model and serial, which is how displays are matched against
         * Mutter. A pair of identical displays can share that key, so every key
         * holds a list, in detection order.
         */
        let ddcDisplays = new Map()

        for (const display of reply[1]) {
            const displayId = display[0]
            const model = display[4]
            const serial = display[5]
            const binarySerial = display[8]

            let derivedSerial

            if (`${serial}` === '') {
                derivedSerial = `0x${binarySerial.toString(16).padStart(8, '0')}`  // this fallback is consistent with Mutter behavior
            } else {
                derivedSerial = serial
            }

            const key = `${model}#${derivedSerial}`

            if (!ddcDisplays.has(key)) {
                ddcDisplays.set(key, [])
            }

            ddcDisplays.get(key).push({ displayId, model, serial: derivedSerial })
        }

        devLog("[multi-display-adjustment] Retrieved displays from ddcutil-service", Array.from(ddcDisplays.values()).flat())

        return ddcDisplays
    }

    /**
     * Reads a VCP feature, for example 0x10 (brightness) or 0x12 (contrast).
     *
     * Returns null when the display does not support the feature or when the
     * service cannot be reached, so that callers can leave out the control
     * instead of showing a slider that does nothing.
     */
    async getVcp(displayId, vcpCode) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.GetVcp 2 "" 16 0

        let result

        try {
            result = await this._proxy.GetVcpAsync(displayId, "", vcpCode, 0)
        } catch (exception) {
            devLog(`[multi-display-adjustment] Reading VCP ${vcpCode} of display ${displayId} failed`, exception.message)

            return null
        }

        const [current, max, , errorStatus, errorMessage] = result

        if (errorStatus !== 0) {
            devLog(`[multi-display-adjustment] Display ${displayId} does not report VCP ${vcpCode}`, errorMessage)

            return null
        }

        return { current, max }
    }

    async setVcp(displayId, vcpCode, newValue) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.SetVcp 2 "" 16 35 0

        try {
            await this._proxy.SetVcpAsync(displayId, "", vcpCode, newValue, 0)
        } catch (exception) {
            devLog(`[multi-display-adjustment] Writing VCP ${vcpCode} of display ${displayId} failed`, exception.message)
        }
    }

    async _toggleDynamicSleep(enable) {
        this._proxy.DdcutilDynamicSleep = enable
    }

    async _setSleepMultiplier(displayId, multiplier) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.SetSleepMultiplier 2 "" 1.5 0
        await this._proxy.SetSleepMultiplierAsync(displayId, "", multiplier, 0)
    }
}

export { DdcutilService }
