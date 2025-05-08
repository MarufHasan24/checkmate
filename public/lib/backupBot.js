const fs = require("fs");
const { join } = require("path");

//backup all files in private\backup folder
const fileDir = join(__dirname, "..", "..", "private", "db", "files");
const backupDir = join(__dirname, "..", "..", "private", "backup");
const LOG_FILE = join(
  __dirname,
  "..",
  "..",
  "private",
  "log",
  "backup",
  "bot_runs.log"
);
const logActivity = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `${timestamp} - ${message}\n`);
};
let errCount = 0;
fs.readdir(fileDir, (err, files) => {
  if (err) {
    console.error("❌ Error reading file folder:", err);
    return logActivity(`Error reading file folder: ${err}`);
  }

  if (files.length === 0) {
    console.log("🛑 No files to backup.");
    return logActivity("No files to backup.");
  } else {
    console.log(`🛑 ${files.length} files to backup.`);
    files.forEach((file) => {
      const filePath = join(fileDir, file);
      const backupPath = join(backupDir, file);
      //delete the old backup file if it exists
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      fs.copyFile(filePath, backupPath, (err) => {
        if (err) {
          errCount++;
          console.error(`❌ Failed to backup ${file}:`, err);
          logActivity(`Failed to backup ${file}: ${err}`);
        } else {
          console.log(`✅ Backed up ${file} to ${backupDir}`);
        }
      });
    });
  }
  logActivity(
    `Backup completed for ${
      files.length - errCount
    } files with ${errCount} errors.`
  );
});
