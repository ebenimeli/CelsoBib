// Elementos del DOM
const panel = document.getElementById("panel");
const input = document.getElementById("wordInput");
const pickBtn = document.getElementById("pickWordBtn");
const selectedImg = document.getElementById("selectedImg");
const wordIcons = document.querySelectorAll(".word-icon");

// Lista de palabras e imágenes
const wordList = ["GATO", "SOL", "LUNA", "SPIDEY", "SPIN", "HULK", "RHINO"];
const wordImages = [
  "images/gato.jpg",
  "images/sol.jpg",
  "images/luna.jpg",
  "images/spidey.jpg",
  "images/spin.jpg",
  "images/hulk.jpg",
  "images/rhino.jpg",
];

let currentIndex = 0;

// ==== LISTA DE AUDIOS DISPONIBLES (sin extensión). Edita según tus mp3 reales ====
const AVAILABLE_WORD_AUDIOS = new Set([
  // ejemplos:
  "cat",
  "dog",
  "frog",
  "horse",
  "lion",
  "elephant",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "spidey",
  "gato",
  "sol",
  "luna",
]);

// AudioContext y frecuencias
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const lowFreq = 220;
const highFreq = 880;

// Funciones de sonido base
function playFreq(freq, duration = 0.3, startTime = audioCtx.currentTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, startTime);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playScale() {
  const scaleFreqs = [
    261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
  ];
  const interval = 0.1;
  scaleFreqs.forEach((freq, i) => {
    playFreq(freq, 0.3, audioCtx.currentTime + i * interval);
  });
}

function playNote(letter) {
  const idx = letter.charCodeAt(0) - 65;
  const freq = lowFreq + (idx / 25) * (highFreq - lowFreq);
  playFreq(freq);
}

function playDeleteSound() {
  playFreq(100, 0.15);
}

// Audio especial para Spidey
const spideyAudio = new Audio("audio/spidey.mp3");
spideyAudio.preload = "auto";
function playSpidey() {
  spideyAudio.currentTime = 0;
  spideyAudio.play().catch(() => {});
}

// --- Audios de números 0–9
const numberAudios = {};
for (let i = 0; i <= 9; i++) {
  const audio = new Audio(`audio/say${i}.mp3`);
  audio.preload = "auto";
  numberAudios[i] = audio;
}
function playNumberAudio(num) {
  const audio = numberAudios[num];
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* silencio */
    });
  }
}

// Reproducir palabra solo si está en la whitelist (evita 404 en file://)
function maybePlayWordAudio(wordUpper) {
  const key = wordUpper.trim().toLowerCase();
  if (!key || key.length < 2) return;
  if (!AVAILABLE_WORD_AUDIOS.has(key)) return; // <-- clave para evitar el 404

  const src = `audio/${key}.mp3`;
  const a = new Audio(src);
  a.play().catch(() => {
    /* silencio */
  });
}

// Actualiza panel central según el texto
function updatePanel() {
  const value = input.value;
  panel.innerHTML = "";
  if (!value) return;
  const letters = value.split("");
  const effectiveCount = Math.max(letters.length, 3);
  const widthPct = 100 / effectiveCount;

  letters.forEach((letter) => {
    if (letter === " ") {
      const blank = document.createElement("div");
      blank.className = "blank";
      blank.style.flex = `0 0 ${widthPct}%`;
      blank.style.margin = "2px";
      blank.style.aspectRatio = "1/1";
      panel.appendChild(blank);
    } else if (/[A-ZÑ0-9]/i.test(letter)) {
      const img = document.createElement("img");
      if (/[A-ZÑ]/i.test(letter)) {
        img.src = `images/letters/${letter}.png`;
      } else {
        img.src = `images/numbers/${letter}.png`;
      }
      img.alt = letter;
      img.style.flex = `0 0 ${widthPct}%`;
      img.style.maxWidth = `${widthPct}%`;
      img.style.margin = "2px";
      panel.appendChild(img);
    }
  });
}

// Actualiza miniatura junto al botón
function updateSelectedImage() {
  selectedImg.src = wordImages[currentIndex];
  selectedImg.alt = wordList[currentIndex];
}

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  input.value = wordList[currentIndex];
  updatePanel();
  updateSelectedImage();
  currentIndex = (currentIndex + 1) % wordList.length;
});

// Siguiente palabra con botón
pickBtn.addEventListener("click", () => {
  input.value = wordList[currentIndex];
  updatePanel();
  updateSelectedImage();
  currentIndex = (currentIndex + 1) % wordList.length;
});

// Click en iconos de palabra
wordIcons.forEach((img, idx) => {
  img.addEventListener("click", () => {
    input.value = img.dataset.word;
    updatePanel();
    if (idx === 0) {
      playSpidey();
    } else {
      playScale();
    }
  });
});

// Sonido al borrar
input.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" || e.key === "Delete") playDeleteSound();
});

// Forzar mayúsculas, reproducir nota y actualizar panel
// Además, intentar reproducir audio de palabra usando la whitelist tras 2s de inactividad
let wordAudioTimeout = null;
input.addEventListener("input", (e) => {
  input.value = input.value.toUpperCase();
  const char = e.data ? e.data.toUpperCase() : null;
  if (char && /[A-ZÑ]/.test(char)) playNote(char);
  updatePanel();

  // Reinicia temporizador de audio
  clearTimeout(wordAudioTimeout);
  const word = input.value;
  if (word.length > 1) {
    wordAudioTimeout = setTimeout(() => {
      maybePlayWordAudio(word);
    }, 2000); // 2000 ms = 2 segundos
  }
});

// --- Reproducir audio de número al pulsar tecla 0–9 y mostrarlo en panel
document.addEventListener("keydown", (e) => {
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});

  const isDigitTop = /^Digit[0-9]$/.test(e.code);
  const isDigitPad = /^Numpad[0-9]$/.test(e.code);
  if (!isDigitTop && !isDigitPad) return;

  const key = e.key; // '0'..'9'
  if (/^[0-9]$/.test(key)) {
    if (e.target !== input) {
      input.value += key;
      updatePanel();
    }
    playNumberAudio(key);
  }
});
