#!/bin/sh
set -e

export NODE_ENV=development 
export THEME=$1
mkdir -p "../backend/themes/$1"
cp "./src/themes/$1/screenshot.png" "../backend/themes/$1/"
cp "./src/themes/$1/theme.json" "../backend/themes/$1/"
./node_modules/.bin/webpack --watch --loglevel notice --output-path="../backend/themes/$1"