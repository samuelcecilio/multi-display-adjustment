# Development

## Clone

```bash
cd ~/.local/share/gnome-shell/extensions
git clone git@gitlab.com:w8jcik/toggle-displays.git displays@w8jcik.gitlab.com
glib-compile-schemas displays@w8jcik.gitlab.com/schemas/
```

## Start

```bash
export MUTTER_DEBUG_DUMMY_MODE_SPECS="1366x768"
```

```bash
dbus-run-session -- gnome-shell --nested
```

## Dbus examples

This extension largely depends on a Mutter interface called `DisplayConfig`

Consider example of three displays
  * `DP-1` `1920x1200@59.950`
  * `DP-2` `2560x1440@59.951`
  * `HDMI-2` `1680x1050@59.954`

Example call to distribute displays left to right

```bash
serial=$(gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources | awk ' { print $2 }' | grep -oE [0-9]+)

gdbus call --session \
    --dest=org.gnome.Mutter.DisplayConfig \
    --object-path /org/gnome/Mutter/DisplayConfig \
    --method org.gnome.Mutter.DisplayConfig.ApplyMonitorsConfig \
    ${serial} 1 "[(0, 240, 1.0, 0, false, [('DP-1', '1920x1200@59.950', [])]), (1920, 0, 1.0, 0, true, [('DP-2', '2560x1440@59.951', [])]), (4480, 390, 1.0, 0, false, [('HDMI-2', '1680x1050@59.954', [])])]" "[]"
```

Example retrieval of display configuration from Mutter using GJS

```js
// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources

const displayResources = await proxy.GetResourcesAsync()
console.log("[toggle-displays] Display resources", displayResources)
const [rawSerial, crtcs, outputs, modes] = displayResources

// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetCurrentState

const currentState = await proxy.GetCurrentStateAsync()
console.log("[toggle-displays] Current displays state", currentState)
const [rawSerial, monitors, logicalMonitors, properties] = currentState
```

## Display configuration from GNOME settings

Example reading of display configurations from `~/.config/monitors.xml`

```bash
python parse-monitors-config.py --indent
```
