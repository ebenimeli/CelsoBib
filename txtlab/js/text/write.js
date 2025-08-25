export function initWriteMode() {
  // --- Referencias UI ---
  const inputGoal    = document.getElementById("nwords");
  const goalWords    = document.getElementById("goalWords");
  const currentWords = document.getElementById("currentWords");
  const percWords    = document.getElementById("percWords");
  const progress     = document.getElementById("writeprogress");
  const textInput    = document.getElementById("itext");
  const timerEl      = document.getElementById("timer");
  const successDlg   = document.getElementById("success-dialog");

  // Controles del timer (si existen)
  const btnPlay   = document.getElementById("timer-play");
  const btnPause  = document.getElementById("timer-pause");
  const btnReset  = document.getElementById("timer-reset"); // ← NUEVO

  // Modal de éxito + botones de compartir
  const successGoal  = document.getElementById("success-goal");
  const successTime  = document.getElementById("success-time");
  const shareX       = document.getElementById("share-x");
  const shareWA      = document.getElementById("share-wa");
  const shareMail    = document.getElementById("share-mail");

  const SITE_URL = "https://www.ebenimeli.org/txtlab/";

  // Si el template aún no está montado, salir sin romper
  if (!inputGoal || !goalWords || !currentWords || !progress || !textInput || !timerEl) {
    console.warn("[write] UI aún no montada; initWriteMode() aborta.");
    return;
  }

  // --- Estado ---
  let timer = null;
  let seconds = 0;
  let running = false;
  let goalReached = false;

  // --- Utilidades tiempo ---
  const formatClock = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const formatNaturalDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} h`);
    if (m > 0) parts.push(`${m} min`);
    if (sec > 0) parts.push(`${sec} s`);
    return parts.length ? parts.join(" ") : "0 s";
  };

  // --- Timer ---
  const updateTimerButtons = () => {
    if (!btnPlay || !btnPause) return;
    btnPlay.disabled  = running;
    btnPause.disabled = !running;
  };

  const startTimer = () => {
    if (running) return;
    running = true;
    timer = setInterval(() => {
      seconds++;
      timerEl.textContent = formatClock(seconds);
    }, 1000);
    updateTimerButtons();
  };

  const pauseTimer = () => {
    if (!running) return;
    clearInterval(timer);
    timer = null;
    running = false;
    updateTimerButtons();
  };

  const resetTimer = () => {         // ← NUEVO
    pauseTimer();                    // por si estaba corriendo
    seconds = 0;
    timerEl.textContent = "00:00:00";
    // no tocamos goalReached, texto ni contadores
  };

  // --- Share ---
  function updateShareLinks(goal, naturalTime) {
    const text = `🎉 ¡He alcanzado mi objetivo de escribir ${goal} palabras! He estado ${naturalTime} escribiendo con txtlab: ${SITE_URL}`;
    const enc  = encodeURIComponent(text);
    if (shareX)   shareX.href   = `https://x.com/intent/tweet?text=${enc}`;
    if (shareWA)  shareWA.href  = `https://api.whatsapp.com/send?text=${enc}`;
    if (shareMail){
      const subject = encodeURIComponent("¡Objetivo de escritura alcanzado!");
      shareMail.href = `mailto:?subject=${subject}&body=${enc}`;
    }
    // Facebook/LinkedIn comparten solo la URL por política: ya están OK en HTML.
  }

  // --- Lógica palabras ---
  function updateGoal() {
    const newGoal = parseInt(inputGoal.value, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      goalWords.textContent = newGoal;
      progress.max = newGoal;
    } else {
      goalWords.textContent = "0";
      progress.max = 0;
    }
    updateCurrent(); // recalcula % inmediatamente
  }

  function updateCurrent() {
    const text = textInput.value.trim();
    const words = text === "" ? 0 : text.split(/\s+/).length;
    currentWords.textContent = words;

    const goal = parseInt(goalWords.textContent, 10) || 0;

    if (goal > 0) {
      const perc = Math.min((words / goal) * 100, 100);
      percWords.textContent = Math.round(perc) + " %";
      progress.value = words;

      // Objetivo alcanzado -> pausar, rellenar modal y compartir
      if (words >= goal && !goalReached) {
        goalReached = true;
        pauseTimer();

        const natural = formatNaturalDuration(seconds);
        if (successGoal) successGoal.textContent = goal;
        if (successTime) successTime.textContent = natural;
        updateShareLinks(goal, natural);

        successDlg?.showModal();
      }
    } else {
      percWords.textContent = "0 %";
      progress.value = 0;
    }
  }

  // --- Estado inicial ---
  if (!inputGoal.value) inputGoal.value = "250"; // por si HTML no trae valor
  textInput.value = "";
  seconds = 0;
  timerEl.textContent = "00:00:00";
  updateGoal();
  updateTimerButtons();

  // --- Eventos ---
  inputGoal.addEventListener("input", () => {
    goalReached = false; // si cambia la meta, permitir celebrar de nuevo
    updateGoal();
  });

  textInput.addEventListener("input", () => {
    updateCurrent();
    startTimer(); // autostart al escribir
  });

  btnPlay?.addEventListener("click", startTimer);
  btnPause?.addEventListener("click", pauseTimer);
  btnReset?.addEventListener("click", resetTimer); // ← NUEVO
}
