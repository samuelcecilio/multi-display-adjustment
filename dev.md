# Development

## Clone

```bash
git clone git@github.com:samuelcecilio/multi-display-adjustment.git ~/Code/multi-display-adjustment
ln -s ~/Code/multi-display-adjustment \
      ~/.local/share/gnome-shell/extensions/multi-display-adjustment@cecilio.xyz
```

The symlink means edits in the working tree are picked up by the next shell restart,
with no need to run `./dist.sh`.

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
console.log("[multi-display-adjustment] Display resources", displayResources)
const [rawSerial, crtcs, outputs, modes] = displayResources

// gdbus call --session --dest=org.gnome.Mutter.DisplayConfig --object-path /org/gnome/Mutter/DisplayConfig --method org.gnome.Mutter.DisplayConfig.GetCurrentState

const currentState = await proxy.GetCurrentStateAsync()
console.log("[multi-display-adjustment] Current displays state", currentState)
const [rawSerial, monitors, logicalMonitors, properties] = currentState
```

## Logging

* Use `log` procedure to log messages.
* Use `journalctl -f` to see messages.
