import Gio from 'gi://Gio'

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
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.GetVcp 2 "" 16 0

        const result = await this._proxy.GetVcpAsync(displayId, "", 16, 0)
        const current = result[0]
        const max = result[1]
    
        return { current, max }
    }

    async _setBrightness(displayId, newValue) {
        // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.SetVcp 2 "" 16 35 0

        await this._proxy.SetVcpAsync(displayId, "", 16, newValue, 0)
    }

    // async _toggleDynamicSleep(enable) {
    //     this._proxy.DdcutilDynamicSleep = enable
    // }

    // async _setSleepMultiplier(displayId, multiplier) {
    //     // gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.SetSleepMultiplier 2 "" 1.5 0
    //     await this._proxy.SetSleepMultiplierAsync(displayId, "", multiplier, 0)
    // }
}

export { DdcutilService }
