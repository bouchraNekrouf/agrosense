// Login Functionality enhancement
document.addEventListener("DOMContentLoaded", () => {
  // --------- Choix du type d'utilisateur ---------
  const userTypeButtons = document.querySelectorAll(".grid button");

  userTypeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      userTypeButtons.forEach(b => b.classList.remove("user-type-selected"));
      btn.classList.add("user-type-selected");
    });
  });

  // --------- Afficher/Masquer le mot de passe ---------
  const passwordInput = document.querySelector('#passwor');
  const togglePasswordBtn = document.getElementById('passwordToggle');

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
      togglePasswordBtn.querySelector('.eye-icon').classList.toggle('show-password');
    });
  }

  // --------- Envoi du formulaire au Backend ---------
  const form = document.querySelector("#loginForm");
  const submitBtn = document.querySelector(".login-btn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Effacer les erreurs précédentes
      document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

      // Vérifier que les champs ne sont pas vides
      const requireds = form.querySelectorAll('[required]');
      let formValid = true;
      requireds.forEach(req => {
        if (!req.value.trim()) {
          req.parentElement.nextElementSibling.innerText = "Ce champ est requis";
          req.parentElement.nextElementSibling.classList.add('show');
          formValid = false;
        }
      });

      if (!formValid) return;

      // Afficher l'état de chargement du bouton
      submitBtn.classList.add('loading');

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          const successMsg = document.getElementById('successMessage');
          if (successMsg) {
            successMsg.querySelector('h3').innerText = "Vérification email requise";
            successMsg.querySelector('p').innerText = result.message || "Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.";
            successMsg.classList.add('show');
            form.style.display = 'none'; // Masquer le formulaire
          } else {
            alert(result.message || "Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.");
          }

          setTimeout(() => {
            window.location.href = "sign.html";
          }, 2500);
        } else {
          alert("Erreur: " + result.message);
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Erreur: Impossible de créer le compte pour le moment. Réessayez plus tard.");
        submitBtn.classList.remove('loading');
      }
    });
  }
});
