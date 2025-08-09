#!/usr/bin/env python3
import os
import re
import feedparser
from datetime import datetime, timedelta  # ← añadido timedelta

# ——— CONFIG ———
FEED_URL     = "https://mastodon.social/@ebenimeli.rss"
SINCE_FILE   = "last_toot.txt"
OUTPUT_YAML  = "../_data/log.yml"

def read_last_date():
    try:
        with open(SINCE_FILE, "r", encoding="utf-8") as f:
            return datetime.fromisoformat(f.read().strip())
    except Exception:
        return None

def write_last_date(dt):
    with open(SINCE_FILE, "w", encoding="utf-8") as f:
        f.write(dt.isoformat())

def prepend_to_yaml_block(block: str, filename: str):
    old = ""
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            old = f.read()
    with open(filename, "w", encoding="utf-8") as f:
        f.write(block + "\n" + old)

def sanitize(entry):
    """Extrae fecha, texto limpio, enlace y categoría del toot."""
    dt = datetime(*entry.published_parsed[:6]) + timedelta(hours=2)  # ← ajuste +2h

    # Obtener HTML del toot
    if hasattr(entry, "content") and entry.content:
        raw = entry.content[0].value
    else:
        raw = entry.get("summary", "")

    # Extraer enlaces externos
    hrefs = re.findall(r'href=[\'"](?P<u>https?://[^\'"]+)', raw)
    external = [u for u in hrefs if u != entry.get("link")]
    link = external[0] if external else ""

    # Extraer categoría desde entry.tags o hashtags en fallback
    if hasattr(entry, "tags") and entry.tags:
        cat = entry.tags[0].get("term", "")
    else:
        tags = re.findall(r'#(\w+)', raw)
        cat = tags[0] if tags else ""

    # Limpiar texto: quitar HTML, URLs y hashtags
    text = re.sub(r'<[^>]+>', '', raw)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'#\w+', '', text)
    text = text.strip().replace('"', '\\"')

    return dt, text, link, cat

def main():
    last_dt = read_last_date()
    feed    = feedparser.parse(FEED_URL)
    if feed.bozo:
        print("⚠️ Error al parsear el RSS:", feed.bozo_exception)
        return

    # Filtrar sólo los nuevos toots
    new_entries = []
    for e in feed.entries:
        if not getattr(e, "published_parsed", None):
            continue
        dt = datetime(*e.published_parsed[:6]) + timedelta(hours=2)  # ← ajuste +2h
        if last_dt and dt <= last_dt:
            continue
        new_entries.append(e)

    if not new_entries:
        print("No hay toots nuevos.")
        return

    # Orden **descendente**: del más reciente al más antiguo
    new_entries.sort(
        key=lambda e: datetime(*e.published_parsed[:6]) + timedelta(hours=2),  # ← ajuste +2h
        reverse=True
    )

    # Construir bloques YAML en orden inverso (newest first)
    yaml_blocks = []
    for e in new_entries:
        dt, text, link, cat = sanitize(e)
        stamp = dt.strftime("%Y-%m-%d %H:%M")
        yaml_blocks.append(
            f"- timestamp: {stamp}\n"
            f"  text: \"{text}\"\n"
            f"  link: \"{link}\"\n"
            f"  cat: '{cat}'"
        )

    block = "\n".join(yaml_blocks)

    # Preprender al log y actualizar since
    prepend_to_yaml_block(block, OUTPUT_YAML)
    newest = datetime(*new_entries[0].published_parsed[:6]) + timedelta(hours=2)  # ← ajuste +2h
    write_last_date(newest)
    print(f"Añadidas {len(yaml_blocks)} entradas a {OUTPUT_YAML}.")

if __name__ == "__main__":
    main()
