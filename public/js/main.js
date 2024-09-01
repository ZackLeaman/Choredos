const showPassword = document.querySelector("#showPassword");
const password = document.querySelector("#password");
const confirmPassword = document.querySelector("#confirmPassword");

function showPasswordClickHandler() {
  const type = showPassword.checked ? "text" : "password";
  if (password) {
    password.type = type;
  }
  if (confirmPassword) {
    confirmPassword.type = type;
  }
}

showPassword.addEventListener("click", showPasswordClickHandler);
