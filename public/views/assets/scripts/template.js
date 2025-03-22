const subbtn = document.getElementById("submit");
const cancel = document.getElementById("cancel");
subbtn.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent the default form submission behavior

  // Create an object to store the form data
  const formData = {};

  // Read inputs and selects from the `window` section
  const windowInputs = document.querySelectorAll(
    "#window input:not(.dynamic), #window select"
  );

  windowInputs.forEach((input) => {
    const key = (input.dataset.properties || input.name || input.id)
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (input.type === "checkbox") {
      // Store the checked status for checkboxes and radio buttons
      formData[key] = input.checked;
    } else if (
      input.type === "text" ||
      input.type === "number" ||
      input.type === "date" ||
      input.type === "time" ||
      input.type === "datetime-local"
    ) {
      // Store the value for text, number, date, and time inputs
      formData[key] = input.value;
    } else if (input.tagName.toLowerCase() === "select") {
      // Store the selected value for select elements
      formData[key] = input.value;
    }
  });

  // Read inputs from the `main` section
  const mainInputs = document.querySelectorAll(
    "#main input:not(.dainamic), #main select"
  );

  mainInputs.forEach((input) => {
    const key = (input.dataset.properties || input.name || input.id)
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (input.type === "checkbox" || input.type === "radio") {
      // Store the checked status for checkboxes and radio buttons
      formData[key] = input.checked;
    } else if (
      input.type === "text" ||
      input.type === "number" ||
      input.type === "date" ||
      input.type === "time" ||
      input.type === "datetime-local"
    ) {
      // Store the value for text, number, date, and time inputs
      formData[key] = input.value;
    } else if (input.tagName.toLowerCase() === "select") {
      // Store the selected value for select elements
      formData[key] = input.value;
    }
  });
  let dynamicinpcont = document.querySelectorAll(".judgement-option");
  formData.dynamic = {};
  dynamicinpcont.forEach((e) => {
    let dinpconts = e.querySelectorAll("input");
    formData.dynamic[dinpconts[0].value] = {
      wikitext: dinpconts[1].value,
      mark: dinpconts[2].value,
    };
  });
  //console.log(({ data: formData, key: jsonobj.key }))
  proxyFetch("dashboard", { data: formData, key: jsonobj.key }, (data) => {
    if (data.error) {
      console.error(data.error);
    } else {
      window.location.replace("/dashboard?key=" + jsonobj.key);
    }
  });
});
//
document
  .getElementById("add-option-btn")
  .addEventListener("click", function (e) {
    e.preventDefault();
    // Create a new div for the judgement option
    const newOptionDiv = document.createElement("div");
    newOptionDiv.className = "judgement-option";
    const removebtn = document.createElement("button");
    removebtn.innerHTML = "-";
    removebtn.style.height = "40px";
    removebtn.style.fontSize = "20px";
    removebtn.className = "cancel";
    removebtn.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .getElementById("judgement-options")
        .removeChild(e.target.parentElement);
    });

    // Create input fields for type (text), wikitext (text), and mark (number)
    const typeInput = document.createElement("input");
    typeInput.type = "text";
    typeInput.className = "dynamic";
    typeInput.placeholder = "Type";

    const wikitextInput = document.createElement("input");
    wikitextInput.className = "dynamic";
    wikitextInput.type = "text";
    wikitextInput.placeholder = "Wikitext";

    const markInput = document.createElement("input");
    markInput.className = "dynamic";
    markInput.type = "number";
    markInput.placeholder = "Mark";

    // Append inputs to the new div
    newOptionDiv.appendChild(removebtn);
    newOptionDiv.appendChild(typeInput);
    newOptionDiv.appendChild(wikitextInput);
    newOptionDiv.appendChild(markInput);

    // Add the new div to the judgement options container
    document.getElementById("judgement-options").appendChild(newOptionDiv);
  });
