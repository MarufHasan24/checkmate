const submit = document.getElementById("submit");
const controls = document.getElementById("controls");
const controls2 = document.getElementById("controls2");
const controls3 = document.getElementById("controls3");
const mothertable = document.getElementById("table-container-detaile");
let rheaders = {
  serial: "Serial",
  name: "Name",
  ts: "Total submisson",
  tr: "Total reviewed",
  tm: "Total Marks",
  wc: "Word Count",
  length: "Byte Count",
  stat: "Status",
};
let participants = {};
let currentSortField = null;
let sortAscending = true;

Object.entries(userdata.participent).forEach(([key, object]) => {
  if (!participants[key])
    participants[key] = {
      total: 0,
      reviewed: 0,
      marks: 0,
      length: 0,
      wc: 0,
    };
  participants[key].total = Object.keys(object).length;
  Object.values(object).forEach((obj) => {
    let mark = Number(userdata.dynamic[obj.stat]?.mark) || 0;
    participants[key].marks += mark;
    participants[key].reviewed += obj?.stat?.length > 0 ? 1 : 0;
    participants[key].length += mark > 0 ? obj?.length : 0;
    participants[key].wc += mark > 0 ? obj?.wc : 0;
  });
});

function sortTableAdv(index) {
  let selectedFields = Array.from(
    controls.querySelectorAll(".table-option:checked")
  ).map((cb) => cb.value);
  let field = selectedFields[index];
  let sortedEntries = Object.entries(participants).sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (field === "name") {
      valA = a[0];
      valB = b[0];
    } else {
      if (field === "ts") {
        valA = a[1].total || 0;
        valB = b[1].total || 0;
      } else if (field === "tr") {
        valA = a[1].reviewed || 0;
        valB = b[1].reviewed || 0;
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
                }>${rheaders[field]}</th>`
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
          if (field === "ts") return `<td>${data.total || 0}</td>`;
          if (field === "tr") return `<td>${data.reviewed || 0}</td>`;
          if (field === "tm") return `<td>${data.marks || 0}</td>`;
          if (field === "wc")
            return `<td>${(data?.wc || 0).toLocaleString()}</td>`;
          if (field === "length")
            return `<td>${(data?.length || 0).toLocaleString()}</td>`;
        })
        .join("")}
  </tr>`;
    index++;
  });

  tableHTML += `</tbody></table>`;
  container.innerHTML = tableHTML;
}
controls.querySelectorAll(".table-option").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    let selectedFields = Array.from(
      controls.querySelectorAll(".table-option:checked")
    ).map((cb) => cb.value);
    renderTable(selectedFields);
  });
});
let initialFields = ["serial", "name", "tr", "tm"];
renderTable(initialFields);

let jresult = {};
Object.entries(userdata.jlist).forEach(([key, object]) => {
  if (!jresult[key]) jresult[key] = { reviewed: 0, wc: 0, length: 0, marks: 0 };
  jresult[key].reviewed = Object.keys(object).length;
  jresult[key].wc = Object.values(object).reduce(
    (acc, obj) => acc + (obj.wc || 0),
    0
  );
  jresult[key].length = Object.values(object).reduce(
    (acc, obj) => acc + (obj.length || 0),
    0
  );
  Object.values(object).forEach((obj) => {
    jresult[key].marks += Number(userdata.dynamic[obj.stat]?.mark) || 0;
  });
});
function renderJurryTable(
  selectedFields,
  container,
  jresult,
  pretext = "",
  posttxt = ""
) {
  container.innerHTML = "";
  let tableHTML =
    pretext +
    `<table>
  <thead>
      <tr>
          ${selectedFields
            .map((field) => `<th>${rheaders[field]}</th>`)
            .join("")}
      </tr>
  </thead>
  <tbody>`;
  let index = 1;
  let bytes = 0;
  let words = 0;
  Object.entries(jresult).forEach(([name, data], i) => {
    let bgColor = "";
    tableHTML += `<tr style="${bgColor}">
      ${selectedFields
        .map((field) => {
          bytes += data?.length || 0;
          words += data?.wc || 0;
          if (field === "serial") return `<td>${index}</td>`;
          if (field === "name") return `<td>${name}</td>`;
          if (field === "stat")
            return `<td><code>${
              userdata.dynamic[data.stat]?.wikitext ||
              userdata.dynamic[data.stat]?.name
            }</code></td>`;
          if (field === "tm") {
            if (data.marks == data.reviewed && data.marks > 0) {
              return `<td style="background-color: #FFA500aa;">${
                data.marks || 0
              }</td>`;
            }
            return `<td>${data.marks || 0}</td>`;
          }
          if (field === "tr") return `<td>${data.reviewed || 0}</td>`;
          if (field === "wc")
            return `<td>${(data?.wc || 0).toLocaleString()}</td>`;
          if (field === "length")
            return `<td>${(data?.length || 0).toLocaleString()}</td>`;
        })
        .join("")}
  </tr>`;
    index++;
  });
  tableHTML += `${posttxt
    .replace(/\$TB/g, bytes?.toLocaleString())
    .replace(/\$TW/g, words?.toLocaleString())}</tbody></table>`;
  container.innerHTML = tableHTML;
}
controls2.querySelectorAll(".table-option").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    let selectedFields = Array.from(
      controls2.querySelectorAll(".table-option:checked")
    ).map((cb) => cb.value);
    renderJurryTable(
      selectedFields,
      document.getElementById("table-container-jurry"),
      jresult
    );
  });
});
renderJurryTable(
  ["serial", "name", "tr", "tm"],
  document.getElementById("table-container-jurry"),
  jresult
);

function momtable(data = ["serial", "name", "stat"], posttxt = "") {
  Object.entries(userdata.participent).forEach(([key, object]) => {
    let table = document.createElement("div");
    table.className = "table-container";
    table.id = key;
    mothertable.appendChild(table);
    renderJurryTable(data, table, object, `<h3>${key}</h3>`, posttxt);
  });
}

controls3.querySelectorAll(".table-option").forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    let selectedFields = Array.from(
      controls3.querySelectorAll(".table-option:checked")
    ).map((cb) => cb.value);
    mothertable.innerHTML = "";
    let extrastring = "";
    if (selectedFields.includes("wc")) {
      extrastring += `<tr><td colspan="${
        selectedFields.length - 1
      }" style="text-align:right;">Total Words : </td><td>$TW</td></tr>`;
    }
    if (selectedFields.includes("length")) {
      extrastring += `<tr><td colspan="${
        selectedFields.length - 1
      }" style="text-align:right;">Total Bytes : </td><td>$TB</td></tr>`;
    }
    momtable(selectedFields, extrastring);
  });
});
momtable(["serial", "name", "stat"]);
window.addEventListener("DOMContentLoaded", function () {
  submit.addEventListener("click", () => {
    let tables = document.querySelectorAll(".table-container");
    let sdata = {
      main: {
        result: document.getElementById("resultPage").value,
        data: tables[0].innerHTML,
      },
    };
    document.querySelectorAll(".check-option:checked").forEach((checkbox) => {
      let key = checkbox.value;
      if (key === "jurries") {
        sdata.judge = {
          result: document.getElementById("resultPage2").value,
          data: tables[1].innerHTML,
        };
      } else if (key === "detailes") {
        sdata.participent = {
          result: document.getElementById("resultPage3").value,
          data: mothertable.innerHTML,
        };
      }
    });
    proxyFetch(
      "result",
      {
        key: key,
        data: {
          table: sdata,
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
