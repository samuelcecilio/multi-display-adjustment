#!/usr/bin/env bash

rm -rf ~/.local/share/gnome-shell/extensions/display-adjustment@w8jcik.gitlab.com
mkdir -p ~/.local/share/gnome-shell/extensions/display-adjustment@w8jcik.gitlab.com

rsync -a ./ --exclude dev.md --exclude .gitignore --exclude .git --exclude dist.sh --exclude README.md ~/.local/share/gnome-shell/extensions/display-adjustment@w8jcik.gitlab.com/
rm -f dist.zip
zip -rj dist.zip ~/.local/share/gnome-shell/extensions/display-adjustment@w8jcik.gitlab.com
