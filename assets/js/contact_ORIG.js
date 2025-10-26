const textarea = document.getElementById('message');
const counter  = document.getElementById('counter');

textarea.addEventListener('input', () => {
  counter.textContent = textarea.value.length + " / 5000";
});

document.querySelector("form").addEventListener("submit", function(e) {
  const message = document.getElementById("message");
  if (message.value.trim().length < 10) {
    e.preventDefault(); // impide que se envíe
    alert("El mensaje debe tener al menos 10 caracteres.");
    message.focus();
  }
});
