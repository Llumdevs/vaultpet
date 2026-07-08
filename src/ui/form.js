/* Formulario de acceso. Sin backend todavía: valida y confirma en local
   para que no parezca roto. El envío real irá donde marca el comentario. */
export function initWaitlistForm() {
  const form = document.getElementById("waitlist-form");
  if (!form) return;

  const email = form.querySelector('input[type="email"]');
  const status = document.getElementById("waitlist-status");
  const setStatus = (msg, state) => {
    if (!status) return;
    status.textContent = msg;
    status.dataset.state = state;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!email.value.trim() || !email.checkValidity()) {
      setStatus("Revisa el email e inténtalo de nuevo.", "error");
      email.focus();
      return;
    }
    // Pendiente backend: aquí irá el envío del email a la lista real.
    setStatus("Estás en la lista. Te avisamos al abrir el próximo drop.", "ok");
    form.reset();
  });
}
