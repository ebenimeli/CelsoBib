#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Actualiza _data/log.yml con los últimos commits de GitHub SIN dependencias externas.
- Usa urllib.request (stdlib) en lugar de requests.
- No usa PyYAML: construye el YAML como texto.
- Inserta las nuevas entradas al principio (las más recientes primero).
- Evita duplicados si ya existe la línea 'link: <url>' en el log.
- Solo registra commits que incluyan el hashtag #code (insensible a mayúsculas).
- El campo 'text' se genera como:
    Nueva actualización de código en <repo>: <mensaje_commit>
"""

import argparse
import json
import os
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from typing import List, Dict

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
    TZ_MADRID = ZoneInfo("Europe/Madrid")
except Exception:
    TZ_MADRID = None  # fallback a UTC

GITHUB_API = "https://api.github.com"

def http_get_json(url: str, headers: Dict[str, str]) -> dict | list:
    req = Request(url, headers=headers)
    with urlopen(req, timeout=30) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        data = resp.read().decode(charset, errors="replace")
        return json.loads(data)

def fetch_commits_stdlib(owner: str, repo: str, branch: str, max_items: int, token: str | None) -> List[dict]:
    commits: List[dict] = []
    per_page = min(100, max_items)
    page = 1
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "commit-log-updater-stdlib",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    while len(commits) < max_items:
        qs = urlencode({"sha": branch, "per_page": per_page, "page": page})
        url = f"{GITHUB_API}/repos/{owner}/{repo}/commits?{qs}"
        try:
            batch = http_get_json(url, headers)
        except HTTPError as e:
            raise SystemExit(f"[HTTPError] {e.code} {e.reason} al pedir {url}")
        except URLError as e:
            raise SystemExit(f"[URLError] {e.reason} al pedir {url}")

        if not batch:
            break
        commits.extend(batch)
        if len(batch) < per_page:
            break
        page += 1

    return commits[:max_items]

def to_madrid_str(iso_utc: str) -> str:
    iso = iso_utc.replace("Z", "+00:00")
    dt = datetime.fromisoformat(iso)
    if TZ_MADRID:
        dt = dt.astimezone(TZ_MADRID)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M")

def sanitize_message(msg: str) -> str:
    if not msg:
        return ""
    one_line = " ".join(msg.splitlines()).strip()
    one_line = one_line.replace('"', '\\"')
    return one_line

def build_yaml_entry(ts: str, text: str, link: str, cat: str) -> str:
    return (
        f"- timestamp: {ts}\n"
        f"  text: \"{text}\"\n"
        f"  link: {link}\n"
        f"  cat: '{cat}'\n"
    )

def read_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""

def write_file(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    ap = argparse.ArgumentParser(description="Añade commits de GitHub a _data/log.yml (arriba) sin dependencias.")
    ap.add_argument("--owner", default="ebenimeli")
    ap.add_argument("--repo", default="CelsoBib")
    ap.add_argument("--branch", default="celsobib1")
    ap.add_argument("--max", type=int, default=3)
    ap.add_argument("--logfile", default="../_data/log.yml")
    ap.add_argument("--cat", default="code")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    token = os.getenv("GITHUB_TOKEN")
    commits = fetch_commits_stdlib(args.owner, args.repo, args.branch, args.max, token)
    old = read_file(args.logfile)

    new_blocks: List[str] = []
    for c in commits:
        sha = c.get("sha")
        commit = c.get("commit", {}) or {}
        author = commit.get("author", {}) or {}
        date_iso = author.get("date")
        html_url = c.get("html_url") or f"https://github.com/{args.owner}/{args.repo}/commit/{sha}"
        msg = sanitize_message(commit.get("message", ""))

        if not sha or not date_iso or not msg:
            continue

        # Solo continuar si contiene #code (case-insensitive)
        if "#code" not in msg.lower():
            continue

        link_line = f"link: {html_url}"
        if link_line in old:
            continue

        ts = to_madrid_str(date_iso)
        text_with_repo = f"Nueva actualización de código en {args.repo}: {msg}"
        block = build_yaml_entry(ts, text_with_repo, html_url, args.cat)
        new_blocks.append(block)

    if not new_blocks:
        print("No hay entradas nuevas que añadir (no hay commits con #code o ya existen en el log).")
        return

    def ts_from_block(b: str) -> datetime:
        first = b.splitlines()[0]
        ts_str = first.split("timestamp: ", 1)[1].strip()
        return datetime.strptime(ts_str, "%Y-%m-%d %H:%M")

    new_blocks.sort(key=ts_from_block, reverse=True)
    new_content = "".join(new_blocks) + old

    if args.dry_run:
        print("== Dry-run: añadiría estas entradas al principio ==")
        print("".join(new_blocks))
        return

    write_file(args.logfile, new_content)
    print(f"Añadidas {len(new_blocks)} entradas nuevas al principio de {args.logfile}.")

if __name__ == "__main__":
    main()
