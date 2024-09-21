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

function submitForm(urlAppend, formData, csrfToken) {
  console.log(window.location.origin, urlAppend);

  const url = new URL(urlAppend, window.location.origin);

  const body = {};
  formData.forEach((element) => {
    const inputElement = document.querySelector(`#${element}`);
    body[element] = inputElement.value;
  });
  const options = {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
  };

  fetch(url, options);
}
