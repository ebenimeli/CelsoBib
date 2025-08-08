#/bin/env bash
!/usr/bin/env bash

set -euo pipefail

export PATH="/home/ebenimeli/.rbenv/bin:/home/ebenimeli/.rbenv/shims:/home/ebenimeli/.gem/ruby/3.0.0/bin:$PATH"

# 1) Carga tu entorno Ruby (rbenv ó rvm). Ajusta según lo que uses:
# Si usas rbenv:
#export RBENV_ROOT="$HOME/.rbenv"
#export PATH="$RBENV_ROOT/bin:$PATH"
#eval "$(rbenv init -)"

# Si usas RVM, descomenta la siguiente línea en lugar de lo anterior:
# source "$HOME/.rvm/scripts/rvm"

# 2) Variables base
BASE="/home/ebenimeli/GitHub/CelsoBib"
SITEFOLDER="$BASE/_site"
CACHE="$BASE/.jekyll-cache"
WEB="/var/www/vhosts/ebenimeli.org/httpdocs"

# 3) Trabaja siempre desde el proyecto
cd "$BASE"

echo "==> Limpiando _site y caché..."
rm -rf "$SITEFOLDER" "$CACHE"

echo "==> Tirando cambios desde Git..."
git pull --ff-only

echo "==> Ejecutando Jekyll via Bundler..."
# Asegúrate de que Gemfile.lock tenga jekyll-sass-converter (2.2.0)
/bin/bundle3.0 install --jobs 4 --retry 3
/bin/bundle3.0 exec jekyll build --destination "$SITEFOLDER"

echo "==> Desplegando en el servidor web..."
if [[ -d "$WEB" ]]; then
  rsync -a --delete "$SITEFOLDER"/ "$WEB"/
else
  echo "!! Directorio web no existe: $WEB"
  exit 1
fi

echo "==> ¡Hecho!"
