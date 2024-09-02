#!/usr/bin/env bash

rm -rf dist
mkdir -p dist/

cp *.js COPYING metadata.json README.md screenshot.png dist/
