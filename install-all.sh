#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: ./install-all.sh <packages> [--save-dev|--save]"
  exit 1
fi

for dir in gateway services/*; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing $@ in $dir"
    cd "$dir"
    npm install "$@"
    cd - > /dev/null
  fi
done
