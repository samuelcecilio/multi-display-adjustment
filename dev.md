# Development

## Clone

```bash
cd ~/.local/share/gnome-shell/extensions
git clone git@gitlab.com:w8jcik/toggle-displays.git displays-adjustments@w8jcik.gitlab.com
```

## Start

```bash
export MUTTER_DEBUG_DUMMY_MODE_SPECS="1366x768"
```

```bash
dbus-run-session -- gnome-shell --nested
```

## Dbus examples

This extension is using a Mutter interface called `DisplayConfig`

Consider example of three displays
  * `DP-1` `1920x1200@59.950`
  * `DP-2` `2560x1440@59.951`
  * `HDMI-2` `1680x1050@59.954`

Example retrieval of display configuration from Mutter using GJS

```js
// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources

const displayResources = await proxy.GetResourcesAsync()
console.log("[displays-adjustments] Display resources", displayResources)
const [rawSerial, crtcs, outputs, modes] = displayResources

// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetCurrentState

const currentState = await proxy.GetCurrentStateAsync()
console.log("[displays-adjustments] Current displays state", currentState)
const [rawSerial, monitors, logicalMonitors, properties] = currentState
```

## Logging

* Use `log` procedure to log messages.
* Use `journalctl -f` to see messages.
