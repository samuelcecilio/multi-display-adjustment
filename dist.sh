#!/usr/bin/env bash

UUID=multi-display-adjustment@cecilio.xyz
TARGET=~/.local/share/gnome-shell/extensions/$UUID

rm -rf "$TARGET"
mkdir -p "$TARGET"

rsync -a ./ --exclude dev.md --exclude .gitignore --exclude .git --exclude dist.sh --exclude README.md --exclude troubleshooting.md --exclude CHANGELOG.md "$TARGET"/
rm -f dist.zip
zip -rj dist.zip "$TARGET"
