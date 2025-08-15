#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Lee el RSS de Goodreads (shelf=read) y añade entradas a ../_data/log.yml
solo si hay nuevas lecturas en las últimas 24 horas. También evita duplicados.

Requisitos: Python 3.9+ (usa zoneinfo de la stdlib).
"""

import os
import sys
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except Exception:
    ZoneInfo = None

# ------------ CONFIG ------------
GOODREADS_RSS_URL = "https://www.goodreads.com/review/list_rss/1230384?shelf=read"
FIXED_LINK = "https://www.goodreads.com/review/list/1230384?shelf=read"
FIXED_CAT = "read"
OUTPUT_YAML = os.path.join(os.path.dirname(__file__), "../_data/log.yml")
TZ = ZoneInfo("Europe/Madrid") if ZoneInfo else timezone(timedelta(hours=2))  # fallback verano
WINDOW_HOURS = 24
# --------------------------------


def fetch_rss(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Python-urllib/3 Goodreads RSS reader"
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def parse_items(xml_bytes: bytes):
    """
    Devuelve lista de dicts con: pub_dt (datetime, TZ-aware), title, author.
    Goodreads expone <item> con <title> y <pubDate>. El <title> suele tener
    el patrón 'Título by Autor'. Hacemos parsing robusto.
    """
    ns = {}  # no necesitamos namespaces para <item>/<title>/<pubDate>
    root = ET.fromstring(xml_bytes)
    # RSS suele ser: <rss><channel><item>...</item></channel></rss>
    channel = root.find("channel")
    if channel is None:
        # algunos feeds usan namespaces; intentamos búsqueda amplia
        channel = root.find(".//channel", ns)
    items = []
    for it in channel.findall("item"):
        raw_title = (it.findtext("title") or "").strip()
        pub_raw = (it.findtext("pubDate") or "").strip()

        # Parse pubDate (RFC 2822) -> datetime
        try:
            pub_dt = parsedate_to_datetime(pub_raw)
            if pub_dt.tzinfo is None:
                pub_dt = pub_dt.replace(tzinfo=timezone.utc)
        except Exception:
            # Si falla, descartamos el item
            continue

        # Intentamos extraer título y autor
        title, author = split_title_author(raw_title)

        items.append({
            "pub_dt": pub_dt,
            "title": title,
            "author": author,
        })
    return items


def split_title_author(raw_title: str):
    """
    Intenta separar 'Título by Autor' o 'Título – Autor' o 'Título (Autor)'.
    Si no se reconoce patrón, devuelve el raw como título y autor vacío.
    """
    s = raw_title.strip()

    # patrones comunes
    patterns = [
        r"^(?P<title>.+?)\s+by\s+(?P<author>.+)$",          # Title by Author
        r"^(?P<title>.+?)\s+–\s+(?P<author>.+)$",           # Title – Author
        r"^(?P<title>.+?)\s+-\s+(?P<author>.+)$",           # Title - Author
        r"^(?P<title>.+?)\s+\((?P<author>.+)\)$",           # Title (Author)
    ]
    for pat in patterns:
        m = re.match(pat, s, flags=re.IGNORECASE)
        if m:
            return m.group("title").strip(), m.group("author").strip()

    # fallback: a veces Goodreads pone 'Title' y el autor en otra etiqueta,
    # pero como no dependemos de extensiones, dejamos autor vacío si no detectamos.
    return s, ""


def load_existing_log_texts(path: str):
    """
    Devuelve un set con los valores de línea 'text: ...' ya presentes,
    para evitar duplicados por texto exacto.
    """
    if not os.path.exists(path):
        return set()
    texts = set()
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                # match línea que empiece con '  text:' o 'text:'
                m = re.match(r"^\s*text:\s*(.*)\s*$", line)
                if m:
                    texts.add(m.group(1).strip())
    except Exception:
        pass
    return texts


def ensure_output_dir(path: str):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)


def yaml_escape_line(s: str) -> str:
    """
    Para seguridad mínima, evitamos caracteres que puedan romper YAML en línea simple.
    Aquí NO usamos comillas para seguir tu ejemplo, pero saneamos retornos de línea.
    """
    return s.replace("\n", " ").strip()


def build_yaml_block(now_local: datetime, title: str, author: str) -> str:
    ts = now_local.strftime("%Y-%m-%d %H:%M")
    display_title = title.strip()
    display_author = author.strip()
    # Si no hay autor detectado, omitimos el ' de ...'
    if display_author:
        text = f"\"Terminé de leer «{display_title}» de {display_author} #status\""
    else:
        text = f"\"Terminé de leer «{display_title}» #status\""

    text = yaml_escape_line(text)

    block = (
        f"- timestamp: {ts}\n"
        f"  text: {text}\n"
        f"  link: {FIXED_LINK}\n"
        f"  cat: '{FIXED_CAT}'\n"
    )
    return block


def prepend_to_file(path: str, new_blocks: str):
    """
    Inserta los nuevos bloques al principio del archivo.
    Si no existe, crea el archivo con el contenido.
    """
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            old = f.read()
        with open(path, "w", encoding="utf-8") as f:
            if old.strip():
                f.write(new_blocks + "\n" + old)
            else:
                f.write(new_blocks.strip() + "\n")
    else:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_blocks.strip() + "\n")


def main():
    ensure_output_dir(OUTPUT_YAML)

    # Momento actual en Europe/Madrid
    now_local = datetime.now(TZ)
    window_start_utc = (now_local - timedelta(hours=WINDOW_HOURS)).astimezone(timezone.utc)

    # Leemos RSS
    try:
        xml = fetch_rss(GOODREADS_RSS_URL)
    except Exception as e:
        print(f"[ERROR] No se pudo descargar el RSS: {e}", file=sys.stderr)
        sys.exit(1)

    items = parse_items(xml)
    if not items:
        print("[INFO] RSS sin items o no parseable.")
        return

    # Filtramos ítems dentro de la ventana de 24h (comparando pubDate en UTC)
    recent = []
    for it in items:
        pub_utc = it["pub_dt"].astimezone(timezone.utc)
        if pub_utc >= window_start_utc:
            recent.append(it)

    if not recent:
        print("[INFO] No hay nuevas lecturas en las últimas 24 horas.")
        return

    # Evitar duplicados por 'text:' ya existente
    existing_texts = load_existing_log_texts(OUTPUT_YAML)

    # Construimos bloques (ordenados del más reciente al más antiguo por pubDate)
    recent.sort(key=lambda x: x["pub_dt"], reverse=True)

    blocks = []
    for it in recent:
        block_preview = build_yaml_block(now_local, it["title"], it["author"])
        # Extraemos la línea 'text:' que generaremos para comprobar duplicados
        m = re.search(r"\n\s*text:\s*(.+)\n", block_preview)
        would_be_text = m.group(1).strip() if m else ""
        if would_be_text and would_be_text not in existing_texts:
            blocks.append(block_preview)
        else:
            # Ya existe una entrada con ese texto (posible duplicado)
            pass

    if not blocks:
        print("[INFO] No hay bloques nuevos que añadir (todos duplicados o filtrados).")
        return

    # Unimos y escribimos al principio del archivo
    prepend_to_file(OUTPUT_YAML, "\n".join(blocks))
    print(f"[OK] Añadidas {len(blocks)} entrad(as) a {OUTPUT_YAML}.")


if __name__ == "__main__":
    main()
