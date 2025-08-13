#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Añade un nuevo log de tipo 'quote' a _data/log.yml eligiendo
una cita aleatoria de _data/quotes.yml.

Reglas:
- timestamp = ahora (Europe/Madrid) en formato 'YYYY-MM-DD HH:MM'
- text = «<quote>» (<author>)  [si no hay autor, solo «<quote>»]
- link = valor de 'link' en la cita; si falta/está vacío, usar
         'https://www.ebenimeli.org/pages/me_quotes.html'
- cat = 'quote'
- Insertar SIEMPRE el nuevo registro al inicio de _data/log.yml

Parser YAML mínimo (sin dependencias): soporta lista de ítems con
claves 'quote', 'author', 'link', 'type'/'cat' en líneas simples.
No soporta valores multilínea ni estructuras anidadas complejas.
"""

import os
import random
from datetime import datetime
from zoneinfo import ZoneInfo

QUOTES_FILE = "../_data/quotes.yml"
LOG_FILE    = "../_data/log.yml"
FALLBACK_LINK = "https://www.ebenimeli.org/pages/me_quotes.html"
TZ = ZoneInfo("Europe/Madrid")

def _strip_quotes(s: str) -> str:
    s = s.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        return s[1:-1]
    return s

def load_simple_quotes(path: str):
    """
    Carga _data/quotes.yml como lista de dicts (parser simple).
    Espera entradas tipo:
      - quote: ...
        author: ...
        link: ...
        cat: ... (opcional)
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontró {path}")

    items = []
    current = None

    def flush():
        nonlocal current
        if current and ("quote" in current) and current["quote"].strip():
            items.append(current)
        current = None

    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip("\n")
            stripped = line.strip()

            # Comienzo de ítem
            if stripped.startswith("- "):
                flush()
                current = {}
                # Puede venir '- quote: ...' en la misma línea
                tail = stripped[2:].strip()
                if tail and ":" in tail:
                    k, v = tail.split(":", 1)
                    current[k.strip()] = _strip_quotes(v.strip())
                continue

            # Dentro de un ítem actual, claves simples 'k: v'
            if current is not None and ":" in stripped and not stripped.startswith("#"):
                k, v = stripped.split(":", 1)
                current[k.strip()] = _strip_quotes(v.strip())

    flush()
    return items

def yaml_escape_double_quoted(s: str) -> str:
    """Escapa para usar comillas dobles en YAML."""
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'

def prepend_to_file(block: str, filename: str):
    """Escribe block al inicio del archivo filename."""
    old = ""
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            old = f.read()
    with open(filename, "w", encoding="utf-8") as f:
        if old:
            f.write(block + "\n" + old)
        else:
            f.write(block + "\n")

def main():
    quotes = load_simple_quotes(QUOTES_FILE)
    if not quotes:
        raise RuntimeError("No se encontraron citas válidas en _data/quotes.yml")

    q = random.choice(quotes)
    quote_text = q.get("quote", "").strip()
    author = q.get("author", "").strip()
    link = q.get("link", "").strip() or FALLBACK_LINK

    # text: «cita» (autor)
    if author:
        text_value = f"«{quote_text}» ({author})"
    else:
        text_value = f"«{quote_text}»"

    timestamp = datetime.now(TZ).strftime("%Y-%m-%d %H:%M")

    yaml_block = (
        f"- timestamp: {timestamp}\n"
        f"  text: {yaml_escape_double_quoted(text_value)}\n"
        f"  link: {link}\n"
        f"  cat: quote"
    )

    prepend_to_file(yaml_block, LOG_FILE)
    print("✅ Nuevo log de 'quote' añadido al inicio de _data/log.yml")
    print(yaml_block)

if __name__ == "__main__":
    main()
