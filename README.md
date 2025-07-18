# Display Adjustment GNOME shell extension

Offers sliders to control external displays' brightness and contrast through DDC/CI.

With multiple displays, multiple sliders are available.

![](./screenshot.png)

Extension relies on `ddcutil-service`. Installation process of `ddcutil-service` is quick and non-intrusive. `ddcutil-service` allows more responsive communication with the displays than calling `ddcutil`.

## Dependencies

* GNOME 46-48
* [_ddcutil-service_](https://github.com/digitaltrails/ddcutil-service)

A convenient way to install GNOME extensions (including this extension) is to use [Extension Manager](https://flathub.org/apps/com.mattjakeman.ExtensionManager).

## Installation of _ddcutil-service_

`ddcutil-service` can be installed from a package or built and installed from the source code.

### From a package

* [Ubuntu and Debian packages](https://gitlab.com/w8jcik/ddcutil-service.deb)
* [Arch AUR package](https://aur.archlinux.org/packages/ddcutil-service)
* [OpenSUSE packages](https://software.opensuse.org/package/ddcutil-service)

### Build by yourself

1. __Install dependencies `ddcutil`, `libddcutil` and `glib`__  
   For example in Ubuntu and Debian
   ```bash
   sudo apt install ddcutil libddcutil-dev libglib2.0-dev
   ```
   On Fedora (and likely other RPM based distributions)
   ```bash
   sudo dnf install make gcc ddcutil libddcutil-devel glib2-devel
   ```
   (`make` and `gcc` are also required and not installed by default)

2. __Build and install the service__
   ```bash
   git clone --branch v1.0.14 https://github.com/digitaltrails/ddcutil-service.git
   cd ddcutil-service
   make
   make install
   ```
   Service installs to `~/.local/share/dbus-1/services/com.ddcutil.DdcutilService.service` and  `~/.local/bin/ddcutil-service`. It is activated after the next login. You might have to reboot for `ddcutil` to detect your display.

# Troubleshooting

* [Diagnosing issues](./troubleshooting.md#diagnosing-issues)
* [Known issues](./troubleshooting.md#known-issues)

# License

This extension is distributed under the terms of the GNU General Public License, version 2 or later.
