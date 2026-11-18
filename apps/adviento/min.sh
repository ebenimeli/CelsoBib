#!/usr/bin/env bash
# Genera dist/ con HTML/CSS minificados y app.js minificado + ofuscado.
# Deja config.js y los seis JSON legibles para poder editarlos tras publicar.
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DIST="$ROOT/dist"
TOOLS_DIR="${ADV_MIN_TOOLS_DIR:-${XDG_CACHE_HOME:-${HOME:-$ROOT}/.cache}/adviento-min-tools}"

for cmd in node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'Error: necesitas instalar Node.js y npm para ejecutar min.sh.\n' >&2
    exit 1
  fi
done

# Comprobar archivos de origen antes de modificar la salida anterior.
for file in index.html styles.css themes.css app.js pdf-export.js config.js; do
  if [[ ! -f "$ROOT/$file" ]]; then
    printf 'Error: falta el archivo %s en %s\n' "$file" "$ROOT" >&2
    exit 1
  fi
done
if [[ ! -d "$ROOT/assets" || ! -d "$ROOT/content" ]]; then
  printf 'Error: falta la carpeta assets/.\n' >&2
  exit 1
fi

# Las herramientas se instalan UNA vez en la caché del usuario, no en el proyecto.
# Requiere conexión a Internet solamente en la primera ejecución.
if [[ ! -f "$TOOLS_DIR/node_modules/terser/package.json" ||
      ! -f "$TOOLS_DIR/node_modules/javascript-obfuscator/package.json" ||
      ! -f "$TOOLS_DIR/node_modules/clean-css/package.json" ||
      ! -f "$TOOLS_DIR/node_modules/html-minifier-terser/package.json" ]]; then
  printf 'Instalando herramientas de compilación en %s...\n' "$TOOLS_DIR"
  mkdir -p "$TOOLS_DIR"
  npm install --prefix "$TOOLS_DIR" --no-save --no-audit --no-fund \
    'terser@^5' 'javascript-obfuscator@^4' 'clean-css@^5' 'html-minifier-terser@^7'
fi

# Construcción temporal: si algo falla, conserva la última carpeta dist/ válida.
STAGE="$(mktemp -d "$ROOT/.dist-build.XXXXXXXX")"
cleanup() { rm -rf -- "$STAGE"; }
trap cleanup EXIT
printf 'Generando versión optimizada...\n'

node - "$ROOT" "$STAGE" "$TOOLS_DIR" <<'NODE'
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const [root, out, toolDir] = process.argv.slice(2);
const requireTool = createRequire(path.join(toolDir, 'build-tools.cjs'));
const terser = requireTool('terser');
const Obfuscator = requireTool('javascript-obfuscator');
const CleanCSS = requireTool('clean-css');
const { minify: minifyHtml } = requireTool('html-minifier-terser');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const write = (name, content) => fs.writeFileSync(path.join(out, name), content, 'utf8');

(async () => {
  // Se conservan las claves, textos e imágenes para que sean editables.
  const stages = ['infantil', 'primaria-1-3', 'primaria-4-6', 'eso-1-2', 'eso-3-4', 'bachillerato'];
  for (const stage of stages) {
    const file = `content/${stage}.json`;
    const content = JSON.parse(read(file));
    if (!Array.isArray(content.days) || content.days.length !== 24 ||
        new Set(content.days.map(day => day.day)).size !== 24 ||
        !content.days.every(day => Number.isInteger(day.day) && day.day >= 1 && day.day <= 24 &&
          ['title','message','prayer','action','image','imageAlt'].every(field => typeof day[field] === 'string' && day[field].trim()))) {
      throw new Error(`${file} debe contener exactamente los días del 1 al 24 con todos los campos.`);
    }
    for (const day of content.days) {
      const image = path.resolve(root, day.image);
      if (!image.startsWith(root + path.sep) || !fs.existsSync(image) ||
          !day.image.startsWith(`assets/illustrations/${stage}/`)) {
        throw new Error(`Falta la ilustración del día ${day.day} en ${stage}: ${day.image}`);
      }
    }
  }
  fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
  fs.cpSync(path.join(root, 'content'), path.join(out, 'content'), { recursive: true });
  fs.copyFileSync(path.join(root, 'config.js'), path.join(out, 'config.js'));
  if (fs.existsSync(path.join(root, 'README.md'))) {
    fs.copyFileSync(path.join(root, 'README.md'), path.join(out, 'README.md'));
  }

  // HTML: no cambia las rutas ni elimina los atributos ARIA.
  const html = await minifyHtml(read('index.html'), {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    keepClosingSlash: true
  });
  write('index.html', html);

  // CSS: nivel 1 = compresión conservadora.
  for (const filename of ['styles.css', 'themes.css']) {
    const css = new CleanCSS({ level: 1 }).minify(read(filename));
    if (css.errors.length) throw new Error('Error al minificar CSS: ' + css.errors.join('; '));
    write(filename, css.styles);
  }

  // JS: primero se minifica y luego se ofusca, incluyendo el módulo PDF.
  for (const filename of ['app.js', 'pdf-export.js']) {
    const min = await terser.minify(read(filename), {
      ecma: 2020,
      compress: { passes: 2 },
      mangle: true,
      format: { comments: false }
    });
    if (min.error || !min.code) throw new Error(`No se pudo minificar ${filename}: ` + min.error);
    const output = Obfuscator.obfuscate(min.code, {
      target: 'browser',
      compact: true,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      stringArray: true,
      stringArrayThreshold: 0.65,
      stringArrayEncoding: ['base64'],
      stringArrayRotate: true,
      stringArrayShuffle: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      selfDefending: false,
      sourceMap: false
    });
    write(filename, output.getObfuscatedCode());
  }

  for (const name of ['index.html', 'styles.css', 'themes.css', 'app.js', 'pdf-export.js', 'config.js']) {
    if (!fs.statSync(path.join(out, name)).size) throw new Error(`Archivo generado vacío: ${name}`);
  }
})().catch(error => { console.error('Error de compilación:', error.message); process.exitCode = 1; });
NODE

node --check "$STAGE/app.js"
node --check "$STAGE/pdf-export.js"
node --check "$STAGE/config.js"

# Reemplazar dist/ únicamente cuando todo se haya generado correctamente.
rm -rf -- "$DIST"
mv -- "$STAGE" "$DIST"
trap - EXIT

printf '\n✓ Versión de producción lista en: %s\n' "$DIST"
printf '  HTML/CSS: minificados · JS: minificado y ofuscado\n'
printf '  config.js y content/*.json: editables · 144 SVG incluidos\n'
printf '  Para probar: cd dist && python3 -m http.server 8000\n'
