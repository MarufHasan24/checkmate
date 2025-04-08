// Import the 'crypto' module, which provides cryptographic functionality.
const crypto = require("crypto");

// Import the 'fs' module, which provides an API for interacting with the file system.
const fs = require("node:fs");
const { join } = require("node:path");
// Define the algorithm to be used for encryption and decryption.
const algorithm = "aes-256-ecb"; // AES encryption with a 256-bit key in ECB mode

// Define a template key, which is a 32-byte key used for encryption and decryption.
const templatekey = Buffer.from(
  "20eb74a29ce398e6dd4ea7b00bf1469b93c736657eed0ba16c79a8c796e97c51",
  "hex"
); // crypto.randomBytes(32); // Generate a random 32-byte key

/**
 * Creates or overwrites a file with the provided data.
 * If the file does not exist, it will be created with the primary data.
 * If the file exists, the data will be appended to the existing data.
 *
 * @param {string} filePath - The path to the file.
 * @param {string} user - The user who is creating or updating the file.
 * @param {string} data - The data to be written to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function writeFileOwn(filePath, user, callback) {
  let date = new Date().toISOString();
  // File does not exist, create it with primary data
  const primaryData = {
    createdAt: date, // Timestamp for when the file was created
    user: user, // User who created the file
    data: [], // Array to store data
    lastModified: date, // Timestamp for when the file was last modified
  };
  fs.writeFile(filePath, JSON.stringify(primaryData), (err) => {
    if (err) {
      console.error(err); // Log any errors
    } else {
      callback(); // Call the callback function if successful
    }
  });
}
/**
 * Updates an existing file with the provided data.
 *
 * @param {string} filePath - The path to the file.
 * @param {string} data - The data to be appended to the existing data.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function updateFileOwn(username, data, callback) {
  let filePath =
    __dirname +
    "/../../private/user/usr-" +
    encodeURIComponent(username) +
    ".json";
  let date = new Date().toISOString();
  fs.stat(filePath, (err, stats) => {
    if (err) {
      callback(err);
    } else {
      keepLog(
        username,
        "hosting",
        (err) => {
          if (err) {
            console.error(err);
          } else {
            fs.readFile(filePath, "utf8", (err, existingData) => {
              if (err) {
                callback(err); // Log any errors
              } else {
                const parsedData = JSON.parse(existingData); // Parse the existing data
                parsedData.lastModified = date;
                parsedData.data.push(JSON.parse(data)); // Add the provided data to the existing data
                fs.writeFile(filePath, JSON.stringify(parsedData), (err) => {
                  if (err) {
                    callback(err); // Log any errors
                  } else {
                    callback(); // Call the callback function if successful
                  }
                });
              }
            });
          }
        },
        {
          ...JSON.parse(data),
          ...stats,
        }
      );
    }
  });
}
/**
 * Updates an existing file with the provided data.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function updateFile(path, callback, newPath) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      callback(err);
    } else {
      const oldData = typeof data == "string" ? JSON.parse(data) : data;
      callback(null, oldData, (newData, recall) => {
        fs.writeFile(path, JSON.stringify(newData), (err) => {
          if (err) {
            recall(err);
          } else {
            if (newPath) {
              fs.rename(path, newPath, (err) => {
                if (err) {
                  recall(err);
                } else {
                  recall(null);
                }
              });
            } else {
              recall(null);
            }
          }
        });
      });
    }
  });
}
/**
 * Reads the contents of a file.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function readFile(path, callback) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(data));
    }
  });
}
/**
 * Reads a user's JSON file and ensures that any nested JSON string in `user` is correctly parsed.
 * If `user` is found to be a string, it is parsed again and the file is updated.
 *
 * @param {string} user - The username whose data file is to be read.
 * @param {function} callback - The callback function to return the parsed data or an error.
 */
function readUser(path, callback) {
  let filePath = path;
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return callback(err);
    } else {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
        // Check if parsedData.user is a string and needs to be parsed again
        if (typeof parsedData.user === "string") {
          console.log(parsedData.user);
          parsedData.user = JSON.parse(parsedData.user);
          fs.writeFile(
            filePath,
            JSON.stringify(parsedData),
            "utf8",
            (writeErr) => {
              if (writeErr) {
                return callback(writeErr);
              } else {
                callback(null, parsedData);
              }
            }
          );
        } else {
          callback(null, parsedData);
        }
      } catch (parseErr) {
        return callback(parseErr);
      }
    }
  });
}
/**
 * Writes data to a file.
 *
 * @param {string} path - The path to the file.
 * @param {string} data - The data to be written to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function writeFile(path, data, callback) {
  fs.writeFile(
    path,
    data,
    {
      flag: "w+",
    },
    (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}
/**
 * Deletes a file.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function deleteFile(path, callback, key, username, willBin = false) {
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      keepLog(
        username,
        "delete" + (willBin ? "" : "/permanent"),
        (err) => {
          if (err) {
            console.error(err);
          } else {
            // move the file in to .bin
            if (willBin) {
              fs.rename(
                path,
                `${__dirname}/../../private/.bin/files/${key}.json`,
                (err) => {
                  if (err) {
                    callback(err);
                  } else {
                    callback(null, "File moved to .bin");
                  }
                }
              );
            } else {
              fs.unlink(path, (err) => {
                if (err) {
                  callback(err);
                } else {
                  callback(null, "File deleted");
                }
              });
            }
          }
        },
        { ...stats, key: key || null }
      );
    }
  });
}
/**
 * Encrypts an object using a provided key.
 *
 * @param {object} object - The object to be encrypted.
 * @returns {string} The encrypted data in Hex.
 */
function uriEncript(object) {
  const cipher = crypto.createCipheriv(algorithm, templatekey, null); // ECB mode does not use IV
  let encrypted = cipher.update(JSON.stringify(object), "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted; // Encrypted data in Hex
}
/**
 * Decrypts an encrypted string using a provided key.
 *
 * @param {string} encryptedString - The encrypted string to be decrypted.
 * @returns {object} The decrypted object.
 */
function uriDecript(encryptedString) {
  const decipher = crypto.createDecipheriv(algorithm, templatekey, null); // ECB mode does not use IV
  let decrypted = decipher.update(encryptedString, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return isValidJSON(decrypted);
}
/**
 * Checks if a string is valid JSON.
 *
 * @param {string} jsonString - The string to be checked.
 * @returns {object|false} The parsed JSON object if the string is valid, false otherwise.
 */
function isValidJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString); // Try to parse the string as JSON
    // Check if the parsed value is an object or an array
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    return false; // Return false if the string is not valid JSON
  }
}
/**
 * Converts a JSON object to an HTML table.
 *
 * This function recursively iterates through the JSON object, creating table rows and cells for each key-value pair.
 * If the value is an object, it is recursively converted to a table. If the value is an array, it is converted to an unordered list.
 *
 * @param {object} json - The JSON object to be converted to an HTML table.
 * @returns {string} The HTML table representation of the JSON object.
 */
function jsonToTable(json) {
  let html = "";
  if (Array.isArray(json)) {
    json.forEach((item) => {
      html += `<tr><td>${jsonToTable(item)}</td></tr>`;
    });
  } else {
    for (const key in json) {
      if (key !== "data") html += `<tr><td><strong>${key}</strong></td><td>`;
      //html += "<td>";
      if (typeof json[key] === "object" && !Array.isArray(json[key])) {
        html += jsonToTable(json[key]);
      } else if (Array.isArray(json[key])) {
        html += "<ul>";
        let list = json[key].join("</li><li>");
        html += `<li>${list}</li>`;
      } else {
        html += json[key];
      }
      if (key !== "data") html += "</td></tr>";
    }
  }
  return html;
}
function generateTables(json) {
  let html = "";

  if (Array.isArray(json)) {
    for (let index = json.length - 1; index >= 0; index--) {
      let item = json[index];
      html += `<div class="table-container"><div><h3>Serial:${
        index + 1
      }</h3><table border="1" cellpadding="5">${jsonToTable(
        item
      )}</table></div></div>`;
    }
  } else {
    html += `<div class="table-container"><table border="1" cellpadding="5">${jsonToTable(
      json
    )}</table></div>`;
  }

  return html;
}
function createNestedTable(data) {
  let html = "<table>";
  for (const key in data) {
    html += "<tr>";
    html += `<td>${key}</td>`;
    html += "<td>";
    if (typeof data[key] === "object" && data[key] !== null) {
      html += `<div class="nested-table">${createNestedTable(data[key])}</div>`;
    } else {
      html += `${data[key]}`;
    }
    html += "</td></tr>";
  }
  html += "</table>";
  return html;
}
function buildChangesTable(changes) {
  let html = "<table>";
  html += `<tr><th>Field</th><th>Old</th><th>New</th></tr>`;
  for (const key in changes) {
    html += "<tr>";
    html += `<td>${key}</td>`;

    const oldValue = changes[key].old;
    const newValue = changes[key].value;

    if (typeof oldValue === "object" && oldValue !== null) {
      html += `<td>${createNestedTable(oldValue)}</td>`;
    } else {
      html += `<td>${oldValue}</td>`;
    }

    if (typeof newValue === "object" && newValue !== null) {
      html += `<td>${createNestedTable(newValue)}</td>`;
    } else {
      html += `<td>${newValue}</td>`;
    }

    html += "</tr>";
  }
  html += "</table>";
  return html;
}
function renderLogs(logs) {
  let html = "";
  logs.forEach((log, index) => {
    let date = new Date(log.date);
    html += '<div class="log-entry">';

    html += `<div class="log-header"><div>${log.action}</div><button class="toggle-btn" data-id="${index}">Show Changes</button></div>`;

    html +=
      `<div class="log-meta"><strong>Date:</strong> ${date.toLocaleDateString(
        "en-GB",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      )} : ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}<br><strong>user:</strong> ${log.user}<br>` +
      (log?.data?.key ? `<strong>Key:</strong> ${log.data.key}<br>` : "") +
      (log?.data?.ip ? `<strong>IP:</strong> ${log.data.ip}<br>` : "") +
      (log?.data?.host ? `<strong>Host:</strong> ${log.data.host}<br>` : "") +
      "</div>";

    html += `<div class="changes" id="change-${index}" style="display:none;">`;
    if (log.action == "dashboard") {
      html += buildChangesTable(log.data.changes);
    } else {
      html += `<div class="log-data">`;
      if (log.data) {
        html += `<strong>Data:</strong>`;
        html += `<div>${createNestedTable(log.data)}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    html += `</div>`;
  });

  return html;
}
function editathonTable(
  page_list,
  mkey,
  startindex = 0,
  translation = null,
  project = "meta.wikimedia"
) {
  let table = "";
  // Get all keys (page names) from page_list
  const pageKeys = Object.keys(page_list).filter((e) => e);
  if (pageKeys.length) {
    // Loop through each page

    pageKeys.forEach((pageKey, i) => {
      const pageData = page_list[pageKey];
      if (pageData) {
        table += `<tr>`;
        // Add page name as the first column
        table += `<td onclick='makeRowCollapsible(this.parentElement);' style='cursor: pointer;' data-label='Serial'>${
          translation?.lebel?.counts
            ? String(Number(startindex) + i + 1)
                .split("")
                .map((e) => {
                  translation.lebel.counts[e]
                    ? (e = translation.lebel.counts[e])
                    : null;
                  return e;
                })
                .join("")
            : Number(startindex) + i + 1
        }</td>`;
        table += `<td data-label='Page name'><a href='/judge?key=${mkey}&page=${encodeURIComponent(
          pageKey
        )}'>${pageKey}</a></td>`;

        // Loop through each field in the page data
        Object.keys(pageData).forEach((field) => {
          let td = "";
          if (field === "sd") {
            td = `<td data-label='Submission'>${formatDate(
              new Date(pageData[field]),
              translation?.lebel?.counts
            )}</td>`;
          } else if (field === "cd") {
            td = `<td data-label='Creation'>${formatDate(
              new Date(pageData[field]),
              translation?.lebel?.counts
            )}</td>`;
          } else if (field == "sub") {
            td = `<td data-label='User'><a target="_blank" href='https://${project}.org/wiki/User_talk:${encodeURIComponent(
              pageData[field]
            )}'>${pageData[field]}</a></td>`;
          } else if (field == "rev") {
            td = `<td data-label='Reviewer'><a target="_blank" href='https://${project}.org/wiki/User_talk:${encodeURIComponent(
              pageData[field]
            )}'>${pageData[field]}</a></td>`;
          } else if (field == "stat") {
            td = `<td data-label='Status'>${pageData[field]}</td>`;
          } else if (field == "ec") {
            td = `<td data-label='Edit Count'>${
              translation?.lebel?.counts
                ? String(pageData[field])
                    .split("")
                    .map((e) => {
                      translation.lebel.counts[e]
                        ? (e = translation.lebel.counts[e])
                        : null;
                      return e;
                    })
                    .join("")
                : pageData[field]
            }</td>`;
          } else if (field == "wc") {
            td = `<td data-label='Word Count'>${
              translation?.lebel?.counts
                ? String(pageData[field])
                    .split("")
                    .map((e) => {
                      translation.lebel.counts[e]
                        ? (e = translation.lebel.counts[e])
                        : null;
                      return e;
                    })
                    .join("")
                : pageData[field]
            }</td>`;
          } else if (field == "length") {
            td = `<td data-label='Byte'>${
              translation?.lebel?.counts
                ? String(pageData[field])
                    .split("")
                    .map((e) => {
                      translation.lebel.counts[e]
                        ? (e = translation.lebel.counts[e])
                        : null;
                      return e;
                    })
                    .join("")
                : pageData[field]
            }</td>`;
          } else {
            /* td = `<td data-label=''>${pageData[field]}</td>`; */
          }
          table += td;
        });
      }
      table += "</tr>";
    });
  }

  return table;
}
function keepLog(username, action, callback, rdata) {
  let sdata = {};
  if (rdata) {
    rdata.atime ? (sdata["last access"] = rdata.atime) : null;
    if (rdata.atime && rdata.mtime && rdata.atime !== rdata.mtime)
      rdata.mtime ? (sdata["last modification"] = rdata.mtime) : null;
    rdata.ctime ? (sdata["creation time"] = rdata.ctime) : null;
    rdata.size ? (sdata.size = rdata.size) : null;
    rdata.ip ? (sdata.ip = rdata.ip) : null;
    rdata.key ? (sdata.key = rdata.key) : null;
    rdata.pass ? (sdata.pass = rdata.pass) : null;
  }
  if (username) {
    const date = new Date();
    const filePath = `${__dirname}/../../private/log/log-${date.getFullYear()}-${
      date.getMonth() + 1
    }.json`;
    fs.stat(filePath, (err, stats) => {
      if (err) {
        // File does not exist, create it with primary data
        writeFile(
          filePath,
          JSON.stringify([
            {
              user: username,
              action: action,
              data: sdata,
              date: date.toString(),
            },
          ]),
          (err) => {
            if (err) {
              callback(err); // Log any errors
            } else {
              callback(null);
            }
          }
        );
      } else {
        // File exists, update the existing data
        updateFile(filePath, (err, data, ucallback) => {
          if (err) {
            callback(err);
          } else {
            data.push({
              user: username,
              date: date.toString(),
              data: sdata,
              action: action,
            });
            ucallback(data, (err) => {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  } else {
    callback(null);
  }
}
function keepKeyLog(key, username, action, callback, rdata = null) {
  if (username) {
    const date = new Date();
    const filePath = `${__dirname}/../../private/db/log/${key}.json`;
    console.log(filePath);
    fs.stat(filePath, (err, stats) => {
      if (err) {
        // File does not exist, create it with primary data
        writeFile(
          filePath,
          JSON.stringify([
            {
              user: username,
              action: action,
              date: date.toString(),
              data: rdata || null,
            },
          ]),
          (err) => {
            if (err) {
              callback(err); // Log any errors
            } else {
              callback(null);
            }
          }
        );
      } else {
        // File exists, update the existing data
        updateFile(filePath, (err, data, ucallback) => {
          if (err) {
            callback(err);
          } else {
            data.push({
              user: username,
              date: date.toString(),
              data: rdata || null,
              action: action,
            });
            ucallback(data, (err) => {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  } else {
    callback(null);
  }
}
function formatDate(date, translationObj) {
  const day = translationObj
    ? String(date.getDate())
        .padStart(2, "0")
        .split("")
        .map((e) => {
          translationObj[e] ? (e = translationObj[e]) : null;
          return e;
        })
        .join("")
    : String(date.getDate()).padStart(2, "0");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = translationObj
    ? translationObj[months[date.getMonth()]]
    : months[date.getMonth()];

  const year = translationObj
    ? String(date.getFullYear())
        .split("")
        .map((e) => {
          translationObj[e] ? (e = translationObj[e]) : null;
          return e;
        })
        .join("")
    : String(date.getFullYear());
  const hours = translationObj
    ? String(date.getHours())
        .padStart(2, "0")
        .split("")
        .map((e) => {
          translationObj[e] ? (e = translationObj[e]) : null;
          return e;
        })
        .join("")
    : String(date.getHours()).padStart(2, "0");
  const minutes = translationObj
    ? String(date.getMinutes())
        .padStart(2, "0")
        .split("")
        .map((e) => {
          translationObj[e] ? (e = translationObj[e]) : null;
          return e;
        })
        .join("")
    : String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} | ${hours}:${minutes}`;
}
function readDirectoryThenFiles(directory, callback, readall = true) {
  // Step 1: Read the directory
  fs.readdir(directory, (err, files) => {
    if (err) {
      callback([err], null, null);
    } else {
      if (readall) {
        let mdata = [];
        let merr = [];
        let index = 0;

        // Step 2: Process files one by one
        function processFile(index) {
          if (index >= files.length) {
            // If all files are processed, return the result
            if (merr.length) {
              callback(merr, null, files);
            } else {
              callback(null, mdata, files);
            }
          } else {
            const file = files[index];
            const filePath = join(directory, file);

            // Step 3: Get file stats to check if it's a file
            fs.stat(filePath, (err, stats) => {
              if (err) {
                merr.push([`Error getting stats of file: ${file}`, err]);
                processFile(index + 1); // Move to the next file
              } else if (stats.isFile()) {
                // Step 4: If it's a file, read its content
                fs.readFile(filePath, "utf8", (err, data) => {
                  if (err) {
                    merr.push([`Error reading file: ${file}`, err]);
                  } else {
                    mdata.push(JSON.parse(data)); // Store file content
                  }
                  processFile(index + 1); // Move to the next file
                });
              } else {
                // If not a file, move to the next
                processFile(index + 1);
              }
            });
          }
        }
        // Start processing the first file
        processFile(index);
      } else {
        // If readall is false, just return the file names
        callback(null, null, files);
      }
    }
  });
}
module.exports = {
  writeFileOwn,
  updateFileOwn,
  updateFile,
  uriEncript,
  uriDecript,
  readFile,
  writeFile,
  deleteFile,
  keepLog,
  logTable: generateTables,
  logTableKey: renderLogs,
  editathonTable,
  readDirOwn: readDirectoryThenFiles,
  readUser,
  stat: fs.stat,
  join,
  keepKeyLog,
};
