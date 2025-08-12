#!/usr/bin/env bash
set -e  # si un comando falla, se detiene el script

# Función para esperar y mostrar cuenta atrás
esperar() {
  for i in {10..1}; do
    echo "⏳ Esperando $i segundos..."
    sleep 1
  done
}

echo "🚀 Iniciando ejecución de tareas..."

echo "▶️ Ejecutando fetch_toots.py"
cd /home/ebenimeli/GitHub/CelsoBib/python && ./fetch_toots.py
esperar

echo "▶️ Ejecutando push_log.sh"
cd /home/ebenimeli/GitHub/CelsoBib/_data && ./push_log.sh
esperar

echo "▶️ Ejecutando commit2log.py"
cd /home/ebenimeli/GitHub/CelsoBib/python && ./commit2log.py
esperar

echo "▶️ Ejecutando update.sh"
cd /home/ebenimeli/GitHub/CelsoBib && ./update.sh

echo "✅ Proceso completado."
