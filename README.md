# Display Adjustment GNOME shell extension

Offers sliders to control external displays' brightness and contrast through DDC/CI.

With multiple displays, multiple sliders are available.

![](./screenshot.png)

Extension relies on `ddcutil-service`. Installation process of `ddcutil-service` is quick and non-intrusive. `ddcutil-service` allows more responsive communication with the displays than calling `ddcutil`.

A convenient way to install GNOME extensions (including this extension) is to use [Extension Manager](https://flathub.org/apps/com.mattjakeman.ExtensionManager).

## Dependencies

* GNOME 46-47
* [_ddcutil-service_](https://github.com/digitaltrails/ddcutil-service)

## Installation of _ddcutil-service_

### From a package

* [Ubuntu and Debian packages](https://gitlab.com/w8jcik/ddcutil-service.deb)
* [Arch AUR package](https://aur.archlinux.org/packages/ddcutil-service)
* [OpenSUSE packages](https://software.opensuse.org/package/ddcutil-service)

### Build by yourself

1. Install dependencies `ddcutil`, `libddcutil` and `glib`  
   For example in Ubuntu and Debian
   ```bash
   sudo apt install ddcutil libddcutil-dev libglib2.0-dev
   ```
2. Build and install the service
   ```bash
   git clone https://github.com/digitaltrails/ddcutil-service.git
   cd ddcutil-service
   make
   make install
   ```
   Service installs to `~/.local/share/dbus-1/services/com.ddcutil.DdcutilService.service` and  `~/.local/bin/ddcutil-service`. It is activated after the next login.

## Diagnosing issues

In case sliders are not visible or they don't change the brightness/contrast, check if the underlaying `ddcutil` works.

Following call checks if the displays are reachable

```bash
ddcutil detect
```

Following call adjusts the brightness of the first display to 50%

```bash
ddcutil -d 1 setvcp 10 50
```

In case `ddcutil` commands do not work:
- Check the [ddcutil notes on specific monitors](https://github.com/rockowitz/ddcutil/wiki/Notes-on-Specific-Monitors).
- Search in [the past issues of ddcutil](https://github.com/rockowitz/ddcutil/issues) using your monitor model or the error message.
- Finally consider opening an issue in the `ddcutil` project.

In case `ddcutil` works then this extension is at fault. Create [an issue](https://gitlab.com/w8jcik/display-adjustment/-/issues) in this project. Please attach:

- Output from
  ```sh
  ddcutil detect
  ```

- Output from
  ```sh
  ddcutil-service --version  # or ~/.local/bin/ddcutil-service --version
  ```

- Output from 
  ```sh
  gdbus call --session --dest=com.ddcutil.DdcutilService --object-path /com/ddcutil/DdcutilObject --method com.ddcutil.DdcutilInterface.Detect 8
  ```

- The error message visible in Alt + F2, `lg`, _Extensions_, _Display Adjustment_, _Show Errors_.

- Extra debug output from this extension (optional):

  1. Edit `~/.local/share/gnome-shell/extensions/display-adjustment@w8jcik.gitlab.com/code-convenience.js` 
     ```diff
       function devLog(...args) {
         // Enable during development to see the logs in journalctl -xef
     -   // log(...args)
     +   log(...args)
       } 
     ```
  2. Disable this extension.
  3. Re-login.
  4. Call `journalctl -xef`
  5. Enable this extension.

  Just after enabling the extension, messages will appear in the terminal marked with `[display-adjustment] ...` prefix. Copy them.

# Known issues

1. `ddcutil@2` (or maybe `ddcutil-service`) sometimes needs a bit of time after boot to calibrate. Calibration happens after the first use. That means that the first change of slider might change the actual brightness or contrast with a delay of about 10 seconds.
2. There are settings in displays that might lock the brightness control. Examples:
   - Iiyama's _Eco mode_ locks brightness at specific level. Just disable the _Eco mode_.
   - Eizo's ambient light sensor. With sensor enabled, the brightness slider still works, but not as you might expect. It sets the upper bound for brightness. Sensor can be disabled to get the manual control.
3. Extension relies on display's serial number to identify it. There are displays that don't report their serial number. Fallback mechanism is present, but not well tested. Feel free to open an issue for your display.

## License

This extension is distributed under the terms of the GNU General Public License, version 2 or later.
