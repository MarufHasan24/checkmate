// lib
const {
  uriEncript,
  updateFile,
  updateFileOwn,
  writeFile,
  readFile,
  deleteFile,
  join,
  keepLog,
  editathonTable,
  readUser,
} = require("./public/lib/node.js");
const {
  getinfo,
  editPage,
  wikitable,
  isAdmin,
} = require("./public/lib/mwiki.js");
// Routes to handle POST requests
module.exports = {
  template: function (req, res) {
    // Read the template data from a JSON file
    readFile(join(__dirname, "private", "tempdata.json"), (err, rawdata) => {
      if (err) {
        //console.error(err);
      } else {
        let date = new Date().toISOString();
        // Destructure necessary fields from the request body
        const { key, password, template, userdata, compname, project } =
          req.body;

        // Check for missing parameters and send a 400 status if any are missing
        if (
          !key ||
          !password ||
          !template ||
          !compname ||
          !userdata ||
          !project
        ) {
          return res.render("error.ejs", {
            status: 400,
            error: "Missing params",
            redirect: null,
          });
        }

        // Parse the template data from the file
        let tempdata = rawdata[template];
        // Create the final data object to be saved
        let finaldata = JSON.stringify({
          key: key,
          date: date,
          pass: password,
        });
        updateFileOwn(userdata.username, finaldata, (err) => {
          if (err) {
            //console.error(err);
          } else {
            // Write user data to a specific file
            writeFile(
              join(__dirname, "private", "db", "files", key + ".json"),
              JSON.stringify({
                key: key,
                pass: password,
                template: tempdata.file,
                host: userdata.username,
                date: date,
                name: compname,
                project: project,
                data: {},
                post: {},
              }),
              (err) => {
                if (err) {
                  //console.error(err);
                } else {
                  // Read the company list data from a JSON file
                  readFile(
                    join(__dirname, "private", "querylist.json"),
                    (err, existingData) => {
                      if (err) {
                        //console.error(err);
                      } else {
                        // Parse the existing data
                        // Parse the existing data from a JSON string into a JavaScript object
                        const parsedData = existingData;
                        parsedData.key[key] = {
                          name: compname,
                          host: userdata.username,
                          date: date,
                          project: project,
                        };
                        // Write the updated data back to the JSON file
                        writeFile(
                          join(__dirname, "private", "querylist.json"),
                          JSON.stringify(parsedData),
                          (err) => {
                            if (err) {
                              //console.error(err);
                            } else {
                              // Send a success response
                              res.send({
                                result: "Success",
                                data: uriEncript({
                                  key,
                                  password,
                                  template: tempdata,
                                  expire: Date.now() + 20 * 60 * 1000,
                                  name: compname,
                                  project: project,
                                }),
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    });
  },
  dashboard: function (req, res) {
    let { data, key, pass } = req.body;

    // Define the keys you want to filter out
    const filterKeys = [
      "pagecount",
      "usercount",
      "reviewed",
      "jurries_list",
      "page_list",
    ];

    // Create an empty object to store the filtered data
    let post = {};
    let newData = {};

    // Iterate through the data object and separate based on filterKeys
    for (let [key, value] of Object.entries(data)) {
      if (filterKeys.includes(key)) {
        post[key] = value; // Save filtered keys in the post object
      } else {
        newData[key] = value; // Save other keys in the newData object
      }
    }
    data = newData;
    //res.cookie("tempdata", { ...data, key }, { maxAge: 60 * 20, httpOnly: true });
    if (key) {
      const filePath = join(__dirname, "private", "db", "files", key + ".json");
      updateFile(filePath, (err, rdata, callback) => {
        if (err) {
          return;
        }

        if (pass && !data) {
          rdata.pass = pass;
        } else {
          if (!rdata.post) {
            rdata.post = {};
          }
          rdata.post = {
            pagecount: rdata.post.pagecount ?? 0,
            usercount: rdata.post.usercount ?? [],
            reviewed: rdata.post.reviewed ?? 0,
            jurries_list: {
              ...rdata.post.jurries_list, // Preserve existing jurors
            },
            page_list: rdata.post.page_list ?? {},
          };
          if (data.jurries != rdata.data.jurries) {
            const newJurries = data.jurries
              .split(",")
              .map((j) => j.trim())
              .filter((e) => e);
            newJurries.forEach((jury) => {
              if (!(jury in rdata.post.jurries_list)) {
                rdata.post.jurries_list[jury] = {}; // Only add new jurors, keep existing ones
              }
            });
          }
          // Merge existing data instead of overwriting
          rdata.data = {
            ...rdata.data, // Preserve existing values
            ...data, // Merge new values
          };
        }

        // Ensure existing keys are not deleted
        delete rdata.data?.key;
        delete rdata.data?.host;

        callback(rdata, (err) => {
          if (err) {
            return res.status(200).send({ error: err });
          } else {
            return res.status(200).send({ error: null });
          }
        });
      });
    } else {
      return res.status(200).send({
        error: "No key",
      });
    }
  },
  delete: function (req, res) {
    if (req.body) {
      let key = req.body.key;
      let user = req.body.user;
      let host = req.body.host;
      let userdata = {};
      updateFile(
        join(__dirname, "private", "querylist.json"),
        (err, olddata, callback) => {
          if (err) {
            //console.error(err);
          } else {
            userdata = olddata.key[key];
            delete olddata.key[key];
            callback(olddata, (err) => {
              if (err) {
                //console.error(err);
              } else {
                updateFile(
                  join(
                    __dirname,
                    "private",
                    "user",
                    `usr-${encodeURIComponent(host)}.json`
                  ),
                  (err, uolddata, callback) => {
                    if (err) {
                      //console.error(err);
                    } else {
                      uolddata.data = uolddata.data.filter(
                        (e) => e.key !== key
                      );
                      callback(uolddata, (err) => {
                        if (err) {
                          //console.error(err);
                        } else {
                          deleteFile(
                            join(
                              __dirname,
                              "private",
                              "db",
                              "files",
                              key + ".json"
                            ),
                            (err) => {
                              if (err) {
                                res.render("error.ejs", {
                                  status: 500,
                                  error:
                                    "Something went error. File not deleted",
                                  redirect: null,
                                });
                              } else {
                                return res.status(200).send({
                                  success: true,
                                });
                              }
                            },
                            key,
                            user
                          );
                        }
                      });
                    }
                  }
                );
              }
            });
          }
        }
      );
    } else {
      res.render("error.ejs", {
        status: 500,
        error:
          "Server side error. Didn't recieved any response from your browser",
        redirect: {
          url: "https://meta.wikimedia.org/wiki/User_talk:Maruf",
          name: "Contact Support",
        },
      });
    }
  },
  submit: function (req, res) {
    let { body, devider, username, performer } = req.body;
    devider = devider || ";";
    username = username.replace(/\t/g, "");
    const renderArray = (str) => {
      const isArrayString = (str) => {
        return /^\s*(\[)?\s*(?:"[^"]*"|'[^']*')(?:\s*,\s*(?:"[^"]*"|'[^']*'))*\s*(\])?\s*$/.test(
          str
        );
      };
      if (isArrayString(str)) {
        // Replace single quotes with double quotes to safely parse JSON
        const jsonString = str.replace(/'/g, '"');
        return Array.from(new Set(JSON.parse(jsonString))).map((e) => e.trim());
      } else {
        return Array.from(
          new Set(
            str
              .trim()
              .split(devider)
              .filter((e) => e)
          )
        );
      }
    };
    updateFile(
      join(__dirname, "private", "db", "files", req.body.key + ".json"),
      (err, oldata, callback) => {
        if (err) {
          console.error(err);
        } else {
          let state = {};
          body = renderArray(body);
          let pagecount = Number(oldata.post.pagecount);
          let i = 0;
          let wordcount = oldata.data.word_count,
            precondition = {
              wordlimit:
                Number(oldata.data.word_limit) > 0
                  ? Number(oldata.data.word_limit)
                  : 0,
              date_condition: !isNaN(Date.parse(oldata.data.date_limit))
                ? new Date(oldata.data.date_limit)
                : false,
              when: oldata.data.date_condition,
              byteLimit:
                Number(oldata.data.byte_limit) > 0
                  ? Number(oldata.data.byte_limit)
                  : 0,
            };
          (editcount = oldata.data.user_edit_count),
            (lastcontrib = oldata.data.user_last_contribiution),
            (creationdate = oldata.data.creation_date),
            (permission =
              oldata.data.upload_conditions == "anyone"
                ? null
                : oldata.data.upload_conditions); //only creator,anyone,anyone but creator
          readUser(
            join(
              __dirname,
              "private",
              "user",
              "usr-" + encodeURIComponent(performer) + ".json"
            ),
            (err, udata) => {
              if (err) {
                return res.status(200).send({
                  message: JSON.stringify(err, null, 2),
                  type: "error",
                });
              } else {
                function iloop(i, icallback) {
                  if (i < body.length) {
                    if (oldata.post.page_list) {
                      let e = body[i];
                      if (!oldata.post.page_list[e]) {
                        let finalobj = {
                          sd: Date.now(),
                          sub: username,
                          rev: "",
                          stat: "",
                          length: 0,
                        };
                        if (
                          wordcount || //wikitext page section + page info
                          editcount || // user section edit
                          lastcontrib || // user section last contributation date
                          precondition || // same with word count + page info
                          permission || // according to permit, page section + creatorLookOut
                          creationdate // page section withg permission + creatorLookOut
                        ) {
                          getinfo(
                            e,
                            oldata.data.base_component,
                            (err, data) => {
                              if (err.length) {
                                // Creating a circular reference
                                err[0].self = err[0]; // Circular reference
                                const beautifiedJSON =
                                  removeCircularReferences(err);
                                state[e] = {
                                  result: "error",
                                  time: Date.now(),
                                  cause:
                                    typeof err === "object"
                                      ? beautifiedJSON
                                      : err,
                                };
                              } else {
                                let cause = [];
                                if (
                                  precondition.date_condition ||
                                  precondition.wordlimit ||
                                  precondition.byteLimit
                                ) {
                                  if (precondition.date_condition) {
                                    const creationDate = new Date(
                                      data.cdata.creation
                                    );
                                    const conditionDate = new Date(
                                      precondition.date_condition
                                    );
                                    precondition.date_condition,
                                      precondition.wordlimit;
                                    if (
                                      !isNaN(creationDate) &&
                                      !isNaN(conditionDate)
                                    ) {
                                      if (
                                        precondition.when === "after" &&
                                        creationDate < conditionDate
                                      ) {
                                        cause.push(
                                          `<b>${e} has been created on ${creationDate}. According to the editathon's rules, you can only submit pages created after ${conditionDate}.</b>`
                                        );
                                      } else if (
                                        precondition.when === "before" &&
                                        creationDate > conditionDate
                                      ) {
                                        cause.push(
                                          `<b>${e} has been created on ${creationDate}. According to the editathon's rules, you can only submit pages created before ${conditionDate}.</b>`
                                        );
                                      }
                                    } else {
                                      cause.push(
                                        `<b>Invalid date detected. Please check the data.</b>`
                                      );
                                    }
                                  }
                                  if (precondition.wordlimit > 0) {
                                    if (
                                      data.pdata.wordcount <
                                      precondition.wordlimit
                                    ) {
                                      cause.push(
                                        `<b>${e} has only ${data.pdata.wordcount} words. According to the editathon's rules, a submission must have at least ${precondition.wordlimit} words.</b>`
                                      );
                                    }
                                  }
                                  if (precondition.byteLimit > 0) {
                                    if (
                                      data.cdata.length < precondition.byteLimit
                                    ) {
                                      cause.push(
                                        `<b>${e} is only ${data.cdata.length} bytes. According to the editathon's rules, a submission must have at least ${precondition.byteLimit} bytes.</b>`
                                      );
                                    }
                                  }
                                }
                                if (
                                  permission == "only creator" &&
                                  data.cdata.creator !== username
                                ) {
                                  cause.push(
                                    `<b>${
                                      data.cdata.creator
                                    } has created ${e} in${new Date(
                                      data.cdata.creation
                                    )}. According to the editathon's rules you can only submit pages you have created!</b> `
                                  );
                                } else if (
                                  permission == "anyone but creator" &&
                                  data.cdata.creator == username
                                ) {
                                  cause.push(
                                    `You has created <b>${e}</b> in ${new Date(
                                      data.cdata.creation
                                    ).toDateString()}. According to the editathon's Rules you can only submit pages, that you have not created!`
                                  );
                                }
                                if (cause.length > 0) {
                                  state[e] = {
                                    result: "info",
                                    time: Date.now(),
                                    cause: cause.join("<br>"),
                                    data: data,
                                  };
                                } else {
                                  state[e] = {
                                    result: "success",
                                    time: Date.now(),
                                    cause: `<b>${e}</b> has been submited successfully`,
                                    data: data,
                                  };
                                  creationdate
                                    ? (finalobj["cd"] = data.cdata.creation)
                                    : null;
                                  editcount
                                    ? (finalobj["ec"] = data.udata.editcount)
                                    : null;
                                  wordcount
                                    ? (finalobj["wc"] = data.pdata.wordcount)
                                    : null;
                                  precondition.byteLimit > 0
                                    ? (finalobj.length = data.cdata.length)
                                    : null;
                                  oldata.post.page_list[e] = finalobj;
                                  pagecount++;
                                }
                              }
                              if (state[e].result == "success") {
                                let talkpage = "";
                                if (e.includes(":")) {
                                  let Array = e.split(":");
                                  Array[0] = Array[0].length
                                    ? Array[0] + " talk"
                                    : "Talk";
                                  talkpage = Array.join(":");
                                } else {
                                  talkpage = "Talk:" + e;
                                }
                                editPage(
                                  udata.user.oauth,
                                  oldata.project,
                                  {
                                    title: talkpage,
                                    text: oldata.data[
                                      "windowinp-input16-text1"
                                    ],
                                    place: "prepend",
                                  },
                                  (err, edata) => {
                                    if (err) {
                                      state[e] = {
                                        result: "error",
                                        time: Date.now(),
                                        cause: JSON.stringify(err, null, 2),
                                      };
                                    } else {
                                      i++;
                                      iloop(i, icallback);
                                    }
                                  }
                                );
                              } else {
                                i++;
                                iloop(i, icallback);
                              }
                            },
                            {
                              wordcount,
                              editcount,
                              lastcontrib,
                              precondition,
                              permission,
                              creationdate,
                              username,
                            }
                          );
                        } else {
                          state[e] = {
                            result: "success",
                            time: Date.now(),
                            cause: `<b>${e}</b> has been submited successfully`,
                          };
                          oldata.post.usercount.includes(username)
                            ? null
                            : oldata.post.usercount.push(username);
                          oldata.post.page_list[e] = finalobj;
                          pagecount++;
                          i++;
                          iloop(i, icallback);
                        }
                      } else {
                        state[e] = {
                          result: "warn",
                          time: Date.now(),
                          cause: `<b>${e}</b> has been submited by User:${oldata.post.page_list[e].sub} already.`,
                        };
                        i++;
                        iloop(i, icallback);
                      }
                    }
                  } else {
                    oldata.post.pagecount = pagecount;
                    icallback(oldata, { key: req.body.key, state });
                  }
                }
                iloop(i, (oldata, data) => {
                  callback(oldata, (err) => {
                    if (err) {
                      return res.status(200).send({
                        message: JSON.stringify(err, null, 2),
                        type: "error",
                      });
                    } else {
                      return res.status(200).send(data);
                    }
                  });
                });
              }
            }
          );
        }
      }
    );
  },
  judge: function (req, res) {
    const { key, user, page, jdata } = req.body;
    if (!key) {
      return res.status(200).send({
        error: "Missing key",
      });
    } else if (!user) {
      return res.status(200).send({
        error: "Missing username",
      });
    } else if (!page) {
      return res.status(200).send({
        error: "Missing pagename",
      });
    } else {
      updateFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, oldata, callback) => {
          if (err) {
            console.error(err);
            return res.status(200).send({
              error: err,
            });
          } else {
            let pdata = oldata.post.page_list[page];
            if (pdata) {
              if (pdata.sub == user) {
                callback(oldata, (err) => {
                  if (err) {
                    return res.status(200).send({
                      error: err,
                    });
                  } else {
                    return res.status(200).send({
                      message:
                        page +
                        "is submited by you, you can't judge it! Redirecting to anothe page...",
                      redirect: {
                        url:
                          "/judge?key=" +
                          key +
                          "&page=" +
                          list[Math.floor(list.length * Math.random())],
                        timer: 7,
                      },
                    });
                  }
                });
              } else {
                pdata.rev = user;
                pdata.stat = jdata.state;
                oldata.post.jurries_list[user][page] = pdata;
                delete oldata.post.page_list[page];
                oldata.post.reviewed++;
                callback(oldata, (err) => {
                  if (err) {
                    return res.status(200).send({
                      error: err,
                    });
                  } else {
                    return res.status(200).send({
                      result: "success",
                    });
                  }
                });
              }
            } else {
              let list = Object.keys(oldata.post.page_list);
              return res.status(200).send({
                message: page + "has been judged already!",
                type: "info",
                redirect: {
                  url:
                    "/judge?key=" +
                    key +
                    "&page=" +
                    list[Math.floor(list.length * Math.random())],
                  timer: null,
                  button: "Random Page",
                },
              });
            }
          }
        }
      );
    }
  },
  remove: function (req, res) {
    let mainkey = req.body?.key;
    let user = req.body?.username;
    let pagelist = req.body?.list; // list of pages to remove
    if (mainkey) {
      keepLog(
        user,
        "remove pages",
        (lerr) => {
          if (lerr) {
            // console.error(lerr);
          }
          updateFile(
            join(__dirname, "private", "db", "files", mainkey + ".json"),
            (err, data, callback) => {
              if (err) {
                return res.status(200).send({
                  message: JSON.stringify(err, null, 2),
                  type: "error",
                });
              } else {
                let page_List = data.post.page_list;
                let jurriesList = data.post.jurries_list;
                let pagecount = data.post.pagecount;
                let reviewed = data.post.reviewed;
                pagelist = pagelist.filter((e) => {
                  if (page_List[e]) {
                    delete page_List[e];
                    pagecount--;
                    console.log(e);
                  } else {
                    return e;
                  }
                });
                Object.entries(jurriesList).forEach(([key, value]) => {
                  pagelist = pagelist.filter((e) => {
                    if (value[e]) {
                      delete value[e];
                      pagecount--;
                      reviewed--;
                      console.log(e);
                    } else {
                      return e;
                    }
                  });
                });

                data.post.pagecount = pagecount;
                data.post.reviewed = reviewed;
                callback(data, (err) => {
                  if (err) {
                    return res.status(200).send({
                      message: JSON.stringify(err, null, 2),
                      type: "error",
                    });
                  } else {
                    return res.status(200).send({
                      message: "Pages removed successfully!",
                      type: "success",
                    });
                  }
                });
              }
            }
          );
        },
        {
          ip:
            req.headers["x-forwarded-for"] ||
            req.ip ||
            req.headers["x-client-ip"] ||
            req.socket.remoteAddress ||
            null,
          key: mainkey,
        }
      );
    } else {
      return res.status(200).send({
        message: "No key provided",
        type: "error",
      });
    }
  },
  /* intarnal post requests */
  //comment on user pages
  comment: function (req, res) {
    let key = req.body.key;
    let user = req.body.user;
    if (user) {
      if (key) {
        const userfilePath = join(
          __dirname,
          "private",
          "user",
          `usr-${encodeURIComponent(user)}.json`
        );
        readFile(userfilePath, (err, data) => {
          if (err) {
            return res.status(200).send({
              message: JSON.stringify(err, null, 2),
              type: "error",
              redirect: null,
            });
          } else {
            let oauth = {};
            try {
              oauth = JSON.parse(data.user)?.oauth;
            } catch (e) {
              oauth = data.user.oauth;
            }
            editPage(
              oauth,
              req.body.project,
              {
                text: req.body.response + "~~~~",
                place: "append",
                title: "user talk:" + req.body.submitter,
              },
              (err, edata) => {
                if (err) {
                  return res.status(200).send({
                    message: JSON.stringify(err, null, 2),
                    type: "error",
                    redirect: null,
                  });
                } else {
                  return res.status(200).send({
                    message:
                      "Message sent successfully. return body: <br>" +
                      JSON.stringify(edata, null, 2),
                    type: "success",
                    redirect: null,
                  });
                }
              }
            );
          }
        });
      } else {
        return res.status(200).send({
          message:
            "Corrupted request from your browser. Please try again reloading this page",
          type: "error",
          redirect: null,
        });
      }
    } else {
      return res.status(200).send({
        message: "Login please!",
        type: "error",
        redirect: {
          url: "/login?callback=" + encodeURIComponent(url),
          timer: null,
          button: "Login",
        },
      });
    }
  },
  //get rows on request
  getRows: function (req, res) {
    let key = req.body?.key;
    let count = req.body?.count || 50;
    let format = req.body?.format || "html";
    let currentPage = parseInt(req.body?.currentPage, 10) || 1;

    if (!key) {
      return res.status(400).send({ error: "No key provided" });
    }
    readFile(
      join(__dirname, "private", "db", "files", key + ".json"),
      (err, rdata) => {
        getTranslation(
          req.session,
          rdata.data.langcode,
          (terr, translation) => {
            if (terr) {
              return res.status(500).send({
                error: "Internal server error",
              });
            }
            if (err) {
              console.error(err); // Log the error
              return res
                .status(404)
                .send({ error: "Invalid key or file not found" });
            } else {
              let page_list = { ...rdata.post.page_list };
              let participent = {};
              Object.entries(rdata.post.jurries_list).forEach((e) => {
                Object.assign(page_list, e[1]);
              });
              Object.entries(page_list).forEach(([_, value]) => {
                let { sub, stat } = value;
                if (!participent[sub]) {
                  participent[sub] = { total: 0, reviewed: 0, marks: 0 };
                }
                participent[sub].total++;
                if (stat !== "") {
                  participent[sub].reviewed++;
                  participent[sub].marks +=
                    Number(rdata?.data?.dynamic[stat]?.mark) || 0;
                }
              });
              let keys = Object.keys(page_list);
              let tempagelist = {};
              let table = {};
              count == "All" ? (count = keys.length) : null;
              let startindex = count * (currentPage - 1);
              let endindex = count * currentPage;
              for (let i = startindex; i < endindex; i++) {
                tempagelist[keys[i]] = page_list[keys[i]];
              }
              table = {
                batchcompleate: false,
                startindex: endindex,
                currentPage: currentPage,
                totalPage: Math.ceil(keys.length / count),
                participent,
              };
              if (format == "html") {
                table.html = editathonTable(
                  tempagelist,
                  key,
                  startindex,
                  translation
                );
              } else {
                table.json = tempagelist;
              }
              return res.status(200).send(table);
            }
          }
        );
      }
    );
  },
  //sub set of dashboard
  dashboardbr: function (req, res) {
    const key = req.body.key;
    const user = req.body.user;
    if (user) {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            return res.status(200).send({
              err,
            });
          } else {
            const path = join(
              __dirname,
              "private",
              "log",
              "request",
              key + ".json"
            );
            readFile(path, (rerr, data) => {
              if (rerr) {
                writeFile(
                  path,
                  JSON.stringify({
                    requester: user,
                    date: new Date(),
                    host: rdata.host,
                    hostingDate: new Date(rdata.date),
                    starting: Date.parse(
                      rdata.data?.start_date + " " + rdata.data?.start_time
                    ),
                    ending: Date.parse(
                      rdata.data?.end_date + " " + rdata.data?.end_time
                    ),
                    jurries: rdata.data.jurries.split(","),
                    key: key,
                    state: false,
                    aprover: "",
                    dynamic: rdata.data.dynamic,
                    "total submission": rdata.post.pagecount,
                    reamining: rdata.post.pagecount - rdata.post.reviewed,
                  }),
                  (err) => {
                    if (err)
                      return res.status(200).send({
                        err,
                      });
                    else {
                      keepLog(user, "br-request", (lerr) => {
                        return res.status(200).send({
                          message:
                            "Your request for batch review has placed successfully.",
                          redirect: null,
                        });
                      });
                    }
                  }
                );
              } else {
                return res.status(200).send({
                  message:
                    data.requester === user
                      ? "You already have placed a request, which has" +
                        (data.state
                          ? "aproved by " + data.aprover
                          : "not aproved yet")
                      : "Bro, what you are trying to do!🥱",
                  redirect: null,
                });
              }
            });
          }
        }
      );
    } else {
      return res.status(200).send({
        message: "Login please!",
        type: "error",
        redirect: null,
      });
    }
  },
  //elemination
  elemination: function (req, res) {
    const key = req.body.key;
    const user = req.body.user;
    const type = req.body.type;
    if (user && type && key) {
      keepLog(
        user,
        "elemination/" + type,
        (lerr) => {
          updateFile(
            join(__dirname, "private", "db", "files", key + ".json"),
            (err, rdata, callback) => {
              if (err) {
                return res.status(200).send({
                  message: JSON.stringify(err, null, 2),
                  type: "error",
                });
              } else {
                getTranslation(
                  req.session,
                  rdata.data.langcode,
                  (terr, trns) => {
                    if (terr) {
                      return res.status(200).send({
                        message:
                          "Internal server error!\n" +
                          JSON.stringify(terr, null, 2),
                        type: "error",
                      });
                    } else {
                      if (type == "eleminate") {
                        rdata.data.eleminated = {
                          date: Date.now(),
                          eleminator: user,
                          reason: req.body.reason,
                        };
                        callback(rdata, (err) => {
                          if (err) {
                            return res.status(200).send({
                              message: JSON.stringify(err, null, 2),
                              type: "error",
                            });
                          } else {
                            return res.status(200).send({
                              message: "This editathon has eleminated!🥱",
                              type: "info",
                              redirect: {
                                timer: 5,
                              },
                            });
                          }
                        });
                      } else if (type == "Cancel") {
                        delete rdata.data.eleminated;
                        callback(rdata, (err) => {
                          if (err) {
                            return res.status(200).send({
                              message: JSON.stringify(err, null, 2),
                              type: "error",
                            });
                          } else {
                            return res.status(200).send({
                              message:
                                "Elemination on this edtaitahon has removed successfully!😀",
                              type: "success",
                              redirect: {
                                timer: 5,
                              },
                            });
                          }
                        });
                      } else if (type == "request") {
                        readUser(
                          join(
                            __dirname,
                            "private",
                            "user",
                            "usr-" + encodeURIComponent(user) + ".json"
                          ),
                          (err, udata) => {
                            if (err) {
                              return res.status(200).send({
                                message: JSON.stringify(err, null, 2),
                                type: "error",
                              });
                            } else {
                              editPage(
                                udata.user.oauth,
                                rdata.project,
                                {
                                  title: "user talk:Maruf",
                                  text: trns.message.elemination.review
                                    .replace(/\$key/g, key)
                                    .replace(/\$title/g, rdata.data.title)
                                    .replace(
                                      /\$eleminator/g,
                                      rdata.data.eleminated.eleminator
                                    )
                                    .replace(
                                      /\$date/g,
                                      new Date(rdata.data.eleminated.date)
                                    )
                                    .replace(
                                      /\$reason/g,
                                      rdata.data.eleminated.reason
                                    )
                                    .replace(/\$requester/g, user)
                                    .replace(/\$requestDate/g, new Date())
                                    .replace(
                                      /\$justification/g,
                                      req.body.reason
                                    ),
                                },
                                (err, data) => {
                                  console.log(err, data);
                                  if (err) {
                                    return res.status(200).send({
                                      message: JSON.stringify(err, null, 2),
                                      type: "error",
                                    });
                                  } else {
                                    return res.status(200).send({
                                      message:
                                        "Review request submited successfully!",
                                      type: "success",
                                    });
                                  }
                                }
                              );
                            }
                          }
                        );
                      } else {
                        return res.status(200).send({
                          message:
                            "Internal server error! Request type:" + type,
                          type: "error",
                        });
                      }
                    }
                  }
                );
              }
            }
          );
        },
        {
          key: key,
        }
      );
    } else {
      if (!user) {
        return res.status(200).send({
          message: "You have login first to perform such actions!",
          type: "warn",
        });
      } else {
        return res.status(200).send({
          message: "Internal server error!",
          type: "error",
        });
      }
    }
  },
  adminP: function (req, res) {
    let data = req.body;
    if (req.session?.user) {
      let user = req.session?.user?.displayName;
      updateFile(
        join(__dirname, "private", "db", "files", data.key + ".json"),
        (err, rdata, callback) => {
          if (err) {
            return res.status(200).send({
              message: JSON.stringify(err, null, 2),
              type: "error",
            });
          } else {
            if (Object.keys(rdata.post.jurries_list).includes(user)) {
              return res.status(200).send({
                message:
                  "You are a judge of this editathon. That's why you can't apply batch review. Action has closed",
                type: "warn",
              });
            } else {
              rdata.post.reamining = 0;
              rdata.post.reviewed = rdata.post.pagecount;
              rdata.data.autoReviewed = true;
              rdata.post.jurries_list[user] = {};
              for (i in rdata.post.page_list) {
                let e = rdata.post.page_list[i];
                e.rev = user;
                e.stat = data.dis.split(":")[0].trim();
                rdata.post.jurries_list[user][i] = e;
              }
              rdata.post.page_list = {};
              keepLog(user, "batch-review", (lerr) => {
                updateFile(
                  join(
                    __dirname,
                    "private",
                    "log",
                    "request",
                    data.key + ".json"
                  ),
                  (err, ardata, acallback) => {
                    if (err) {
                    } else {
                      ardata.aprover = user;
                      ardata.state = true;
                      callback(rdata, (err) => {
                        if (err) {
                          return res.status(200).send({
                            message: JSON.stringify(err, null, 2),
                            type: "error",
                          });
                        } else {
                          acallback(ardata, (err) => {
                            if (err) {
                              return res.status(200).send({
                                message: JSON.stringify(err, null, 2),
                                type: "error",
                              });
                            } else {
                              return res.status(200).send({
                                message: "Your job has done!",
                                type: "success",
                              });
                            }
                          });
                        }
                      });
                    }
                  },
                  join(
                    __dirname,
                    "private",
                    ".bin",
                    "log",
                    "request",
                    data.key + ".json"
                  )
                );
              });
            }
          }
        }
      );
    } else {
      res.redirect("/login?callback=" + encodeURIComponent("/admin/permit"));
    }
  },
  makeResult: function (req, res) {
    const { key, data, user } = req.body;
    keepLog(user, "result", (lerr) => {
      if (lerr) {
        console.error(lerr);
      } else {
        let tableString = wikitable(data.table);
        readUser(
          join(
            __dirname,
            "private",
            "user",
            "usr-" + encodeURIComponent(user)
          ) + ".json",
          (err, udata) => {
            if (err) {
              return res.status(200).send({
                message: JSON.stringify(err, null, 2),
                type: "error",
              });
            } else {
              editPage(
                udata.user.oauth,
                data.project,
                {
                  title: data.result,
                  text: tableString,
                  place: "append",
                },
                (err, edata) => {
                  if (err) {
                    return res.status(200).send({
                      message: JSON.stringify(err, null, 2),
                      type: "error",
                    });
                  } else {
                    updateFile(
                      join(__dirname, "private", "db", "files", key + ".json"),
                      (err, rdata, callback) => {
                        if (err) {
                          return res.status(200).send({
                            message: JSON.stringify(err, null, 2),
                            type: "error",
                          });
                        } else {
                          rdata.post.result = {
                            date: new Date().toISOString(),
                            page: data.result,
                            user: user,
                            isAotuReviewed: rdata.data?.autoReviewed || false,
                          };
                          callback(rdata, (err) => {
                            if (err) {
                              return res.status(200).send({
                                message: JSON.stringify(err, null, 2),
                                type: "error",
                              });
                            } else {
                              return res.status(200).send({
                                message:
                                  "Result has been published successfully!",
                                type: "success",
                              });
                            }
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    });
  },
  language: function (req, res) {
    let langcode = req.body.langcode;
    let user = req.body.user;
    readFile(join(__dirname, "private", "querylist.json"), (err, rdata) => {
      if (err) {
        //console.error(err);
        return res.render("error.ejs", {
          status: 500,
          error: "Error reading data",
          redirect: null,
        });
      } else {
        let keys = Object.keys(rdata.key);
        let rawData = rdata.key;
        keys = keys
          .sort((a, b) => {
            // sort keys based on the date in descending order
            let dateA = new Date(rawData[a].date);
            let dateB = new Date(rawData[b].date);
            return dateB - dateA; // Sort in descending order
          })
          .filter((e) => {
            // filter out keys that are not in the specified language
            let lang = rawData[e]?.project
              ? rawData[e].project.split(".")[0]
              : null;
            return lang == langcode;
          });
        let html = "";
        html = keys
          .map(
            (key) => `<tr>
                      <td colspan="3">
                          <div class="patrol-entry">
                              <div class="top">
                                  <a href="/editathon?key=${key}">${rawData[key].name}</a>
                              </div>
                              <div class="bottom">
                                  <span>Host: <a href="/query?host=${rawData[key].host}">${rawData[key].host}</a></span> |
                                  <span>Project: <a href="https://${rawData[key].project}.org/">${rawData[key].project}</a></span>
                              </div>
                          </div>
                      </td>
                  </tr>`
          )
          .join("");
        //return res.status(200).send({ asAdmin: false, html: html });
        isAdmin(user, langcode, (err, asAdmin) => {
          if (err) {
            console.error(err);
            return res.status(200).send({ asAdmin: false, html: html });
          } else {
            return res.status(200).send({ asAdmin, html: html });
          }
        });
      }
    });
  },
};
function removeCircularReferences(obj) {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    function (key, value) {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return; // Omit circular reference
        }
        seen.add(value);
      }
      return value;
    },
    2
  ); // 2 spaces for indentation
}
function getTranslation(session, langcode, callback) {
  if (session && session.trans && session.trans.langcode == langcode) {
    callback(null, session.trans);
  } else {
    readFile(
      join(__dirname, "private", "db", "translation", langcode + ".tran"),
      (err, rdata) => {
        if (err) {
          readFile(
            join(__dirname, "private", "db", "translation", "en.tran"),
            (err, rdata) => {
              if (err) {
                callback(err);
              } else {
                session.trans = rdata;
                session.trans.langcode = langcode;
                callback(null, session.trans);
              }
            }
          );
        } else {
          session.trans = rdata;
          session.trans.langcode = langcode;
          callback(null, session.trans);
        }
      }
    );
  }
}
