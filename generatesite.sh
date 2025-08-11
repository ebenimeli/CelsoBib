#!/usr/bin/env bash
set -e
bundle exec jekyll build "$@"
# Ejecutar fetch_toots.py como si estuviésemos dentro de python/
#(
#  cd python
  # Si ya tiene shebang + +x:
#  ./fetch_toots.py
  # O, si prefieres invocar con python3:
  # python3 fetch_toots.py
#)
