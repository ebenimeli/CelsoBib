#!/usr/bin/env bash
set -euo pipefail

REPO="/home/ebenimeli/GitHub/CelsoBib"
BRANCH="celsobib1"

cd "$REPO"

# Asegura PATH y HOME para Cron
export PATH="/usr/local/bin:/usr/bin:/bin"
export HOME="/home/ebenimeli"

# Trae cambios remotos y rebasea tus commits locales encima
git fetch origin "$BRANCH"
git pull --rebase --autostash origin "$BRANCH"

# (Opcional) añade y comitea si hay cambios pendientes
git add _data/log.yml
if ! git diff --cached --quiet; then
  git commit -m "Actualiza log.yml con nuevos registros"
fi

# Empuja ya sin divergencias
git push origin "$BRANCH"
