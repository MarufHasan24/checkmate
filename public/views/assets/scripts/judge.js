const saveBtn = document.querySelector("#Save");
const skipBtn = document.querySelector("#Skip");
const marks = document.querySelector("#marks");
const commentBtn = document.querySelector("#comment-button");
const lockBtn = document.querySelector("#lock-button");
const unlockBtn = document.querySelector("#unlock-button");
let state = null;
document.querySelectorAll(".container a").forEach((e) => {
  let rawlink = e.getAttribute("href");
  if (rawlink && !rawlink.includes("://")) {
    e.href = "https://" + userdata.project + ".org" + rawlink;
    e.target = "_blank";
  }
});
const stickydiv = document.querySelector(".options");
if (stickydiv) {
  if (userdata.stat) {
    state = userdata.stat;
    saveBtn.disabled = false;
    marks.innerHTML = userdata.opts[state].mark;
  }
  for (i in userdata.opts) {
    let div = document.createElement("li");
    let input = document.createElement("button");
    input.innerHTML = i;
    if (userdata.stat == i) {
      input.className = "radio active";
    } else {
      input.className = "radio";
    }
    input.dataset.mark = userdata.opts[i].mark;
    div.appendChild(input);
    input.addEventListener("click", () => {
      input.className = "radio active";
      saveBtn.disabled = false;
      skipBtn.disabled = true;
      marks.innerHTML = input.dataset.mark;
      state = input.innerHTML;
      let radios = stickydiv.querySelectorAll(".radio");
      radios.forEach((radio) => {
        if (radio !== input) {
          radio.className = "radio";
        }
      });
    });
    // remove all other active classes
    stickydiv.appendChild(div);
  }
  saveBtn.addEventListener("click", () => {
    proxyFetch(
      "judge",
      {
        jdata: { marks: marks.innerHTML, state: state },
        user: data.username,
        key: userdata.key,
        page: userdata.page,
      },
      (data) => {
        if (data) {
          if (data.result) {
            let index = userdata.pagelist.indexOf(userdata.page);
            userdata.pagelist.splice(index, 1);
            window.location.href =
              "/judge?key=" +
              userdata.key +
              "&page=" +
              userdata.pagelist[
                Math.floor(Math.random() * userdata.pagelist.length)
              ] +
              "&judge=" +
              data.username;
          } else if (data.message) {
            msg(data);
          }
        }
      }
    );
  });
  commentBtn.addEventListener("click", () => {
    csprompt(
      "feedback",
      "Send your feedback to the Submitter's talk page. Write your response bellow. It will support wikitext format.",
      (userres) => {
        if (userres && userres !== "null") {
          msg({
            message: `Your feedback is sending to <a target="_blank" href="https://${
              userdata.project
            }.org/wiki/user_talk:${encodeURIComponent(userdata.submitter)}">${
              userdata.submitter
            }'s talk page</a>`,
            redirect: null,
          });
          proxyFetch(
            "comment",
            {
              creator: userdata.creator,
              submitter: userdata.submitter,
              user: data.username,
              key: userdata.key,
              response: userres,
              project: userdata.project,
            },
            (data) => {
              msg(data);
            }
          );
        } else {
          msg({
            message: `<b>Mission aborted!</b>`,
            type: "warn",
            autoHide: 3,
            redirect: null,
          });
        }
      },
      {
        value: userdata.template
          .replace(/\$USER/g, data.username)
          .replace(/\$CREATOR/g, userdata.creator)
          .replace(/\$TITLE/g, userdata.page)
          .replace(/\$SUBMITTER/g, userdata.submitter),
        buttonTexts: ["Send", "Cancel"],
      }
    );
  });
  lockBtn?.addEventListener("click", () => {
    proxyFetch(
      "lock",
      {
        user: data.username,
        key: userdata.key,
        page: userdata.page,
        type: "lock",
      },
      (data) => {
        if (data) {
          msg(data);
        }
      }
    );
  });
  unlockBtn?.addEventListener("click", () => {
    proxyFetch(
      "lock",
      {
        user: data.username,
        key: userdata.key,
        page: userdata.page,
        type: "unlock",
      },
      (data) => {
        if (data) {
          msg(data);
        }
      }
    );
  });
}
skipBtn.addEventListener("click", () => {
  let index = userdata.pagelist.indexOf(userdata.page);
  userdata.pagelist.splice(index, 1);
  window.location.href =
    "/judge?key=" +
    userdata.key +
    "&page=" +
    userdata.pagelist[Math.floor(Math.random() * userdata.pagelist.length)] +
    "&judge=" +
    data.username;
});
