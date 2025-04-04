/*
Title: mwiki.js
Author: Maruf Hasan
Description: Libray for internal operations for mediawiki
Date: 03 September, 2024
*/
const request = require("request"); // Import the request module
//prototype
String.prototype.splitRegex = function (regex) {
  let token = `<split token=${Math.floor(Math.random() * 99)}/>`;
  return this.replace(regex, token).split(token);
};
//main functions to export
const getWikitext = function (title, project, callback) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  let params = {
    action: "parse",
    format: "json",
    page: title,
    prop: "text",
    formatversion: "2",
  };

  request.get(
    { url: apiUrl, json: true, qs: params },
    function (error, res, json) {
      if (error) {
        return callback(error, null); // Ensure early return on error
      }
      if (json.error) {
        return callback(json.error, null);
      } else {
        // If everything is fine, send the data once
        creatorLookOut(title, apiUrl, (err, cdata) => {
          if (err) {
            return callback(error, null); // Ensure early return on error
          } else {
            callback(null, {
              ...json.parse,
              ...cdata,
            });
          }
        });
      }
    }
  );
};
const editPage = function (oauth, project, data, callback) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  if (!data.title) {
    return callback(null, {
      message: "Missing title",
      type: "error",
    });
  } else {
    getCsrfToken(oauth, apiUrl, (token) => {
      edit(
        data.title,
        oauth,
        data.text,
        token,
        apiUrl,
        (err, data) => {
          if (err) {
            callback(err);
          } else {
            callback(null, data?.edit);
          }
        },
        data.place || "append"
      );
    });
  }
};
const getinfo = function (title, project, callback, options = {}) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  if (!Object.keys(options).length) {
    callback({
      check: true,
    });
  } else {
    let pageC =
      options.wordcount || options.precondition.wordLimit ? title : null;
    let creatorC =
      options.permission ||
      options.precondition.byteLimit ||
      options.creationdate
        ? title
        : null;
    let userC =
      (options.editcount || options.lastcontrib) && options.username
        ? options.username
        : null;
    let errors = [];
    pageinfo(pageC, apiUrl, (perror, pdata) => {
      if (perror) {
        errors.push(perror);
      }
      creatorLookOut(creatorC, apiUrl, (cerror, cdata) => {
        if (cerror) {
          errors.push(cerror);
        }
        userinfo(userC, apiUrl, (uerror, udata) => {
          if (uerror) {
            errors.push(errors);
          }
          callback(errors, { pdata, cdata, udata });
        });
      });
    });
  }
};
function wikitable(html) {
  if (!html) return "No content found!";

  let wikiText = "";
  let index = 0;
  html = html
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "$1")
    .replace(/<div[^>]*>|<\/div>/gi, "");
  while (index < html.length) {
    let remainingHtml = html.slice(index);

    // Match headings
    let headingMatch = remainingHtml.match(/^<h(\d)>(.*?)<\/h\d>/i);
    if (headingMatch) {
      let level = parseInt(headingMatch[1], 10);
      let text = headingMatch[2].replace(/<[^>]+>/g, "").trim();
      wikiText +=
        "=".repeat(level) + " " + text + " " + "=".repeat(level) + "\n\n";
      index += headingMatch[0].length;
      continue;
    }

    // Match table
    let tableMatch = remainingHtml.match(/^<table[^>]*>(.*?)<\/table>/is);
    if (tableMatch) {
      let tableContent = tableMatch[1];
      let wikiTable = '{| class="wikitable"\n';

      let rows = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gis);
      if (rows) {
        for (let row of rows) {
          wikiTable += "|-\n";
          let cells = row.match(/<(th|td)[^>]*>(.*?)<\/\1>/gis);
          if (!cells) continue;
          for (let cell of cells) {
            let cellMatch = cell.match(/<(th|td)([^>]*)>(.*?)<\/\1>/i);
            let tagType = cellMatch[1];
            let attributes = cellMatch[2].trim();
            let cellText = cellMatch[3].trim();
            let cellType = tagType === "th" ? "!" : "|";

            let attrText = "";
            let colspanMatch = attributes.match(/colspan=["']?(\d+)["']?/i);
            if (colspanMatch) {
              attrText += ` colspan="${colspanMatch[1]}"`;
            }

            let styleMatch = attributes.match(/style=["']?([^"']+)["']?/i);
            if (styleMatch) {
              attrText += ` style=\"${styleMatch[1]}\"`;
            }

            wikiTable += `${cellType}${
              attrText.length > 0 ? attrText + "|" : ""
            } ${cellText}\n`;
          }
        }
      }
      wikiTable += "|}\n";
      wikiText += wikiTable;
      index += tableMatch[0].length;
      continue;
    }
    let textMatch = remainingHtml.match(/^[^<]+/);
    if (textMatch) {
      wikiText += textMatch[0].trim() + "\n\n";
      index += textMatch[0].length;
      continue;
    }
    // If no known match is found, move forward
    index++;
  }

  return wikiText.trim();
}
function pageinfo(title, url, callback) {
  if (!title) {
    callback(null, null);
  } else {
    let params = {
      action: "parse",
      format: "json",
      page: title,
      prop: "wikitext",
      formatversion: "2",
    };
    request.get(
      {
        uri: url,
        qs: params,
        json: true,
      },
      (error, res, data) => {
        if (error) {
          callback(error);
        } else {
          if (data?.parse?.wikitext) {
            callback(null, {
              result: "success",
              wordcount: countWord(data.parse.wikitext),
            });
          } else {
            callback(data);
          }
        }
      }
    );
  }
}
function creatorLookOut(title, url, callback) {
  if (!title) {
    callback(null, null);
  } else {
    let params = {
      action: "query",
      format: "json",
      prop: "info|revisions",
      titles: title,
      formatversion: "2",
      rvprop: "timestamp|user|comment|tags",
      rvlimit: "1",
      rvdir: "newer",
    };
    request.get(
      { url: url, qs: params, json: true },
      function (error, res, data) {
        if (error) {
          callback(error, null);
        } else {
          let fdata = data?.query?.pages[0];
          if (fdata.missing) {
            callback(fdata, null);
          } else {
            var revision = fdata.revisions[0],
              result = {
                creator: revision.user,
                creation: revision.timestamp,
                summary: revision.comment,
                tags: revision.tags,
                length: fdata.length,
              };
            callback(null, result);
          }
        }
      }
    );
  }
}
function userinfo(username, apiUrl, callback) {
  if (!username) {
    callback(null, null);
  } else {
    let params = {
      action: "query",
      format: "json",
      list: "users|usercontribs",
      formatversion: "2",
      usprop: "editcount|blockinfo",
      ususers: username,
      uclimit: "1",
      ucuser: username,
      ucdir: "older",
      ucprop: "title|timestamp|size|flags",
    };
    request.get(
      {
        uri: apiUrl,
        qs: params,
        json: true,
      },
      (error, res, body) => {
        if (error) {
          callback(error);
        } else {
          let data = body.query.users[0];
          if (data.invalid) {
            callback({
              message: "please log in again",
              code: "Invalid username",
              error: true,
            });
          } else if (data.blockid) {
            if (data.blockexpiry == "infinite") {
              callback({
                message:
                  "You are blocked perform any edit in " +
                  project +
                  ".org for forever. You can't submit your contribution in this editathon",
                code: "blocked",
                error: true,
              });
            } else {
              let dateobj = countDay(data.blockexpiry);
              callback({
                message:
                  "You are blocked perform any edit in " +
                  project +
                  ".org until " +
                  dateobj.date +
                  ". You can't submit your contribution in this editathon for more " +
                  dateobj.days +
                  " days",
                code: "blocked",
                error: true,
              });
            }
          } else {
            callback(null, data);
          }
        }
      }
    );
  }
}
function userIsAdmin(username, langcode, callback) {
  if (!username) {
    callback(null, null);
  } else {
    let params = {
      action: "query",
      format: "json",
      list: "users",
      usprop: "groups",
      ususers: username,
    };
    request.get(
      {
        uri: `https://${langcode}.wikipedia.org/w/api.php`,
        qs: params,
        json: true,
      },
      (error, res, body) => {
        if (error) {
          callback(error);
        } else {
          let data = body?.query?.users[0];
          if (data.invalid) {
            callback({
              message: "please log in again",
              code: "Invalid username",
              error: true,
            });
          } else if (data.groups.includes("sysop")) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }
      }
    );
  }
}
//dependencies
function getCsrfToken(oauthdata, url, callback) {
  console.log("getting CSRF...");
  let params = {
    action: "query",
    meta: "tokens",
    type: "csrf",
    format: "json",
  };
  request.get(
    {
      uri: url,
      oauth: oauthdata,
      json: true,
      qs: params,
      timeout: 10000,
    },
    (error, response, body) => {
      if (error) {
        console.error("Error getting CSRF token:", error);
      } else {
        const csrfToken = body?.query?.tokens?.csrftoken;
        callback(csrfToken);
      }
    }
  );
}
function edit(page, oauthdata, data, token, url, callback, where, summary) {
  let params = {
    action: "query",
    format: "json",
    prop: "revisions",
    titles: page,
    formatversion: "2",
    rvprop: "content",
    rvslots: "*",
  };
  request.get({ url: url, qs: params }, function (error, res, body) {
    if (error) {
      callback(error);
    } else {
      let result = JSON.parse(body);
      let pageData = "";
      let firstObj = result.query?.pages[Object.keys(result.query.pages)[0]];
      if (!firstObj?.missing)
        if (!firstObj?.missing)
          pageData =
            firstObj?.revisions[0].content ||
            firstObj?.revisions[0]?.slots.main["content"] ||
            "";
      let updatedData;
      data = data || "";
      switch (where) {
        case "append":
          updatedData = pageData + "\n" + data;
          break;
        case "prepend":
          updatedData = data + "\n" + pageData;
          break;
        case "replace":
          updatedData = data;
          break;
        default:
          updatedData = data + "\n" + pageData;
      }

      let editParams = {
        action: "edit",
        title: page,
        text: updatedData,
        summary: summary || "edits usinging checkmate",
        token: token,
        format: "json",
      };
      request(
        {
          url: url,
          method: "POST",
          form: editParams,
          oauth: oauthdata,
          json: true,
        },
        function (error, res, body) {
          if (error) {
            callback(error);
          } else {
            if (body.error) {
              callback(body);
            } else {
              callback(null, body);
            }
          }
        }
      );
    }
  });
}
function countWord(wikitext) {
  // Remove all infobox-like structures (matching any content within {{ and }}, and ignoring the name)
  wikitext = wikitext.replace(/\{\{[^\}]*?\}\}/g, ""); // Remove all templates ({{ ... }})
  wikitext = wikitext.replace(/\{\|[\s\S]*?\|\}/g, ""); // Remove table-style Infobox (e.g., {| ... |})

  // Remove reference tags and superscript content
  wikitext = wikitext.replace(/<ref[\s\S]*?<\/ref>/g, ""); // Remove <ref>...</ref>
  wikitext = wikitext.replace(/<sup[\s\S]*?<\/sup>/g, ""); // Remove <sup>...</sup>
  wikitext = wikitext.replace(/<sub[\s\S]*?<\/sub>/g, ""); // Remove <sub>...</sub>

  // Remove File and Category links
  wikitext = wikitext.replace(/\[\[File:[^\]]+\]\]/g, "");
  wikitext = wikitext.replace(/\[\[Category:[^\]]+\]\]/g, "");

  // Remove HTML comments <!-- ... -->
  wikitext = wikitext.replace(/<!--[\s\S]*?-->/g, "");
  let length = wikitext.split(/\s+|[-']/g).filter((e) => e).length;
  // Now split the text by spaces or other common word boundaries and count the words
  return length;
}
function countDay(date) {
  let today = new Date();
  let diffdate = new Date(date);
  let diff = Math.abs(today.getTime() - diffdate.getTime());

  let monthArray = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];
  let diffObj = {
    date:
      diffdate.getDate() +
      " " +
      monthArray[diffdate.getMonth()] +
      ", " +
      diffdate.getFullYear(),
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
  };
  return {
    days: diffObj.days,
    date: diffObj.date,
  };
}
module.exports = {
  editPage,
  getWikitext,
  getinfo,
  wikitable,
  isAdmin: userIsAdmin,
};
