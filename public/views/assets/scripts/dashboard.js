document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll(
    ".settings .card:not(.confidential) input:not(.dynamic), .settings textarea,.settings select"
  );
  const dynamicinpcont = document.querySelectorAll(".judgement-option");
  const buttons = document.querySelector(".savecancle");
  const initialValues = new Map();
  // Store initial values on focus
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      if (!initialValues.has(input)) {
        initialValues.set(input, input.value);
      }
    });

    // Check for changes on input
    input.addEventListener("input", function () {
      const initialValue = initialValues.get(input);
      if (input.value !== initialValue) {
        buttons.style.display = "flex";
      } else {
        hideButtonsIfNoChanges();
      }
    });
  });
  dynamicinpcont.forEach((e) => {
    let inputs = e.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("focus", function () {
        if (!initialValues.has(input)) {
          initialValues.set(input, input.value);
        }
      });

      // Check for changes on input
      input.addEventListener("input", function () {
        const initialValue = initialValues.get(input);
        if (input.value !== initialValue) {
          buttons.style.display = "flex";
        } else {
          hideButtonsIfNoChanges();
        }
      });
    });
  });
  delete userdata?.trns;
  document.querySelector(".save").addEventListener("click", function () {
    inputs.forEach((e) => {
      const key = e.dataset.properties.toLowerCase().replace(/\s+/g, "_");
      userdata[key] = e.value;
      //console.log(key, e.value);
    });
    dynamicinpcont.forEach((e) => {
      let inputs = e.querySelectorAll("input");
      userdata.dynamic[inputs[0].value] = {
        wikitext: inputs[1].value,
        mark: inputs[2].value,
      };
    });
    initialValues.clear(); // Clear stored values after saving
    hideButtons();
    //console.log(userdata);
    delete userdata.jurries_list;
    proxyFetch(
      "dashboard",
      {
        data: userdata,
        key: userdata.key,
        pass: null,
      },
      (data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          window.location.reload();
        }
      }
    );
  });

  document.querySelector(".cancel").addEventListener("click", function () {
    inputs.forEach((input) => {
      if (initialValues.has(input)) {
        input.value = initialValues.get(input); // Revert to initial value
      }
    });
    hideButtons();
  });

  function hideButtons() {
    buttons.style.display = "none";
  }

  function hideButtonsIfNoChanges() {
    const hasChanges = Array.from(inputs).some((input) => {
      const initialValue = initialValues.get(input);
      return input.value !== initialValue;
    });
    if (!hasChanges) {
      hideButtons();
    }
  }
  // Initially hide buttons
  hideButtons();
});
const deleteKey = async function (key) {
  try {
    const response = await fetch("/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: key,
        type: "key",
      }),
    });

    const resdata = await response.json();

    if (resdata.success) {
      // Redirect to create new key page
      window.location.href = "/";
    } else {
      console.error("Error deleting key file:", resdata.error);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
