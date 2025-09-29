#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Normaliza fechas 'start' y 'end' a ISO-8601 (YYYY-MM-DD) en un YAML.
- Preserva comentarios, orden de claves y comillas (ruamel.yaml).
- Controla la indentación para que los ítems de lista queden bien tabulados.

Uso:
    python yml_dates_to_iso.py input.yml output.yml

Requisitos:
    pip install ruamel.yaml
"""

import re
import sys
from datetime import date, timedelta

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedSeq, CommentedMap
except ImportError:
    print("ERROR: Necesitas instalar ruamel.yaml -> pip install ruamel.yaml", file=sys.stderr)
    sys.exit(1)

# ---- Parsing de fechas (incluye español) ----

SPANISH_MONTHS = {
    "enero": 1, "ene": 1,
    "febrero": 2, "feb": 2,
    "marzo": 3, "mar": 3,
    "abril": 4, "abr": 4,
    "mayo": 5, "may": 5,
    "junio": 6, "jun": 6,
    "julio": 7, "jul": 7,
    "agosto": 8, "ago": 8,
    "septiembre": 9, "setiembre": 9, "sep": 9, "set": 9,
    "octubre": 10, "oct": 10,
    "noviembre": 11, "nov": 11,
    "diciembre": 12, "dic": 12,
}

RE_ISO = re.compile(r"^\s*(\d{4})-(\d{2})-(\d{2})\s*$")
RE_YMD = re.compile(r"^\s*(\d{4})[./-](\d{1,2})[./-](\d{1,2})\s*$")
RE_DMY = re.compile(r"^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*$")
RE_MY  = re.compile(r"^\s*(\d{1,2})[./-](\d{4})\s*$")
RE_YM  = re.compile(r"^\s*(\d{4})[./-](\d{1,2})\s*$")
RE_SPANISH_MONTH = re.compile(r"^\s*([A-Za-zÁÉÍÓÚÜáéíóúüñÑ.]+)\s+(\d{4})\s*$", re.IGNORECASE)
RE_SPANISH_FULL = re.compile(
    r"""^\s*
        (\d{1,2})
        \s*(?:de\s+)? 
        ([A-Za-zÁÉÍÓÚÜáéíóúüñÑ.]+)
        \s*(?:de\s+)? 
        (\d{4})
        \s*$
    """,
    re.IGNORECASE | re.VERBOSE
)

def clamp(n, a, b): return max(a, min(b, n))

def month_days(y, m):
    if m == 12:
        return 31
    try:
        return (date(y if m < 12 else y + 1, m + 1 if m < 12 else 1, 1) - timedelta(days=1)).day
    except Exception:
        last = [31,28,31,30,31,30,31,31,30,31,30,31][clamp(m,1,12)-1]
        if m == 2 and ((y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)):
            last = 29
        return last

def iso(y: int, m: int, d: int) -> str:
    d = clamp(d, 1, month_days(y, m))
    return f"{y:04d}-{m:02d}-{d:02d}"

def _norm_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())

def _strip_accents(s: str) -> str:
    return (s.replace("á","a").replace("Á","A")
             .replace("é","e").replace("É","E")
             .replace("í","i").replace("Í","I")
             .replace("ó","o").replace("Ó","O")
             .replace("ú","u").replace("Ú","U")
             .replace("ü","u").replace("Ü","U")
             .replace("ñ","n").replace("Ñ","N"))

def _normalize_month_token(token: str) -> str:
    t = token.strip().lower().rstrip(".")
    t = _strip_accents(t)
    return t

def parse_spanish_month_only(s: str):
    m = RE_SPANISH_MONTH.match(_norm_spaces(s))
    if not m: return None
    mon = _normalize_month_token(m.group(1))
    year = int(m.group(2))
    month = SPANISH_MONTHS.get(mon)
    if not month: return None
    return iso(year, month, 1)

def parse_spanish_full_date(s: str):
    m = RE_SPANISH_FULL.match(_norm_spaces(s))
    if not m: return None
    day = int(m.group(1))
    mon = _normalize_month_token(m.group(2))
    year = int(m.group(3))
    month = SPANISH_MONTHS.get(mon)
    if not month: return None
    return iso(year, month, day)

def normalize_date(value):
    """Devuelve (nuevo_valor, changed: bool). Si no puede parsear, deja tal cual."""
    if value is None or isinstance(value, (int, float)) or not isinstance(value, str):
        return value, False
    s = value.strip()
    if not s:
        return value, False

    m = RE_ISO.match(s)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        normalized = iso(y, mo, d)
        return normalized, (normalized != s)

    m = RE_YMD.match(s)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return iso(y, mo, d), True

    m = RE_DMY.match(s)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return iso(y, mo, d), True

    parsed = parse_spanish_full_date(s)
    if parsed:
        return parsed, True

    m = RE_MY.match(s)
    if m:
        mo, y = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12:
            return iso(y, mo, 1), True

    m = RE_YM.match(s)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        if 1 <= mo <= 12:
            return iso(y, mo, 1), True

    parsed = parse_spanish_month_only(s)
    if parsed:
        return parsed, True

    return value, False

# ---- Recorrido y normalización ----

def process_mapping_like(obj):
    changed_any = False
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if isinstance(v, (dict, list)):
                if process_mapping_like(v):
                    changed_any = True
            if isinstance(k, str) and k.lower() in ("start", "end"):
                new_v, changed = normalize_date(v)
                if changed:
                    obj[k] = new_v
                    changed_any = True
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, (dict, list)):
                if process_mapping_like(v):
                    changed_any = True
    return changed_any

# ---- Dump con indentación “limpia” ----

def configured_yaml():
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.explicit_start = False
    yaml.allow_unicode = True
    yaml.width = 1000

    # Indentación:
    # - mapping=2   -> 2 espacios para claves dentro de mapas
    # - sequence=2  -> 2 espacios para contenidos de secuencia
    # - offset=0    -> SIN sangría extra tras el '- ' (clave del item al mismo nivel)
    yaml.indent(mapping=2, sequence=2, offset=0)

    # Asegura que los '-' de las listas no se desplacen más de la cuenta
    # (ruamel usa este flag para calcular la columna del guion).
    yaml.block_seq_indent = 0  # tipo: ignore (propiedad soportada por ruamel)

    return yaml

def main():
    if len(sys.argv) != 3:
        print("Uso: python yml_dates_to_iso.py <input.yml> <output.yml>", file=sys.stderr)
        sys.exit(2)

    in_path, out_path = sys.argv[1], sys.argv[2]
    yaml = configured_yaml()

    with open(in_path, 'r', encoding='utf-8') as f:
        data = yaml.load(f)

    process_mapping_like(data)

    # Si la raíz es lista, esto generará:
    # - name: ...
    #   type: ...
    with open(out_path, 'w', encoding='utf-8') as f:
        yaml.dump(data, f)

    print(f"Fechas normalizadas y YAML tabulado en: {out_path}")

if __name__ == "__main__":
    main()
