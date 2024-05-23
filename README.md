# Clone

```bash
cd ~/.local/share/gnome-shell/extensions
git clone https://gitlab.com/w8jcik/toggle-displays.git
```

`git clone git@gitlab.com:w8jcik/toggle-displays.git` for development.

# Start

```bash
export MUTTER_DEBUG_DUMMY_MODE_SPECS="1366x768"
export G_MESSAGES_DEBUG="GNOME Shell"

dbus-run-session -- gnome-shell --nested
```

When using `log`, messages are visible in `journalctl -xf`.

# Test interface

```bash
serial=$(gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources | awk ' { print $2 }' | grep -oE [0-9]+)

# ('DP-1', '1920x1200@59.950', [])
# ('DP-2', '2560x1440@59.951', [])
# ('HDMI-2', '1680x1050@59.954', [])

gdbus call --session \
    --dest=org.gnome.Mutter.DisplayConfig \
    --object-path /org/gnome/Mutter/DisplayConfig \
    --method org.gnome.Mutter.DisplayConfig.ApplyMonitorsConfig \
    ${serial} 1 "[(0, 240, 1.0, 0, false, [('DP-1', '1920x1200@59.950', [])]), (1920, 0, 1.0, 0, true, [('DP-2', '2560x1440@59.951', [])]), (4480, 390, 1.0, 0, false, [('HDMI-2', '1680x1050@59.954', [])])]" "[]"
```

# Unused

```js
// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetResources
// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetCurrentState

// Get display resources
const displayResources = await proxy.GetResourcesAsync()
console.log("[toggle-displays] Display resources", displayResources)
const [rawSerial, crtcs, outputs, modes] = displayResources


// Get display current state
const currentState = await proxy.GetCurrentStateAsync()
console.log("[toggle-displays] Current displays state", currentState)
const [_rawSerial, monitors, logicalMonitors, _properties] = currentState
```
