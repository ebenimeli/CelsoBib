#!/usr/bin/env python3
# myweek.py
from __future__ import annotations
import argparse
from dataclasses import dataclass
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import yaml  # pip install pyyaml
from typing import Any, Dict, List, Optional

# --- Configuración de grupos (cat -> título de sección) ---
GROUPS: List[tuple[str, set[str]]] = [
    ("Lo que vi", {"watch", "video", "movie"}),
    ("Lo que leí", {"read"}),
    ("Lo que dije", {"say"}),
    ("Lo que escribí", {"write"}),
    ("Esta semana aprendí", {"learn"}),
    ("Lo que programé", {"code"}),
    ("Lo que escuché", {"music", "podcast"}),
    ("Fotografía", {"photo"}),
    ("Ha sido noticia", {"news"}),
    ("Me gustó", {"like", "love"}),
    ("Cosas que pensé", {"thought"}),
    ("Algunas citas", {"quote"}),
]

# --- Iconos por categoría (igual que en tu include icons.html) ---
CAT_EMOJI: Dict[str, str] = {
    "gm": "☀️",
    "gn": "🌙",
    "code": "👨🏻‍💻",
    "news": "🗞️",
    "thought": "💭",
    "read": "📖",
    "write": "📝",
    "learn": "🧠",
    "podcast": "🎧",
    "music": "🎹",
    "video": "📺",
    "work": "📥",
    "quote": "🖋️",
    "chess": "♟️",
    "movie": "🍿",
    "coffee": "☕️",
    "lunch": "🍽️",
    "done": "✅",
    "photo": "📷",
    "humor": "🤣",
    "web": "✏️",
    "tools": "🛠️",
    "say": "💬",
    "like": "👍🏼",
    "love": "❤️",
    # 'watch' usa el de 'video'
}

@dataclass
class LogItem:
    ts: datetime
    text: str
    link: Optional[str]
    cat: str

def parse_timestamp(ts_raw: Any, tz: ZoneInfo) -> datetime:
    """
    Soporta:
    - epoch (int/float)
    - ISO (con/sin zona): 'YYYY-MM-DD[ HH:MM[:SS]][+/-HH:MM]'
    - Formatos ES: 'DD/MM/YYYY[, ]HH:MM[:SS][ AM|PM]' y con '-'
    - Formatos US: 'MM/DD/YYYY[, ]HH:MM[:SS][ AM|PM]'
      * Si aparece AM/PM pero la hora es > 12, se ignora el AM/PM y se parsea como 24h.
    - 'YYYY-MM-DD' con y sin hora
    """
    if isinstance(ts_raw, (int, float)):
        return datetime.fromtimestamp(float(ts_raw), tz)

    s = str(ts_raw).strip().replace("\u00A0", " ")  # NBSP -> espacio normal

    # ISO
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=tz)
        else:
            dt = dt.astimezone(tz)
        return dt
    except ValueError:
        pass

    s_up = s.upper()
    has_meridiem = (" AM" in s_up) or (" PM" in s_up)

    # Listas de formatos
    fmt_24_eu = [
        "%d/%m/%Y, %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y, %H:%M",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
    ]
    fmt_12_eu = [
        "%d/%m/%Y, %I:%M:%S %p",
        "%d/%m/%Y %I:%M:%S %p",
        "%d/%m/%Y, %I:%M %p",
        "%d/%m/%Y %I:%M %p",
        "%d-%m-%Y %I:%M:%S %p",
        "%d-%m-%Y %I:%M %p",
    ]
    fmt_24_us = [
        "%m/%d/%Y, %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y, %H:%M",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
    ]
    fmt_12_us = [
        "%m/%d/%Y, %I:%M:%S %p",
        "%m/%d/%Y %I:%M:%S %p",
        "%m/%d/%Y, %I:%M %p",
        "%m/%d/%Y %I:%M %p",
    ]
    fmt_24_iso = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]
    fmt_12_iso = [
        "%Y-%m-%d %I:%M:%S %p",
        "%Y-%m-%d %I:%M %p",
    ]

    # Si hay AM/PM, primero intentamos 12h; si hora > 12 con AM/PM, lo tratamos como 24h
    if has_meridiem:
        import re
        m = re.search(r"(\d{1,2}):(\d{2})(?::(\d{2}))?", s)
        if m:
            hour = int(m.group(1))
            if hour > 12:
                # AM/PM inválido: eliminamos el AM/PM y probamos 24h en todos los órdenes
                s_no_ampm = s_up.replace(" AM", "").replace(" PM", "")
                for fmts in (fmt_24_eu, fmt_24_us, fmt_24_iso):
                    for fmt in fmts:
                        try:
                            dt_naive = datetime.strptime(s_no_ampm, fmt)
                            return dt_naive.replace(tzinfo=tz)
                        except ValueError:
                            continue
        # 12h válido: probamos EU, US e ISO
        for fmts in (fmt_12_eu, fmt_12_us, fmt_12_iso):
            for fmt in fmts:
                try:
                    dt_naive = datetime.strptime(s, fmt)
                    return dt_naive.replace(tzinfo=tz)
                except ValueError:
                    continue

    # Sin AM/PM (o ya lo retiramos): probamos 24h en varios órdenes
    for fmts in (fmt_24_eu, fmt_24_us, fmt_24_iso):
        for fmt in fmts:
            try:
                dt_naive = datetime.strptime(s, fmt)
                return dt_naive.replace(tzinfo=tz)
            except ValueError:
                continue

    raise ValueError(f"No se pudo parsear el timestamp: {ts_raw!r}")

def compute_last_full_week(now: datetime) -> tuple[datetime, datetime]:
    """Última semana completa: lunes 00:00 → domingo 23:59:59 ANTERIOR a la semana actual."""
    today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    weekday = today_midnight.isoweekday()  # 1=lun … 7=dom
    since_mon = timedelta(days=weekday - 1)
    start_this_week = today_midnight - since_mon
    start_last_week = start_this_week - timedelta(days=7)
    end_last_week = start_this_week - timedelta(seconds=1)
    return start_last_week, end_last_week

def load_logs(path: str, tz: ZoneInfo) -> List[LogItem]:
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not isinstance(data, list):
        raise ValueError("El YAML debe ser una lista de registros.")

    logs: List[LogItem] = []
    for entry in data:
        if not isinstance(entry, dict):
            continue
        ts = parse_timestamp(entry.get("timestamp"), tz)
        text = str(entry.get("text", "")).strip()
        link = entry.get("link")
        link = str(link).strip() if link else None
        cat = str(entry.get("cat", "")).strip()
        logs.append(LogItem(ts=ts, text=text, link=link, cat=cat))
    return logs

def cat_to_emoji(cat: str) -> str:
    if cat == "watch":
        return CAT_EMOJI.get("video", "•")
    return CAT_EMOJI.get(cat, "•")

def render_markdown(logs: List[LogItem], start: datetime, end: datetime) -> str:
    # Nota: en macOS, '%-d' funciona; si en tu sistema no, usa '%d'. 
    header = f"# Semana del {start.strftime('%-d %B %Y')} al {end.strftime('%-d %B %Y')}\n\n"
    week_items = [li for li in logs if start <= li.ts <= end]

    md_parts: List[str] = [header]
    for title, cats in GROUPS:
        group_elems: List[str] = []
        for li in week_items:
            belongs = (li.cat in cats) or (li.cat == "watch" and "video" in cats)
            if not belongs:
                continue
            emoji = cat_to_emoji(li.cat)
            bullet = f"- {emoji} {li.text}"
            if li.link:
                bullet += f" [→]({li.link})"
            group_elems.append(bullet)
        if group_elems:
            md_parts.append(f"### {title}\n")
            md_parts.extend(elem + "\n" for elem in group_elems)
            md_parts.append("\n")
    return "".join(md_parts)

def main():
    parser = argparse.ArgumentParser(description="Genera myweek.md desde un log YAML agrupando la última semana completa.")
    parser.add_argument("--input", "-i", required=True, help="Ruta al archivo YAML de logs (p.ej., _data/log.yml)")
    parser.add_argument("--output", "-o", default="myweek.md", help="Archivo Markdown de salida (por defecto: myweek.md)")
    parser.add_argument("--tz", default="Europe/Paris", help="Zona horaria IANA (por defecto: Europe/Paris)")
    args = parser.parse_args()

    tz = ZoneInfo(args.tz)
    now = datetime.now(tz)

    start, end = compute_last_full_week(now)
    logs = load_logs(args.input, tz)
    md = render_markdown(logs, start, end)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"Generado: {args.output}")
    print(f"Ventana: {start} → {end} ({args.tz})")

if __name__ == "__main__":
    main()
