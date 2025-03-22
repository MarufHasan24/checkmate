let tableJ = document.querySelector(".jurries .table");
let tableP = document.querySelector(".particepents .table");
let PFull = document.querySelector(".particepents.full");
//let tablePFull = document.querySelectorAll(".particepents.full .table");
let headers = ["Siral", "Name", "Page Count", "Result"];
function checkForWC(data) {
  // Flag to detect wc
  let hasWC = false;
  // Iterate over the users
  Object.keys(data).forEach(function (user) {
    // Iterate over each article for the user
    return Object.keys(data[user]).forEach(function (article) {
      // Check if wc exists in any article
      if (data[user][article].wc) {
        hasWC = true;
        return;
      }
    });
  });
  return hasWC;
}
// Run the check when the page loads
window.addEventListener("DOMContentLoaded", function () {
  // The data object passed from the server
  //console.log(userdata);
  let participentdata = reorganizeData(jurriesList);
  let isTrue = checkForWC(jurriesList);
  if (isTrue) {
    headers.push("Total Word Count");
    headers.push("Largest Articale");
    headers.push("Average Word Count");
  }
  const headerRowJ = document.querySelector(".jurries .thead");
  const headerRowP = document.querySelector(".particepents .thead");
  headers.forEach((header, i) => {
    if (header !== "Result") {
      const th = document.createElement("th");
      th.setAttribute("onclick", `sortTable(${i},"s",0)`);
      th.innerHTML = `<div class="sort-icon"><span>${header}</span><img src="/assets/imgs/sort down.svg" alt="">
</div>`;
      headerRowJ.appendChild(th);
    }
    const th2 = document.createElement("th");
    th2.setAttribute("onclick", `sortTable(${i},"s",1)`);
    th2.innerHTML = `<div class="sort-icon"><span>${header}</span><img src="/assets/imgs/sort down.svg" alt="">
</div>`;
    headerRowP.appendChild(th2);
  });
  tableJ.innerHTML += preapareTable(jurriesList, isTrue);
  tableP.innerHTML += preapareTable(participentdata, isTrue, true);
  let index = 2;
  for (i in participentdata) {
    PFull.innerHTML += preapareTable2(participentdata[i], isTrue, index++, i);
  }

  const submit = document.querySelector("#submit");
  submit.addEventListener("click", () => {
    let inputdata = readAllInputs();
    proxyFetch(
      "result",
      {
        ...inputdata,
        key,
        user: username,
        resultPage: document.getElementById("resultPage").value,
        /* jlist: userdata.jlist, */
      },
      (message) => {
        //console.log(message.message);
      }
    );
  });
});
function preapareTable(data, isTrue, isParticipent) {
  let html = ``;
  Object.keys(data).forEach((user, index) => {
    html += `
<tr><td data-label='Serial'>${
      index + 1
    }</td><td data-label='Name'><a href='https://${project}.org/wiki/user:${encodeURIComponent(
      user
    )}'>${user}</a></td><td data-label='Total page count'>${
      Object.keys(data[user]).length
    }</td>`;
    if (isParticipent) {
      html += `<td data-label='Result'>${getResult(data[user])}</td>`;
    }
    if (isTrue) {
      let wordinfo = calculateWordCount(data[user]);
      html += `<td data-label='Total Word Count'>${wordinfo.totalWordCount}</td><td data-label='Leargest Article'><b>${wordinfo.highestWordCountArticle}</b>&nbsp;<small>(${wordinfo.highestWordCount})</small></td><td data-label='Average Word Count'>${wordinfo.averageWordCount}</td>`;
    }
    html += "</tr>";
  });
  return html;
}
function calculateWordCount(userData) {
  let totalWordCount = 0;
  let highestWordCount = 0;
  let highestWordCountArticle = "";
  let count = 0;

  // Iterate over each entry in the user's data
  for (const article in userData) {
    const wc = userData[article].wc;

    if (wc) {
      totalWordCount += wc; // Add to total
      if (wc > highestWordCount) {
        highestWordCount = wc; // Find the highest
        highestWordCountArticle = article; // Store the article name
      }
      count++; // Track number of entries
    }
  }

  const averageWordCount = count > 0 ? (totalWordCount / count).toFixed(2) : 0;

  return {
    totalWordCount,
    highestWordCount,
    highestWordCountArticle,
    averageWordCount: parseFloat(averageWordCount),
  };
}
function reorganizeData(data) {
  const result = {};

  // Iterate over each user
  for (const rev in data) {
    const userData = data[rev];

    // Process each article under the user
    for (const article in userData) {
      const articleData = userData[article];
      const { sub } = articleData; // Get the 'sub' (submitter)

      // Initialize the reviewer and submitter if not already present
      if (!result[sub]) {
        result[sub] = {}; // Create a new object for submitter
      }

      // Add the article data under the submitter and reviewer
      result[sub][article] = articleData;
    }
  }

  return result;
}
function preapareTable2(data, isTrue, index, user) {
  let html = `<h4>Details Of <a style="color:#5fb6a4" href='https://${project}.org/wiki/user:${encodeURIComponent(
    user
  )}'>${user}</a></h4><table><thead>`;
  let headers = ["Siral", "Page name", "Submittion date", "Judge", "State"];
  if (isTrue) headers.push("Word Count");
  //console.log(index);
  headers.forEach((header, i) => {
    const th = `<th onclick='sortTable(${i},"s",${index})'><div class="sort-icon"><span>${header}</span><img src="/assets/imgs/sort down.svg" alt="">
</div></th>`;
    html += th;
  });
  html += "</thead><tbody class='table'>";
  Object.keys(data).forEach((elem, index) => {
    html += `<tr><td data-label='Siral'>${
      index + 1
    }</td><td data-label='Page name'><a target="_blank"
                            href="https://${project}.org/wiki/${encodeURIComponent(
      elem
    )}">${elem}</a></td><td data-label='Submittion date'>${new Date(
      data[elem].sd
    ).toLocaleString()}</td><td data-label='Judge'>${
      data[elem].rev
    }</td><td data-label='State'>${data[elem].stat}</td>`;
    if (isTrue)
      html += `<td data-label='Word Count'>${data[elem].wc}</td></tr>`;
  });
  //letter part
  html += `<tr class="letter"><td colspan=1 class='willhide'>Result :</td><td data-label='Result'>${getResult(
    data
  )}</td><td colspan=${
    isTrue ? 1 : 3
  } class='willhide'>Total page count :</td><td data-label='Total page count'>${
    Object.keys(data).length
  }</td>`;
  if (isTrue) {
    let wordinfo = calculateWordCount(data);
    html += `<td colspan=1 class='willhide'>Total Word Count:</td><td data-label='Total Word Count'>${wordinfo.totalWordCount}</td></tr></tbody></table>`;
  }
  return html;
}
function readAllInputs() {
  let data = {};
  const checkedFieldsData = {};
  const publishInfo = document.querySelectorAll("input.publishJuries");
  const resultPage = document.querySelectorAll("#resultPage");
  const fieldset = document.querySelector("fieldset");
  const divs = fieldset.querySelectorAll("div");

  divs.forEach((div) => {
    const checkbox = div.querySelector('input[type="checkbox"]');
    if (checkbox.checked) {
      // Only process if the checkbox is checked
      const labelText = div.querySelector(
        'label[for="' + checkbox.id + '"]'
      ).innerText;
      const inputText = div.querySelector('input[type="text"]').value;
      checkedFieldsData[labelText.toLowerCase()] = {
        id: checkbox.id,
        label: labelText,
        translation: inputText,
      };
    }
  });

  publishInfo.forEach((input) => {
    data[input.id] = input.checked;
  });
  data.resultPage = resultPage.value;
  data.checkData = checkedFieldsData;
  return data;
}
function getResult(data) {
  let mark = 0;
  for (i in data) {
    mark += Number(userdata.dynamic[data[i].stat]?.mark ?? 0);
  }
  return mark;
}
