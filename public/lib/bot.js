const fs = require("fs");
const path = require("path");
const { editPage } = require("./mwiki.js");

const TASK_DIR = path.join(__dirname, "..", "..", "private", "db", "tasks");

function readNextTask() {
  fs.readdir(TASK_DIR, (err, files) => {
    if (err) return console.error("❌ Error reading task folder:", err);

    const tasks = files.filter((f) => f.endsWith(".json"));
    if (tasks.length === 0)
      return console.log("🛑 No tasks left. Worker exiting.");

    const file = tasks[0];
    const filePath = path.join(TASK_DIR, file);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) return readNextTask();

      let task;
      try {
        task = JSON.parse(data);
      } catch {
        fs.unlink(filePath, () => readNextTask());
        return;
      }

      Task(task, (err) => {
        fs.unlink(filePath, () => readNextTask());
      });
    });
  });
}

function Task(data, callback) {
  let i = 0;
  const error = [];

  function attemptEdit(title, retryCount, cb) {
    editPage(
      data.oauth,
      data.project,
      { title, text: data.text, place: data.place },
      (err) => {
        if (err && retryCount < 2) {
          console.warn(`Retrying ${title}...`);
          return setTimeout(
            () => attemptEdit(title, retryCount + 1, cb),
            15000
          );
        }
        cb(err);
      }
    );
  }

  function loop() {
    if (i >= data.titles.length) return callback(error.length ? error : null);

    const title = data.titles[i++];
    attemptEdit(title, 0, (err) => {
      if (err) error.push(title);
      setTimeout(loop, 10000);
    });
  }

  loop();
}

readNextTask();
