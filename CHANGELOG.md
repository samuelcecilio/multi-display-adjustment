# Changelog

## Fork point

This project forked from [w8jcik/display-adjustment](https://gitlab.com/w8jcik/display-adjustment)
at commit `d0857f0` ("Correct dependency range", 2026-04-07), which was released upstream as `0.0.8`.

The full history before that commit is the upstream author's work and is preserved in this
repository — use `git log` and `git blame` for per-line authorship.

## 1.0.0 (2026-08-14)

### Added

* Displays are labelled. Every display appears under the name Settings shows for it, taken from
  Mutter's `display-name` property, with its connector next to it.
* Controls that a display does not support are left out instead of showing a slider that does
  nothing, which is common for contrast.

### Fixed

* The contrast slider shows a contrast icon again. It asked for `camera-iso-symbolic`, which GNOME
  47 dropped when it trimmed Adwaita's legacy icons, so on GNOME 47 and later the slider was
  labelled with the missing-image placeholder. The extension now ships its own icon.

### Changed

* Sliders moved from the Quick Settings grid into a menu behind a single *Displays* entry. Two
  unlabelled sliders per display filled the panel and gave no way to tell displays apart; a slider
  in the grid has no room for a title.
* A pair of identical displays gets a pair of controls. Displays are identified by model and serial,
  which two displays of the same model can share, and one of them used to be dropped.
* Displays sharing a column are ordered top to bottom, and mirrored displays no longer end up
  without a position.
* `dist.sh` builds the package with `gnome-extensions pack`, so the layout is the one the GNOME
  Extensions website expects, and `./dist.sh --install` installs it. It refuses to install over the
  development symlink, which `gnome-extensions install --force` would follow while emptying the
  directory, deleting the working tree.
* A `Makefile` drives the development loop: `make install` or `make link` to get the working tree
  into the shell, plus `enable`, `status`, `uninstall`, `check`, `nested` and `logs`. `make link` and
  `make uninstall` check whether they are looking at a symlink or at an installed copy before
  deleting anything.
* Tagged releases publish the package through GitHub Actions.

* Renamed to *Multi Display Adjustment* and moved to a new UUID
  (`multi-display-adjustment@cecilio.xyz`) so it can be installed alongside the original.
* Repository moved to https://github.com/samuelcecilio/multi-display-adjustment; issue and
  documentation links updated accordingly.
* Log prefix changed from the original `display-adjustment` tag to `multi-display-adjustment` so the
  two extensions can be told apart in `journalctl`.
