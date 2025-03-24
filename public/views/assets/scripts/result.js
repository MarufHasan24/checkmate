const submit = document.getElementById("submit");
let rheaders = {
  serial: "Serial",
  name: "Name",
  tr: "Reviewed",
  tm: "Total Marks",
  wc: "Word Count",
  length: "Byte Count",
};
let participants = userdata.participent;
let currentSortField = null;
let sortAscending = true;

function sortTableAdv(index) {
  let selectedFields = Array.from(
    document.querySelectorAll(".table-option:checked")
  ).map((cb) => cb.value);

  let field = selectedFields[index];
  if (currentSortField === field) {
    sortAscending = !sortAscending;
  } else {
    currentSortField = field;
    sortAscending = true;
  }

  let sortedEntries = Object.entries(participants).sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (field === "name") {
      valA = a[0];
      valB = b[0];
    } else {
      if (field === "tr") {
        valA = a[1].total || 0;
        valB = b[1].total || 0;
      } else if (field === "tm") {
        valA = a[1].marks || 0;
        valB = b[1].marks || 0;
      } else if (field === "wc") {
        valA = a[1].wc || 0;
        valB = b[1].wc || 0;
      } else if (field === "length") {
        valA = a[1].length || 0;
        valB = b[1].length || 0;
      }
    }
    if (typeof valA === "string") valA = Number(valA) || valA.toLowerCase();
    if (typeof valB === "string") valB = Number(valB) || valB.toLowerCase();
    return valA < valB ? 1 : -1;
  });

  participants = Object.fromEntries(sortedEntries);
  renderTable(selectedFields);
}

function renderTable(selectedFields) {
  const container = document.getElementById("table-container");
  container.innerHTML = "";

  let tableHTML = `<table>
  <thead>
      <tr>
          ${selectedFields
            .map(
              (field, i) =>
                `<th ${
                  field !== "serial"
                    ? "class='sortable' onclick='sortTableAdv(" + i + ")'"
                    : ""
                }>${rheaders[field]} ${
                  currentSortField === field ? (sortAscending ? "" : "") : ""
                }</th>`
            )
            .join("")}
      </tr>
  </thead>
  <tbody>`;

  let index = 1;
  Object.entries(participants).forEach(([name, data], i) => {
    let bgColor = "";
    if (i === 0)
      bgColor = "background-color: #c3a81c; color: white; font-weight: bold;";
    else if (i === 1)
      bgColor = "background-color: #a3a3a3; color: white; font-weight: bold;";
    else if (i === 2)
      bgColor = "background-color: #CD7F32; color: white; font-weight: bold;";

    tableHTML += `<tr style="${bgColor}">
      ${selectedFields
        .map((field) => {
          if (field === "serial") return `<td>${index}</td>`;
          if (field === "name") return `<td>${name}</td>`;
          if (field === "tr") return `<td>${data.total || 0}</td>`;
          if (field === "tm") return `<td>${data.marks || 0}</td>`;
          if (field === "wc") return `<td>${data.wc || 0}</td>`;
          if (field === "length") return `<td>${data.length || 0}</td>`;
        })
        .join("")}
  </tr>`;
    index++;
  });

  tableHTML += `</tbody></table>`;
  container.innerHTML = tableHTML;
}

document.querySelectorAll(".table-option").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    let selectedFields = Array.from(
      document.querySelectorAll(".table-option:checked")
    ).map((cb) => cb.value);
    renderTable(selectedFields);
  });
});

let initialFields = ["serial", "name", "tr", "tm"];
renderTable(initialFields);

window.addEventListener("DOMContentLoaded", function () {
  submit.addEventListener("click", () => {
    proxyFetch(
      "result",
      {
        key: key,
        data: {
          table: document.getElementById("table-container").innerHTML,
          result: document.getElementById("resultPage").value,
          project: userdata.project,
        },
        user: userdata.user,
      },
      (message) => {
        console.log(message);
        msg(message);
      }
    );
  });
});
