#!/bin/bash -ex
#
# A script to package only the necessary files of the extension.

echo "Packaging chrome extension"

VERSION=$(egrep "\"version\":" manifest.json | cut -d\" -f4)
zip -r extension-"$VERSION".zip ./ -x package_extension.sh README.md

echo "Done"
