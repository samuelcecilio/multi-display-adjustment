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
