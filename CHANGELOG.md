# Changelog

## Fork point

This project forked from [w8jcik/display-adjustment](https://gitlab.com/w8jcik/display-adjustment)
at commit `d0857f0` ("Correct dependency range", 2026-04-07), which was released upstream as `0.0.8`.

The full history before that commit is the upstream author's work and is preserved in this
repository — use `git log` and `git blame` for per-line authorship.

## 0.1.0 (unreleased)

### Changed

* Renamed to *Multi Display Adjustment* and moved to a new UUID
  (`multi-display-adjustment@cecilio.xyz`) so it can be installed alongside the original.
* Repository moved to https://github.com/samuelcecilio/multi-display-adjustment; issue and
  documentation links updated accordingly.
* Log prefix changed from the original `display-adjustment` tag to `multi-display-adjustment` so the
  two extensions can be told apart in `journalctl`.
