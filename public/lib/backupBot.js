const fs = require("fs");

//backup all files in private\backup folder
const fileDir = path.join(__dirname, "..", "..", "private", "db", "files");
const backupDir = path.join(__dirname, "..", "..", "private", "backup");
const LOG_FILE = join(__dirname, "private", "log", "backup", "bot_runs.log");
const logActivity = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `\n\n ${timestamp} - ${message}\n`);
};
fs.readdir(fileDir, (err, files) => {
  if (err) {
    console.error("❌ Error reading file folder:", err);
    return logActivity(`Error reading file folder: ${err}`);
  }

  files.forEach((file) => {
    const filePath = path.join(fileDir, file);
    const backupPath = path.join(backupDir, file);
    fs.copyFileSync(filePath, backupPath, (err) => {
      if (err) {
        console.error(`❌ Failed to copy ${file}:`, err);
      } else {
        console.log(`✅ Copied ${file} to backup folder`);
      }
    });
  });
  logActivity(`Backup completed for ${files.length} files.`);
});
