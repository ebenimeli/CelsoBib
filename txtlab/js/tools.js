function playClick(url = "assets/media/click.mp3") {
  // Inicialización perezosa de una pequeña "pool" de Audio
  if (!playClick._pool) {
    playClick._pool = Array.from({ length: 4 }, () => {
      const a = new Audio(url);
      a.preload = "auto";
      a.volume = 0.6; // 0–1
      return a;
    });
    playClick._i = 0;
  }
  const pool = playClick._pool;
  const i = playClick._i++ % pool.length;
  try {
    pool[i].currentTime = 0;
    pool[i].play();
  } catch (_) {
    // Silenciar errores de reproducción (políticas del navegador, etc.)
  }
}

document
  .querySelectorAll("button")
  .forEach((b) => b.addEventListener("click", () => playClick()));


/* Pre-inicializa la pool al cargar el DOM (sin reproducir)*/

  playClick.init = (url = 'assets/media/click.mp3') => {
  if (playClick._pool) return;
  playClick._pool = Array.from({ length: 4 }, () => {
    const a = new Audio(url);
    a.preload = 'auto';
    a.volume = 0.6;
    return a;
  });
  playClick._i = 0;
};
document.addEventListener('DOMContentLoaded', () => playClick.init());


// Cerrar todos salvo "except"
function closeAllToolsets(except) {
  document.querySelectorAll(".toolset").forEach((s) => {
    if (s !== except) {
      s.hidden = true;
      // Poned aria-expanded="false" en todos los triggers de este panel
      document
        .querySelectorAll(`button[aria-controls="${s.id}"]`)
        .forEach((b) => b.setAttribute("aria-expanded", "false"));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const SINGLE_OPEN = true; // ← poned false si queréis varios abiertos

  document.querySelectorAll(".toolset").forEach((panel, idx) => {
    // Estado inicial
    panel.hidden = true;
    if (!panel.id) panel.id = `toolset-${idx + 1}`;

    // Triggers:
    // 1) Botón inmediatamente anterior
    const prev = panel.previousElementSibling;
    const triggers = new Set();
    if (prev?.tagName === "BUTTON") {
      // añadimos data-target automáticamente para que también funcione la búsqueda global
      prev.dataset.target = `#${panel.id}`;
      triggers.add(prev);
    }

    // 2) Cualquier botón que apunte a este panel por data-target
    document
      .querySelectorAll(`button[data-target="#${panel.id}"]`)
      .forEach((btn) => triggers.add(btn));

    // Cableado de cada trigger
    triggers.forEach((btn) => {
      btn.type = "button";
      btn.setAttribute("aria-controls", panel.id);
      btn.setAttribute("aria-expanded", "false");

      btn.addEventListener("click", () => {
        const willOpen = panel.hidden;
        if (SINGLE_OPEN && willOpen) closeAllToolsets(panel);
        panel.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    });
  });
});

// ------ INFO HOVER (funciona aunque reemplaces #sidebar) ------
(function () {
  const BTN_SEL = "button.action, button.tool";

  function getInfoEl() {
    const el = document.getElementById("info");
    if (el && !el.dataset.default) {
      el.dataset.default = el.textContent || "Información";
    }
    return el;
  }

  function showFrom(btn) {
    const info = getInfoEl();
    if (!info) return;
    const txt = btn.getAttribute("data-info");
    if (txt) {
      info.textContent = txt;
      info.title = txt; // tooltip con el texto completo
    }
  }

  function resetInfo() {
    const info = getInfoEl();
    if (!info) return;
    const def = info.dataset.default || "Información";
    info.textContent = def;
    info.title = def;
  }

  // Ratón
  document.addEventListener("mouseover", (e) => {
    const btn = e.target.closest(BTN_SEL);
    if (btn) showFrom(btn);
  });
  document.addEventListener("mouseout", (e) => {
    const from = e.target.closest(BTN_SEL);
    const to = e.relatedTarget?.closest?.(BTN_SEL);
    if (from && !to) resetInfo();
  });

  // Teclado (accesibilidad)
  document.addEventListener("focusin", (e) => {
    const btn = e.target.closest(BTN_SEL);
    if (btn) showFrom(btn);
  });
  document.addEventListener("focusout", (e) => {
    const btn = e.target.closest(BTN_SEL);
    if (btn) resetInfo();
  });
})();

function doAZ() {
  const input = document.getElementById("itext").value;

  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Orden alfabético
  lines.sort((a, b) => a.localeCompare(b));

  document.getElementById("otext").value = lines.join("\n");
}

function doZA() {
  const input = document.getElementById("itext").value;

  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Orden inverso
  lines.sort((a, b) => b.localeCompare(a));

  document.getElementById("otext").value = lines.join("\n");
}

// Copiar de itext → otext
function leftToRight() {
  document.getElementById("otext").value =
    document.getElementById("itext").value;
}

// Copiar de otext → itext
function rightToLeft() {
  document.getElementById("itext").value =
    document.getElementById("otext").value;
}

// Borrar contenido del textarea izquierdo (itext)
function cleanLeft() {
  document.getElementById("itext").value = "";
}

// Borrar contenido del textarea derecho (otext)
function cleanRight() {
  document.getElementById("otext").value = "";
}

// Utilidad: obtiene líneas limpias desde itext
function getNames() {
  return document
    .getElementById("itext")
    .value.split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Utilidad: baraja un array (Fisher–Yates)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Utilidad: crea grupos de tamaño 'size' y vuelca en otext
function makeGroups(size) {
  const names = shuffle(getNames());
  const output = [];
  if (names.length === 0) {
    document.getElementById("otext").value = "";
    return;
  }

  const full = Math.floor(names.length / size);
  const rem = names.length % size;

  let groupIndex = 1;
  // Grupos completos
  for (let g = 0; g < full; g++) {
    const start = g * size;
    const chunk = names.slice(start, start + size);
    // Ordenar alfabéticamente dentro del grupo
    chunk.sort((a, b) => a.localeCompare(b));
    for (const member of chunk) {
      output.push(`${member} (Grupo ${groupIndex})`);
    }
    groupIndex++;
  }

  // Grupo de menor tamaño (si lo hay)
  if (rem > 0) {
    const leftover = names.slice(full * size);
    leftover.sort((a, b) => a.localeCompare(b));
    for (const member of leftover) {
      output.push(`${member} (Grupo de menor tamaño)`);
    }
  }

  document.getElementById("otext").value = output.join("\n");
}

// ===== Crear grupos de tamaño X al azar =====
// X viene del input inputtext
function groupX() {
  const size = parseInt(document.getElementById("inputtext").value, 10);

  if (isNaN(size) || size <= 0) {
    document.getElementById("otext").value =
      "Introduce un número válido para el tamaño de grupo.";
    return;
  }

  makeGroups(size);
}

// Transformar texto
function lowerCase() {
  const area = document.getElementById("itext");
  const oarea = document.getElementById("otext");

  oarea.value = area.value.toLowerCase();
}

function upperCase() {
  const area = document.getElementById("itext");
  const oarea = document.getElementById("otext");

  oarea.value = area.value.toUpperCase();
}

function namesUp() {
  const area = document.getElementById("itext");
  const oarea = document.getElementById("otext");

  oarea.value = area.value.toLowerCase().replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.substring(1);
  });
}

// ===== Nueva función: mezclar itext =====
function shuffleList() {
  const lines = getNames();
  const mixed = shuffle(lines);
  document.getElementById("otext").value = mixed.join("\n");
}

function group2() {
  makeGroups(2);
}
function group3() {
  makeGroups(3);
}
function group4() {
  makeGroups(4);
}

// ===== Grupos A+B+B+C =====
// Formato de entrada esperado en itext: "Apellidos, Nombre / X" donde X ∈ {A,B,C}
function abbc() {
  const lines = getNames();
  const A = [],
    B = [],
    C = [];
  const re = /^(.*?)(?:\s*\/\s*)([ABCabc])$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue; // ignora líneas que no cumplan el formato
    const name = m[1].trim();
    const tag = m[2].toUpperCase();
    if (tag === "A") A.push({ name, tag });
    else if (tag === "B") B.push({ name, tag });
    else if (tag === "C") C.push({ name, tag });
  }

  // Barajar cada categoría para aleatoriedad
  const As = shuffle(A);
  const Bs = shuffle(B);
  const Cs = shuffle(C);

  // Número máximo de grupos posibles cumpliendo 1A + 2B + 1C
  const maxGroups = Math.min(As.length, Math.floor(Bs.length / 2), Cs.length);

  const out = [];
  if (maxGroups === 0) {
    out.push(
      "No se pueden formar grupos de 4 con la composición 1A + 2B + 1C."
    );
    out.push(`Disponibles: A=${As.length}, B=${Bs.length}, C=${Cs.length}`);
    document.getElementById("otext").value = out.join("\n");
    return;
  }

  for (let g = 1; g <= maxGroups; g++) {
    const a = As.pop();
    const b1 = Bs.pop();
    const b2 = Bs.pop();
    const c = Cs.pop();

    // Ordenar solo los dos B por nombre
    const Bgroup = [b1, b2].sort((u, v) => u.name.localeCompare(v.name));

    // Mostrar en orden: A → Bs → C
    out.push(`${a.name} (Grupo ${g} / ${a.tag})`);
    for (const b of Bgroup) {
      out.push(`${b.name} (Grupo ${g} / ${b.tag})`);
    }
    out.push(`${c.name} (Grupo ${g} / ${c.tag})`);
  }

  // Sobras (si las hay)
  const leftovers = [...As, ...Bs, ...Cs].sort((u, v) =>
    u.name.localeCompare(v.name)
  );
  if (leftovers.length > 0) {
    //out.push("");
    //out.push("Sin grupo (sobrantes):");
    for (const m of leftovers) out.push(`${m.name} (${m.tag})`);
  }

  document.getElementById("otext").value = out.join("\n");
}

// ===== Eliminar líneas en blanco =====
function cleanLines() {
  const lines = document
    .getElementById("itext")
    .value.split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  document.getElementById("otext").value = lines.join("\n");
}

// ===== Seleccionar n elementos al azar =====
function randomElements() {
  const lines = getNames(); // obtiene la lista desde itext
  const n = parseInt(document.getElementById("inputtext").value, 10);

  if (isNaN(n) || n <= 0) {
    document.getElementById("otext").value = "Introduce un número válido.";
    return;
  }

  if (n > lines.length) {
    document.getElementById(
      "otext"
    ).value = `No hay suficientes elementos. (Hay ${lines.length}, pediste ${n})`;
    return;
  }

  // barajar y cortar los n primeros
  const selected = shuffle(lines).slice(0, n);

  document.getElementById("otext").value = selected.join("\n");
}

// ===== Buscar elementos que contengan un texto =====
function searchElements() {
  const query = document
    .getElementById("searchtext")
    .value.trim()
    .toLowerCase();
  const lines = getNames();

  if (query === "") {
    document.getElementById("otext").value = "Introduce un texto para buscar.";
    return;
  }

  const results = lines.filter((line) => line.toLowerCase().includes(query));

  if (results.length === 0) {
    document.getElementById(
      "otext"
    ).value = `No se encontraron coincidencias con "${query}".`;
  } else {
    document.getElementById("otext").value = results.join("\n");
  }
}

// ===== Dividir la lista en N grupos al azar, grupos iguales salvo el último =====
function splitList() {
  const numGroups = parseInt(document.getElementById("inputtext").value, 10);
  const students = getNames();

  if (isNaN(numGroups) || numGroups <= 0) {
    document.getElementById("otext").value =
      "Introduce un número válido de grupos.";
    return;
  }
  if (students.length === 0) {
    document.getElementById("otext").value = "La lista está vacía.";
    return;
  }
  if (numGroups > students.length) {
    document.getElementById(
      "otext"
    ).value = `No puedes crear ${numGroups} grupos con solo ${students.length} estudiantes.`;
    return;
  }

  // Barajar la lista para asignación aleatoria
  const pool = shuffle(students);

  // Tamaño objetivo para los primeros (numGroups-1) grupos
  const target = Math.ceil(pool.length / numGroups);

  const groups = Array.from({ length: numGroups }, () => []);

  // Rellenar los primeros grupos al tamaño objetivo
  for (let g = 0; g < numGroups - 1; g++) {
    while (groups[g].length < target && pool.length > 0) {
      groups[g].push(pool.pop());
    }
  }
  // El último grupo recibe lo que quede (puede ser menor o igual que target)
  while (pool.length > 0) {
    groups[numGroups - 1].push(pool.pop());
  }

  // Salida: solo líneas "Alumno / Grupo X"
  const out = [];
  groups.forEach((group, i) => {
    for (const student of group) {
      out.push(`${student} / Grupo ${i + 1}`);
    }
  });

  document.getElementById("otext").value = out.join("\n");
}

function joinLists() {
  const left = document.getElementById("itext").value.trim();
  const right = document.getElementById("otext").value.trim();

  // Si ambos tienen contenido, los separamos con un salto de línea
  let result = right;
  if (right && left) {
    result += "\n" + left;
  } else if (left) {
    result = left;
  }

  document.getElementById("otext").value = result;
}

// Debounce simple para no saturar llamadas
function debounce(fn, delay = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchtext");
  if (!input) return;

  // Llama a searchElements() cuando el usuario escribe
  const onType = debounce(() => searchElements(), 150);
  input.addEventListener("input", onType);

  // Opcional: mostrar resultados iniciales si ya hay texto en el input
  // onType();
});

function numberElements() {
  const lines = document
    .getElementById("itext")
    .value.split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const numbered = lines.map((line, i) => `${i + 1}. ${line}`);
  document.getElementById("otext").value = numbered.join("\n");
}

function removeNumbering() {
  const src = document.getElementById("itext").value.split("\n");

  // Quita numeraciones del tipo: "1. ", "1) ", "1 - ", "1: " (con espacios opcionales)
  const cleaned = src
    .map((l) => l.replace(/^\s*\d+\s*[\.\)\:\-]?\s*/, "").trim())
    .filter((l) => l.length > 0);

  document.getElementById("otext").value = cleaned.join("\n");
}

window.onload = function () {
  document.getElementById("doAZ").addEventListener("click", doAZ);
  document.getElementById("doZA").addEventListener("click", doZA);
  document.getElementById("lefttoright").addEventListener("click", leftToRight);
  document.getElementById("righttoleft").addEventListener("click", rightToLeft);
  document.getElementById("cleanleft").addEventListener("click", cleanLeft);
  document.getElementById("cleanright").addEventListener("click", cleanRight);
  document.getElementById("group2").addEventListener("click", group2);
  document.getElementById("group3").addEventListener("click", group3);
  document.getElementById("group4").addEventListener("click", group4);
  document.getElementById("lowercase").addEventListener("click", lowerCase);
  document.getElementById("uppercase").addEventListener("click", upperCase);
  document.getElementById("namesup").addEventListener("click", namesUp);
  document.getElementById("abbc").addEventListener("click", abbc);
  document.getElementById("shuffle").addEventListener("click", shuffleList);
  document.getElementById("cleanlines").addEventListener("click", cleanLines);
  document
    .getElementById("randomelements")
    .addEventListener("click", randomElements);
  /*document.getElementById("searchelements").addEventListener("click", searchElements);*/
  document.getElementById("splitlist").addEventListener("click", splitList);
  document.getElementById("groupx").addEventListener("click", groupX);
  document.getElementById("join").addEventListener("click", joinLists);
  document.getElementById("number").addEventListener("click", numberElements);
  document
    .getElementById("nonumber")
    .addEventListener("click", removeNumbering);
};

/* MODAL */

document.addEventListener("DOMContentLoaded", () => {
  const dlg = document.getElementById("welcome-dialog");
  if (!dlg) return;

  // Abre al cargar la página
  if (typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
  } else {
    // Fallback básico si el navegador no soporta <dialog>
    dlg.setAttribute("open", "");
  }

  // Cerrar al hacer clic en el fondo (fuera del rectángulo del diálogo)
  dlg.addEventListener("click", (e) => {
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) dlg.close("backdrop");
  });
});

// Utilidad: copiar texto al portapapeles (con fallback)
async function copyToClipboard(text) {
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    // feedback opcional en #info
    const info = document.getElementById("info");
    if (info) {
      const prev = info.textContent;
      info.textContent = "Copiado al portapapeles";
      setTimeout(() => (info.textContent = prev), 1200);
    }
  } catch (e) {
    alert("No se pudo copiar. Revisa los permisos del navegador.");
  }
}

// Copiar contenido de #itext
function copyInput() {
  const txt = document.getElementById("itext")?.value || "";
  copyToClipboard(txt);
}

// Copiar contenido de #otext
function copyOutput() {
  const txt = document.getElementById("otext")?.value || "";
  copyToClipboard(txt);
}

// Cableado de botones
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyi")?.addEventListener("click", () => {
    copyInput();
    if (typeof playClick === "function") playClick();
  });
  // si tienes un botón para copiar desde otext
  document.getElementById("copyo")?.addEventListener("click", () => {
    copyOutput();
    if (typeof playClick === "function") playClick();
  });
});

// Utilidad: mostrar estado en #info (si existe)
function setInfo(msg, ms = 1200) {
  const info = document.getElementById("info");
  if (!info) return;
  const prev = info.textContent;
  info.textContent = msg;
  setTimeout(() => (info.textContent = prev), ms);
}

// Pegar en un textarea por id
async function pasteInto(targetId) {
  try {
    if (!navigator.clipboard?.readText) {
      alert(
        "Este navegador no permite leer del portapapeles aquí. Usad Ctrl/Cmd+V."
      );
      return;
    }
    const text = await navigator.clipboard.readText();
    const area = document.getElementById(targetId);
    if (!area) return;
    // Normaliza saltos de línea a \n
    area.value = (text || "").replace(/\r\n?/g, "\n");
    area.focus();
    // Sitúa el cursor al final
    area.setSelectionRange(area.value.length, area.value.length);
    setInfo("Pegado desde portapapeles");
  } catch (e) {
    alert(
      "No se pudo pegar. Aseguraos de usar HTTPS y un gesto de usuario (clic)."
    );
  }
}

// APIs pedidas
function pasteInput() {
  return pasteInto("itext");
}
function pasteOutput() {
  return pasteInto("otext");
}

// Cableado de botones
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("pastei")?.addEventListener("click", () => {
    pasteInput();
    if (typeof playClick === "function") playClick();
  });
  document.getElementById("pasteo")?.addEventListener("click", () => {
    pasteOutput();
    if (typeof playClick === "function") playClick();
  });
});

// Monta el contenido de un <template id="..."> dentro de #sidebar
function mountToolbox(sel) {
  const tpl = document.querySelector(`template${sel}`);
  const oldSidebar = document.getElementById("sidebar");
  if (!tpl || !oldSidebar) return;

  const fresh = oldSidebar.cloneNode(false); // conserva id/clases
  fresh.appendChild(tpl.content.cloneNode(true)); // inserta el contenido del template
  oldSidebar.replaceWith(fresh);

  initToolsetsWithin(fresh);

  // reset inline
  const info = document.getElementById("info");
  if (info) {
    const def = info.dataset?.default || info.textContent || "Información";
    info.textContent = def;
    info.title = def;
  }
}

// Inicializa toggles de .toolset (si los usas)
function initToolsetsWithin(scope) {
  scope.querySelectorAll(".toolset").forEach((set, i) => {
    set.hidden = true;
    if (!set.id) set.id = `toolset-${Date.now()}-${i}`;
    const trigger =
      set.previousElementSibling?.tagName === "BUTTON"
        ? set.previousElementSibling
        : scope.querySelector(`button[data-target="#${set.id}"]`);
    if (!trigger) return;
    trigger.type = "button";
    trigger.setAttribute("aria-controls", set.id);
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", () => {
      const willOpen = set.hidden;
      set.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
  });
}

// Delegación: al hacer click en un botón .tool, monta su template
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button.tool");
  if (!btn) return;
  const sel = btn.dataset.target || `#${btn.id}`;
  mountToolbox(sel);
});

document.addEventListener("DOMContentLoaded", () => {
  mountToolbox("#tblists"); // ← carga “Listas” al iniciar
});

// === Contadores de caracteres, palabras y líneas ===
function textStats(s = "") {
  // Normaliza saltos de línea a \n para contar bien en todos los SO
  const norm = s.replace(/\r\n?/g, "\n");
  const chars = norm.length;
  const words = norm.trim() ? norm.trim().split(/\s+/).length : 0;
  //const lines = norm === '' ? 0 : norm.split('\n').length; // cuenta líneas (incluye vacías)
  // líneas no vacías
  const lines = norm.split("\n").filter((l) => l.trim().length > 0).length;

  return { chars, words, lines };
}

function updateStatusFor(textareaId, statusId) {
  const ta = document.getElementById(textareaId);
  const st = document.getElementById(statusId);
  if (!ta || !st) return;
  const { chars, words, lines } = textStats(ta.value);
  st.textContent = `${chars} caracteres · ${words} palabras · ${lines} líneas con valores`;
}

// Parche único: cuando se asigne .value por JS, emite un 'input' si cambia
(function patchTextareaValueOnce() {
  if (window.__taValuePatched) return;
  const proto = HTMLTextAreaElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (!desc || !desc.set || !desc.get) return; // por si acaso

  Object.defineProperty(proto, "value", {
    get: desc.get,
    set: function (v) {
      const old = desc.get.call(this);
      desc.set.call(this, v);
      if (old !== v) {
        this.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
  });
  window.__taValuePatched = true;
})();

// Enlaza e inicializa contadores
function wireCounters() {
  const pairs = [
    ["itext", "statusi"],
    ["otext", "statuso"],
  ];
  pairs.forEach(([taId, stId]) => {
    const ta = document.getElementById(taId);
    if (!ta) return;
    const handler = () => updateStatusFor(taId, stId);

    ta.addEventListener("input", handler);
    ta.addEventListener("change", handler);

    handler(); // estado inicial
  });
}

// Por si quieres forzar manualmente tras cambios por JS
function refreshCounters() {
  updateStatusFor("itext", "statusi");
  updateStatusFor("otext", "statuso");
}

document.addEventListener("DOMContentLoaded", wireCounters);
