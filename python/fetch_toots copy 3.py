#!/usr/bin/env python3
import os
import re
import feedparser
from datetime import datetime

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
    # --- Fecha ---
    dt = datetime(*entry.published_parsed[:6])

    # --- HTML completo del toot ---
    raw = ""
    if hasattr(entry, "content") and entry.content:
        raw = entry.content[0].value
    else:
        raw = entry.get("summary", "")

    # --- Enlaces externos ---
    hrefs = re.findall(r'href=[\'"](?P<u>https?://[^\'"]+)', raw)
    # quitar enlace al propio toot (entry.link)
    external = [u for u in hrefs if u != entry.get("link")]
    link = external[0] if external else ""

    # --- Categoría: preferimos entry.tags si existe ---
    cat = ""
    if hasattr(entry, "tags") and entry.tags:
        # feedparser tags: entry.tags is lista de dicts con 'term'
        cat = entry.tags[0].get("term", "")
    else:
        # fallback: primer hashtag en el texto
        tags = re.findall(r'#(\w+)', raw)
        cat = tags[0] if tags else ""

    # --- Texto limpio: sin HTML, URLs ni hashtags ---
    text = re.sub(r'<[^>]+>', '', raw)            # quita HTML
    text = re.sub(r'https?://\S+', '', text)     # quita URLs
    text = re.sub(r'#\w+', '', text)             # quita hashtags
    text = text.strip().replace('"', '\\"')      # escapar comillas

    return dt, text, link, cat

def main():
    last_dt = read_last_date()
    feed    = feedparser.parse(FEED_URL)
    if feed.bozo:
        print("⚠️ Error al parsear el RSS:", feed.bozo_exception)
        return

    # Filtrar sólo nuevos toots
    new_entries = []
    for e in feed.entries:
        if not getattr(e, "published_parsed", None):
            continue
        dt = datetime(*e.published_parsed[:6])
        if last_dt and dt <= last_dt:
            continue
        new_entries.append(e)

    if not new_entries:
        print("No hay toots nuevos.")
        return

    # Orden cronológico y formateo YAML
    new_entries.sort(key=lambda e: datetime(*e.published_parsed[:6]))
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
    newest = datetime(*new_entries[-1].published_parsed[:6])
    write_last_date(newest)
    print(f"Añadidas {len(yaml_blocks)} entradas a {OUTPUT_YAML}.")

if __name__ == "__main__":
    main()
