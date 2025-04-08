const validateStr = function (string) {
  var textArea = document.createElement("textarea");
  textArea.innerHTML = string;
  return textArea.value.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
};
const proxyFetch = function (href, data, callback, method = "POST") {
  fetch("/" + href, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      callback(data);
    });
};
const sortTable = function (n, type = "s", c) {
  const table =
    document.querySelector("#table") ||
    document.querySelectorAll(".table")[c || 0];
  let rows,
    switching,
    i,
    x,
    y,
    shouldSwitch,
    dir,
    switchcount = 0;
  switching = true;
  dir = "asc";

  // Get the header that was clicked and its sort icon
  const headers = table.parentElement.getElementsByTagName("th");
  const header = headers[n];
  const sortIcon = header.querySelector(".sort-icon img");

  // Reset all sort icons
  for (let th of headers) {
    th.querySelector(".sort-icon img").src = "/assets/imgs/sort down.svg";
  }
  let reaminingHeep = 2048;
  if (performance?.memory) {
    reaminingHeep =
      (performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize) /
      1024;
  }
  if (reaminingHeep / table.querySelectorAll("tr").length > 10) {
    while (switching) {
      switching = false;
      rows = table.querySelectorAll("tr:not(.letter)");
      for (i = 0; i < rows.length - 1; i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[n];
        y = rows[i + 1].getElementsByTagName("TD")[n];
        let xinfo = type == "d" ? Number(x.innerHTML) : x.innerHTML;
        let yinfo = type == "d" ? Number(y.innerHTML) : y.innerHTML;
        if (dir === "asc") {
          if (xinfo > yinfo) {
            shouldSwitch = true;
            break;
          }
        } else if (dir === "desc") {
          if (xinfo < yinfo) {
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        switchcount++;
      } else {
        if (switchcount === 0 && dir === "asc") {
          dir = "desc";
          switching = true;
        }
      }
      // Toggle the sort icon based on direction
      if (dir === "asc") {
        sortIcon.src = "/assets/imgs/sort up.svg";
      } else {
        sortIcon.src = "/assets/imgs/sort down.svg";
      }
    }
  } else {
    msg({
      message:
        "Your device will be almost out of memory to performe this action. Thst's why its terminated by checkmate.",
      type: "warn",
      autoHide: 5,
    });
  }
};
const csprompt = function (
  title,
  message,
  callback,
  {
    value = "",
    placeholder = "Type your response...",
    type = "show",
    buttonTexts = ["Ok", "cancel"],
  } = {
    value: "",
    placeholder: "Type your response...",
    type: "show",
    buttonTexts: ["Ok", "cancel"],
  }
) {
  // Create the prompt if it doesn't exist
  const promptElements = createPromptElement(
    type,
    value || null,
    placeholder,
    buttonTexts
  );
  // Set the title and message
  promptElements.promptTitle.textContent = title;
  promptElements.promptMessage.innerHTML = message;
  // Show the prompt
  promptElements.overlay.classList.add("show");
  // OK button action
  promptElements.okButton.onclick = function () {
    const inputValue = promptElements.promptInput.value.trim();
    if (callback) {
      callback(inputValue);
    }
    document.body.removeChild(promptElements.overlay);
  };

  // Cancel button action
  promptElements.cancelButton.onclick = function () {
    if (callback) {
      callback(null);
    }
    document.body.removeChild(promptElements.overlay);
  };
};
const csalert = function (
  title,
  message,
  callback,
  type = "hide",
  buttons = []
) {
  // Create the alert element using the helper function
  const alertElements = createAlertElement(type, buttons);
  // Set the title and message
  alertElements.alertTitle.textContent = title;
  alertElements.alertMessage.innerHTML = message;

  // Show the alert (optional: you can add show/hide logic as needed)
  alertElements.overlay.classList.add("show");

  // Handle button clicks
  alertElements.buttonElements.forEach((buttonElement) => {
    buttonElement.onclick = function () {
      // If a callback is provided, call it with the button's value
      if (callback) {
        if (buttons.length > 0) {
          // Pass the value of the clicked button
          callback(buttonElement.value);
        } else {
          // Default "OK" case
          callback("OK");
        }
      }
      // Remove the alert after button is clicked
      document.body.removeChild(alertElements.overlay);
    };
  });
};
const msg = function ({
  message,
  redirect = null,
  type = "info",
  autoHide = 0,
}) {
  // Get or create the popup container
  let popupCont = document.querySelector("#popup-container");
  if (!popupCont) {
    popupCont = document.createElement("div");
    popupCont.id = "popup-container";
    document.body.appendChild(popupCont);
  }

  // Create popup element
  const popup = document.createElement("div");
  popup.className = `popup ${type}`;

  // Create and append message element
  const messageElement = document.createElement("div");
  messageElement.className = "popup-message";
  messageElement.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word;">${message}</pre>`;
  popup.appendChild(messageElement);

  // Append popup to the container
  popupCont.appendChild(popup);

  // Show popup container
  popupCont.style.display = "block";

  const removePopup = () => {
    popup.classList.add("hide");
    setTimeout(() => {
      popup.remove();
      // If no more popups, remove the popup container
      if (popupCont.children.length === 0) {
        popupCont.remove();
      }
    }, 1000);
  };

  // Handle redirection with timer or button
  if (redirect) {
    if (typeof redirect.timer === "number" && redirect.timer > 0) {
      const timerElement = document.createElement("div");
      timerElement.className = "popup-timer";
      popup.appendChild(timerElement);

      let timeLeft = redirect.timer;
      timerElement.textContent = `Redirecting in ${timeLeft} seconds...`;

      const countdown = setInterval(() => {
        timeLeft -= 1;
        timerElement.textContent = `Redirecting in ${timeLeft} seconds...`;
        if (timeLeft <= 0) {
          clearInterval(countdown);
          removePopup();
          setTimeout(() => {
            if (redirect?.url) window.location.href = redirect.url;
            else location.reload();
          }, 1000);
        }
      }, 1000);
    } else if (redirect.button) {
      const buttonElement = document.createElement("button");
      buttonElement.textContent = redirect.button;
      buttonElement.addEventListener("click", () => {
        removePopup();
        setTimeout(() => {
          window.location.href = redirect.url;
        }, 1000);
      });
      popup.appendChild(buttonElement);
    }
  } else if (autoHide > 0) {
    setTimeout(removePopup, autoHide * 1000);
  } else {
    popup.addEventListener("click", removePopup);
  }
};
const init = (transObj) => {
  window.transObj = JSON.parse(decodeURIComponent(transObj));
};
const translate = (key, type = "s") => {
  if (type == "s") {
    if (typeof key == "string") {
      if (transObj?.lebel[key]) {
        return transObj?.lebel[key];
      } else {
        return key;
      }
    } else {
      return key.reduce((obj, key) => obj && obj[key], data);
    }
  } else if (type == "d") {
    return key
      .split("")
      .map((element) => {
        return transObj.lebel.counts[element];
      })
      .join("");
  }
};
window.addEventListener("DOMContentLoaded", function () {
  let key = "IOt0opzjmObdTqewC/FGm5PHNmV+7QuhbHmox5bpfFE=";
  let data = JSON.parse(localStorage.getItem(key));
  let menu = document.querySelector("ul.menu");
  window.username = "";
  window.userlang = "en";
  if (menu) {
    let logout = document.createElement("li");
    let user = document.createElement("li");
    let callbackurl = encodeURIComponent(window.location.href.split("/").pop());
    if (data) {
      logout.innerHTML = `<a onclick="localStorage.removeItem('${key}')" href="/logout?username=${data.username}&callback=${callbackurl}">Logout</a>`;
      user.innerHTML = `<span style="display: flex; align-items: center; flex-dirrection: row;"><img height="25px" width="25px" src="/assets/imgs/user.png" /><a href="/user?user=${encodeURIComponent(
        data.username
      )}">&nbsp;${data.username}</a></span>`;
      menu.appendChild(logout);
      menu.appendChild(user);
      window.username = data.username;
      window.userlang = data?.userlang || "en";
    } else {
      logout.innerHTML =
        '<li><a href="/login?callback=' + callbackurl + '">Login</a></li>';
      window.username = "";
      menu.appendChild(logout);
    }
    if (window?.transObj?.langname) {
      let lang = document.createElement("li");
      lang.innerHTML = `<abbr title=${window.transObj.contributer.join(
        ","
      )} style="display: flex; align-items: center; flex-dirrection: row;"><img height="25px" width="25px" src="/assets/imgs/language.png" />&nbsp;${
        window.transObj.langname
      }</abbr>`;
      menu.appendChild(lang);
    }
  }
});
function createPromptElement(type, value, placeholder, buttonTexts) {
  // Create the main prompt overlay
  const overlay = document.createElement("div");
  overlay.classList.add("custom-prompt-overlay");
  if (type == "hide") {
    overlay.style.backgroundColor = "#fff";
  } else {
    overlay.style.backgroundColor = "#000a";
  }

  // Create the prompt box
  const promptBox = document.createElement("div");
  promptBox.classList.add("custom-prompt-box");

  // Create the title
  const promptTitle = document.createElement("h2");
  promptTitle.classList.add("custom-prompt-title");
  promptTitle.textContent = ""; // Title will be set dynamically

  // Create the message
  const promptMessage = document.createElement("p");
  promptMessage.classList.add("custom-prompt-message");
  promptMessage.innerHTML = ""; // Message will be set dynamically

  // Create the textarea for user input
  const promptInput = document.createElement("textarea");
  promptInput.classList.add("custom-prompt-input");
  promptInput.setAttribute("rows", "4");
  promptInput.placeholder = placeholder;
  if (value) promptInput.value = value;

  // Create buttons container
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("custom-prompt-buttons");

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.classList.add("custom-prompt-button", "custom-prompt-cancel");
  cancelButton.textContent = buttonTexts[1]?.text || buttonTexts[1] || "Cancel";
  cancelButton.value = buttonTexts[1]?.value || buttonTexts[1] || "Cancel";

  // OK button
  const okButton = document.createElement("button");
  okButton.classList.add("custom-prompt-button");
  okButton.textContent = buttonTexts[0]?.text || buttonTexts[0] || "Ok";
  okButton.value = buttonTexts[0]?.value || buttonTexts[0] || "Ok";

  // Append elements to the prompt box
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(okButton);
  promptBox.appendChild(promptTitle);
  promptBox.appendChild(promptMessage);
  promptBox.appendChild(promptInput);
  promptBox.appendChild(buttonContainer);
  overlay.appendChild(promptBox);
  document.body.appendChild(overlay);

  // Return references to key elements for dynamic updates
  return {
    overlay,
    promptTitle,
    promptMessage,
    promptInput,
    okButton,
    cancelButton,
  };
}
function createAlertElement(type, buttons = []) {
  // Create the main alert overlay
  const overlay = document.createElement("div");
  overlay.classList.add("custom-alert-overlay");
  overlay.style.backgroundColor = type === "hide" ? "#fff" : "#000a";
  // Create the alert box
  const alertBox = document.createElement("div");
  alertBox.classList.add("custom-alert-box");

  // Create the title
  const alertTitle = document.createElement("h2");
  alertTitle.classList.add("custom-alert-title");
  alertTitle.textContent = ""; // Title will be set dynamically

  // Create the message (accepting HTML)
  const alertMessage = document.createElement("p");
  alertMessage.classList.add("custom-alert-message");
  alertMessage.innerHTML = ""; // Message will be set dynamically and accept HTML

  // Append elements to the alert box
  alertBox.appendChild(alertTitle);
  alertBox.appendChild(alertMessage);

  // If no custom buttons are provided, create the default "OK" button
  const buttonElements = [];
  if (buttons.length === 0) {
    const okButton = document.createElement("button");
    okButton.classList.add("custom-alert-button");
    okButton.textContent = "OK";
    buttonElements.push(okButton);
    alertBox.appendChild(okButton);
  } else {
    // Create custom buttons based on the provided array
    buttons.forEach((button) => {
      const customButton = document.createElement("button");
      customButton.classList.add("custom-alert-button");
      customButton.textContent = button.text || button; // Use the button text from the array
      customButton.value = button.value || button; // Use the button text from the array
      buttonElements.push(customButton);
      alertBox.appendChild(customButton);
    });
  }

  // Add alert box to the overlay
  overlay.appendChild(alertBox);
  document.body.appendChild(overlay);
  // Return references to key elements for dynamic updates
  return {
    overlay,
    alertTitle,
    alertMessage, // Message element can now accept HTML content
    buttonElements, // Return an array of button elements
  };
}
