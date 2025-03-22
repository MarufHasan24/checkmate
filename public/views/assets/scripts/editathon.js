// Call the function to add headers when the page loads
let headers = ["Serial", "Page name"];
window.addEventListener("DOMContentLoaded", () => {
  if (userdata.upload_date) headers.push("Submission date");
  if (userdata.user_names) headers.push("participent");
  if (userdata.reviewers_name) headers.push("Reviewers");
  headers.push("State");
  if (userdata.creation_date) headers.push("Creation Date");
  if (userdata.user_edit_count) headers.push("Perticipent's Edit Count");
  if (userdata.word_count) headers.push("Pages word count");
  if (userdata.byte_limit) headers.push("Size");
  const headerRow = document.getElementById("headerRow");
  headers.forEach((header, i) => {
    const th = document.createElement("th");
    let type =
      header == "Serial" ||
      header == "Pages word count" ||
      header == "Perticipent's Edit Count" ||
      header == "Size"
        ? "d"
        : "s";
    th.setAttribute("onclick", `sortTable(${i},"${type}")`);
    th.innerHTML = `<div class="sort-icon"><span>${translate(
      header
    )}</span><img src="/assets/imgs/sort down.svg" alt="">
</div>`;
    headerRow.appendChild(th);
  });
  setTimeout(() => {
    if (headers.includes(userdata.default_sort)) {
      sortTable(headers.indexOf(userdata.default_sort));
    }
  }, 200);
  if (window.innerWidth < 800) {
    document.querySelectorAll("tr[data-label]").forEach(makeRowCollapsible);
  }
});

const table = document.getElementById("table");

const prevBtn = document.getElementById("prevPageBtn");
const nextBtn = document.getElementById("nextPageBtn");
const pageNumbersContainer = document.getElementById("pageNumbers");
/* const //loadMoreBtn = document.getElementById("//loadMoreBtn"); */

let currentPage = 1;
let totalPages = 1;
let startindex = 0;

function renderPagination() {
  pageNumbersContainer.innerHTML = "";
  let pages = getPagesToDisplay(currentPage, totalPages);

  pages.forEach((page) => {
    const span = document.createElement("span");
    span.textContent = page;
    span.classList.add("page-number");
    if (page === currentPage) {
      span.classList.add("active");
    }
    span.addEventListener("click", function () {
      if (page === "...") {
        let input = prompt("Enter page number:");
        let inputPage = parseInt(input);

        if (isNaN(inputPage) || inputPage < 1 || inputPage > totalPages) {
          alert(
            `Invalid page number! Enter a number between 1 and ${totalPages}.`
          );
          if (isNaN(inputPage) || inputPage < 1) {
            currentPage = 1;
            fetchAndRenderTable();
          } else if (inputPage > totalPages) {
            currentPage = totalPages;
            fetchAndRenderTable();
          }
        }

        currentPage = inputPage;
        fetchAndRenderTable();
      } else {
        currentPage = page;
        fetchAndRenderTable();
      }
    });

    pageNumbersContainer.appendChild(span);
  });

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

function getPagesToDisplay(current, total) {
  const pages = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, "...", total);
    } else if (current >= total - 2) {
      pages.push(1, "...", total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
  }
  return pages;
}

function fetchAndRenderTable() {
  loadTable(currentPage, startindex, function (data) {
    table.innerHTML = data.html;
    startindex = data.startindex;
    totalPages = data.totalPage;
    currentPage = data.currentPage;
    renderPagination();
  });
}

prevBtn.addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    fetchAndRenderTable();
  }
});

nextBtn.addEventListener("click", function () {
  if (currentPage < totalPages) {
    currentPage++;
    fetchAndRenderTable();
  }
});

fetchAndRenderTable();

// Integrate loadTable callback into pagination
/* loadTable(currentPage, startindex, (data) => {
  table.innerHTML = data.html;
}); */
// End of integration

function makeRowCollapsible(row) {
  row.classList.toggle("collapsed");
}
