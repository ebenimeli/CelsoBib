#!/usr/bin/env python3
import os
import re
import feedparser
from datetime import datetime, timedelta  # ← ajuste horario

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

# ——— Detección de hashtags ———

# 1) Preferimos capturar desde el HTML de Mastodon (<a rel="tag">#<span>tag</span></a>)
TAG_FROM_HTML_RE = re.compile(
    r'rel=["\']tag["\'][^>]*>'    # <a ... rel="tag" ...>
    r'(?:#\s*)?'                  # opcional '#'
    r'(?:<span[^>]*>)?'           # opcional <span>
    r'([^<\s#]+)',                # texto del tag
    flags=re.IGNORECASE
)

# 2) Fallback en texto plano (permite acentos, ñ y guiones)
TAG_FROM_TEXT_RE = re.compile(
    r'[#!＃]([0-9A-Za-z_ÁÉÍÓÚÜÑáéíóúüñ\-]+)',
    flags=re.UNICODE
)

def first_hashtag(raw_html: str, plain_text: str) -> str:
    """Devuelve el primer hashtag (sin #) en el orden del mensaje."""
    m = TAG_FROM_HTML_RE.search(raw_html)
    if m:
        return m.group(1)
    m2 = TAG_FROM_TEXT_RE.search(plain_text)
    if m2:
        return m2.group(1)
    return ""

def sanitize(entry):
    """Extrae fecha, texto limpio (sin el primer hashtag), enlace y categoría del toot."""
    dt = datetime(*entry.published_parsed[:6]) + timedelta(hours=2)  # ← ajuste +2h

    # HTML del toot
    if hasattr(entry, "content") and entry.content:
        raw = entry.content[0].value
    else:
        raw = entry.get("summary", "")

    # Texto limpio preliminar (aún con hashtags):
    text = re.sub(r'<[^>]+>', '', raw)           # quitar HTML
    text = re.sub(r'https?://\S+', '', text)     # quitar URLs
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace('"', '\\"')

    # Enlace externo (si lo hay)
    hrefs = re.findall(r'href=[\'"](?P<u>https?://[^\'"]+)', raw)
    external = [u for u in hrefs if u != entry.get("link")]
    link = external[0] if external else ""

    # Primer hashtag → cat
    cat = first_hashtag(raw, text)

    # Eliminar del texto TODAS las apariciones del hashtag que sirve como cat (solo ese)
    if cat:
        # Evita borrar hashtags parecidos (#news no borra #newsroom)
        # Coincide con # o ＃ seguido exactamente del tag y límite de palabra
        pattern = re.compile(rf'(?:#|＃){re.escape(cat)}\b', flags=re.IGNORECASE)
        text = pattern.sub('', text)
        text = re.sub(r'\s+', ' ', text).strip()

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

    # Orden descendente (más reciente primero)
    new_entries.sort(
        key=lambda e: datetime(*e.published_parsed[:6]) + timedelta(hours=2),
        reverse=True
    )

    # Construir bloques YAML (newest first)
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
    newest = datetime(*new_entries[0].published_parsed[:6]) + timedelta(hours=2)
    write_last_date(newest)
    print(f"Añadidas {len(yaml_blocks)} entradas a {OUTPUT_YAML}.")

if __name__ == "__main__":
    main()
