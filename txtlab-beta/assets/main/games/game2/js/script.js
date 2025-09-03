// Elementos del DOM
const panel = document.getElementById('panel');
const input = document.getElementById('wordInput');
const pickBtn = document.getElementById('pickWordBtn');
const selectedImg = document.getElementById('selectedImg');
const wordIcons = document.querySelectorAll('.word-icon');

// Lista de palabras e imágenes
const wordList = ['GATO', 'SOL', 'LUNA', 'SPIDEY', 'SPIN', 'HULK', 'RHINO'];
const wordImages = [
  'images/gato.jpg',
  'images/sol.jpg',
  'images/luna.jpg',
  'images/spidey.jpg',
  'images/spin.jpg',
  'images/hulk.jpg',
  'images/rhino.jpg'
];

let currentIndex = 0;

// AudioContext y frecuencias
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const lowFreq = 220;
const highFreq = 880;

// Funciones de sonido
function playFreq(freq, duration = 0.3, startTime = audioCtx.currentTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, startTime);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playScale() {
  const scaleFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const interval = 0.10;
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
const spideyAudio = new Audio('audio/spidey.mp3');
spideyAudio.preload = 'auto';
function playSpidey() {
  spideyAudio.currentTime = 0;
  spideyAudio.play().catch(err => console.error(err));
}

// Actualiza panel central según el texto
function updatePanel() {
  const value = input.value;
  panel.innerHTML = '';
  if (!value) return;
  const letters = value.split('');
  const effectiveCount = Math.max(letters.length, 3);
  const widthPct = 100 / effectiveCount;

  letters.forEach(letter => {
    if (letter === ' ') {
      const blank = document.createElement('div');
      blank.className = 'blank';
      blank.style.flex = `0 0 ${widthPct}%`;
      blank.style.margin = '2px';
      blank.style.aspectRatio = '1/1';
      panel.appendChild(blank);
    } else if (/[A-Z]/.test(letter)) {
      const img = document.createElement('img');
      img.src = `images/letters/letter_${letter}.jpg`;
      img.alt = letter;
      img.style.flex = `0 0 ${widthPct}%`;
      img.style.maxWidth = `${widthPct}%`;
      img.style.margin = '2px';
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
document.addEventListener('DOMContentLoaded', () => {
  input.value = wordList[currentIndex];
  updatePanel();
  updateSelectedImage();
  currentIndex = (currentIndex + 1) % wordList.length;
});

// Siguiente palabra
pickBtn.addEventListener('click', () => {
  input.value = wordList[currentIndex];
  updatePanel();
  updateSelectedImage();
  currentIndex = (currentIndex + 1) % wordList.length;
});

// Click en iconos de palabra
wordIcons.forEach((img, idx) => {
  img.addEventListener('click', () => {
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
input.addEventListener('keydown', e => {
  if (e.key === 'Backspace' || e.key === 'Delete') playDeleteSound();
});

// Forzar mayúsculas, reproducir nota y actualizar panel
input.addEventListener('input', e => {
  input.value = input.value.toUpperCase();
  const char = e.data ? e.data.toUpperCase() : null;
  if (char && /[A-Z]/.test(char)) playNote(char);
  updatePanel();
});
