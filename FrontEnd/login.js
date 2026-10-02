const loginUrl = "http://localhost:5678/api/users/login";
const loginForm = document.querySelector("#login form");
const loginStatus = document.querySelector("#login-status");
const loginButton = loginForm.querySelector("button");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = "Connexion...";

  const formData = new FormData(loginForm);

  try {
    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.token) {
      loginStatus.textContent = "E-mail ou mot de passe incorrect.";
      loginStatus.hidden = false;
      return;
    }

    localStorage.setItem("token", result.token);
    window.location.href = "./index.html";
  } catch (error) {
    loginStatus.textContent = "Connexion impossible. Veuillez réessayer.";
    loginStatus.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Se connecter";
  }
});