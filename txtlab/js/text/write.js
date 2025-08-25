export function initWriteMode() {
  const inputGoal    = document.getElementById("nwords");
  const goalWords    = document.getElementById("goalWords");
  const currentWords = document.getElementById("currentWords");
  const percWords    = document.getElementById("percWords");
  const progress     = document.getElementById("writeprogress");
  const textInput    = document.getElementById("itext");
  const timerEl      = document.getElementById("timer");
  const successDlg   = document.getElementById("success-dialog"); // 🎉 modal

  let timer = null;
  let seconds = 0;
  let started = false;
  let goalReached = false; // evitar mostrar varias veces

  function formatTime(s) {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  function startTimer() {
    if (started) return;
    started = true;
    timer = setInterval(() => {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function updateGoal() {
    const newGoal = parseInt(inputGoal.value, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      goalWords.textContent = newGoal;
      progress.max = newGoal;
    } else {
      goalWords.textContent = "0";
      progress.max = 0;
    }
    updateCurrent();
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

      // 🎉 Mostrar modal si se alcanza el objetivo
      if (words >= goal && !goalReached) {
        goalReached = true;
        if (successDlg) successDlg.showModal();
      }
    } else {
      percWords.textContent = "0 %";
      progress.value = 0;
    }
  }

  // 👉 Valores iniciales al cargar
  inputGoal.value = "250";    // meta inicial
  textInput.value = "";       // textarea vacío
  updateGoal();

  // Eventos
  inputGoal?.addEventListener("input", () => {
    goalReached = false; // reset si cambia la meta
    updateGoal();
  });

  textInput?.addEventListener("input", () => {
    updateCurrent();
    startTimer();
  });
}
