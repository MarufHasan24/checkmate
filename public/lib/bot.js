const fs = require("fs");
const path = require("path");
const { editPage } = require("./mwiki.js"); // Assuming editPage is a function that edits a page

const TASK_DIR = path.join(__dirname, "..", "..", "private", "db", "tasks");

function readNextTask() {
  fs.readdir(TASK_DIR, (err, files) => {
    if (err) {
      console.error("❌ Error reading task folder:", err);
      return;
    }

    const tasks = files.filter((file) => file.endsWith(".json"));
    if (tasks.length === 0) {
      console.log("🛑 No tasks left. Worker exiting.");
      return;
    }

    const fileName = tasks[0];
    const filePath = path.join(TASK_DIR, fileName);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`❌ Failed to read task "${fileName}":`, err);
        return readNextTask(); // continue with next
      }

      let task;
      try {
        task = JSON.parse(data);
      } catch (parseErr) {
        console.error(`❌ Invalid JSON in "${fileName}":`, parseErr);
        // Optionally delete invalid task to unblock queue
        return fs.unlink(filePath, () => readNextTask());
      }
      Task(task, (err, result) => {
        if (err) {
          console.error(`❌ Task failed:`, err);
          // Optionally log error to a file or database
        } else {
          console.log(`✅ Task completed:`, result);
          fs.unlink(filePath, (err) => {
            if (err) console.error(`❌ Failed to delete ${fileName}:`, err);
            readNextTask(); // process next
          });
        }
      });
    });
  });
}

// Start the worker
readNextTask();

function Task(data, callback) {
  let state = {};
  let error = [];
  function iloop(i) {
    if (i >= data.titles.length) {
      // All done
      const result =
        error.length > 0
          ? {
              result: "error",
              time: Date.now(),
              cause: JSON.stringify(error, null, 2),
            }
          : { result: "success", time: Date.now(), cause: null };
      return callback(error.length > 0 ? error : null, result);
    }

    const title = data.titles[i];
    attemptEdit(title, 0, (err, editResult) => {
      state[title] = {
        result: err ? "error" : "success",
        time: Date.now(),
        cause: err ? JSON.stringify(err, null, 2) : null,
      };
      if (err) error.push(title);

      setTimeout(() => {
        iloop(i + 1); // Wait 10s after any attempt
      }, 10000);
    });
  }
  function attemptEdit(title, retryCount, done) {
    editPage(
      data.oauth,
      data.project,
      {
        title: title,
        text: data.text,
        place: data.place,
      },
      (err, result) => {
        if (err && retryCount < 2) {
          console.warn(`⚠️ Error editing "${title}". Retrying in 15s...`);
          return setTimeout(() => {
            attemptEdit(title, retryCount + 1, done);
          }, 15000);
        }
        done(err, result);
      }
    );
  }
  iloop(0);
}
