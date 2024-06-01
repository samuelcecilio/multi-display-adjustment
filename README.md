# Displays GNOME shell extension

Offers switches to turn extra displays on and off, offers sliders to control their brightness.

![](./screenshot.png)

When using multiple displays one often wishes to turn selected displays on and off. GNOME settings panel allows that, but every time display is turned off it is loosing it's position in the layout of the displays. This extension remembers the last configuration that includes all the displays and uses it to preserve the layout, while offering simple on/off switches for each display.

To control brightness of external displays (through DDC) install `ddcutil-service`. Installation process of `ddcutil-service` is quick and non-intrusive. `ddcutil-service` allows more responsive communication with the displays than standalone calls to `ddcutil`.

A convenient way to install GNOME extensions, including this extension is to use [Extension Manager](https://flathub.org/apps/com.mattjakeman.ExtensionManager).

## Dependencies

* GNOME 46
* Python >= 3.6 (many distributions install it by the default)
* [_ddcutil-service_](https://github.com/digitaltrails/ddcutil-service) (optional, for brightness control)  

## Installation of _ddcutil-service_

  * [Ubuntu and Debian packages](https://gitlab.com/w8jcik/ddcutil-service.deb) (built by me)
  * [Arch AUR package](https://aur.archlinux.org/packages/ddcutil-service)
  * [OpenSUSE packages](https://software.opensuse.org/package/ddcutil-service)

### Manual installation

- Dependencies `ddcutil`, `libddcutil` and `glib`  
  For example in Ubuntu and Debian
  ```bash
  sudo apt install ddcutil libddcutil-dev libglib2.0-dev
  ```
- Build and install the service
  ```bash
  git clone git@github.com:digitaltrails/ddcutil-service.git
  cd ddcutil-service
  make
  make install
  ```
  Service installs to `~/.local/share/dbus-1/services/com.ddcutil.DdcutilService.service` and `~/.local/bin/ddcutil-service`.  
  It is activated after the next login.

## Diagnosing issues

In case the brightness sliders are not visible or they don't change the brightness, check if the underlaying `ddcutil` works.

Following call checks if the displays are reachable

```bash
ddcutil detect
```

Following call adjusts the brightness of the first display to 50%

```bash
ddcutil -d 1 setvcp 10 50
```

In case `ddcutil` works, describe [an issue](https://gitlab.com/w8jcik/displays/-/issues) in the repository of this extension. Otherwise consider opening an issue in the `ddcutil` project.

Some workarounds for hardware are described in [the documentation](https://www.ddcutil.com) of `ddcutil`.
