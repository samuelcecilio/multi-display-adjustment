# Displays adjustments GNOME shell extension

Offers sliders to control external displays' brightness and contrast through DDC/CI.

With multiple displays, multiple sliders are available.

![](./screenshot.png)

Extension relies on `ddcutil-service`. Installation process of `ddcutil-service` is quick and non-intrusive. `ddcutil-service` allows more responsive communication with the displays than calling `ddcutil`.

A convenient way to install GNOME extensions (including this extension) is to use [Extension Manager](https://flathub.org/apps/com.mattjakeman.ExtensionManager).

## Dependencies

* GNOME 46
* [_ddcutil-service_](https://github.com/digitaltrails/ddcutil-service)

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

In case sliders are not visible or they don't change the brightness/contrast, check if the underlaying `ddcutil` works.

Following call checks if the displays are reachable

```bash
ddcutil detect
```

Following call adjusts the brightness of the first display to 50%

```bash
ddcutil -d 1 setvcp 10 50
```

In case `ddcutil` works, describe [an issue](https://gitlab.com/w8jcik/displays-adjustments/-/issues) in the repository of this extension. Otherwise consider opening an issue in the `ddcutil` project.

Some workarounds for hardware are described in [the documentation](https://www.ddcutil.com) of `ddcutil`.

## License

This extension is distributed under the terms of the GNU General Public License, version 2 or later.
