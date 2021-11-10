#!/bin/sh
set -e

buildTheme () {
  themeName=$(basename $1)
  if [ $themeName = "shared" ]; then
    return
  fi

  echo "Building $themeName..."

  export NODE_ENV=production
  export THEME=$themeName

  ./node_modules/.bin/webpack --output-path="../backend/themes/$themeName"
  cp "$1/screenshot.png" "../backend/themes/$themeName/screenshot.png"
  cp "$1/theme.json" "../backend/themes/$themeName/theme.json"
  if [ -d "../backend/themes/$themeName/dist" ]; then 
    cp "../node_modules/openpgp/dist/openpgp.min.js" "../node_modules/openpgp/dist/openpgp.worker.min.js" "../backend/themes/$themeName/dist"
  fi

  echo $themeName built
}

if [ -z "$1" ]; then
  rm -rf ../backend/themes
  mkdir -p ../backend/themes
  for themeDir in `find . -path './src/themes/*' -prune -type d`
  do
    buildTheme "$themeDir"
  done
else
  rm -rf "../backend/themes/$1"
  buildTheme "src/themes/$1"
fi
