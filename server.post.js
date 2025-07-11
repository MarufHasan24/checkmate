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
  keepKeyLog,
  totp,
} = require("./public/lib/node.js");
const {
  getinfo,
  editPage,
  wikitable,
  isAdmin,
} = require("./public/lib/mwiki.js");
const request = require("request");
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
          name: compname,
          template: template,
          project: project,
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
    let changes = {};
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
          changes.pass = {
            pass,
            old: "hidden",
          };
        } else {
          if (!rdata.post) {
            rdata.post = {};
          }
          rdata.post = {
            pagecount: rdata?.post?.pagecount ?? 0,
            usercount: rdata?.post?.usercount ?? [],
            reviewed: rdata?.post?.reviewed ?? 0,
            jurries_list: {
              ...(rdata?.post?.jurries_list ?? {}), // Preserve existing jurors
            },
            page_list: rdata?.post?.page_list ?? {},
          };
          if (data.jurries != rdata.data?.jurries) {
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
          const oldData = JSON.parse(JSON.stringify(rdata.data || {})); // Deep copy of old data
          // Compare and track changes before merging
          for (const [key, value] of Object.entries(data)) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(value)) {
              changes[key] = { value, old: oldData[key] }; // Track changes
            }
          }
          delete changes.key; // Remove key from changes if it exists
          delete changes.host; // Remove host from changes if it exists
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
            keepKeyLog(
              key,
              data.host,
              "dashboard",
              (klerr) => {
                if (klerr) {
                  console.error(klerr);
                }
                return res.status(200).send({
                  message: "Data updated successfully",
                  type: "success",
                  redirect: {
                    url: "/dashboard?key=" + key,
                    timer: 3,
                  },
                });
              },
              {
                host: data.host,
                changes: changes,
              }
            );
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
      let host = "";
      let type = req.body.type;
      let bin = req.body.bin || false;
      updateFile(
        join(__dirname, "private", "querylist.json"),
        (err, olddata, callback) => {
          if (err) {
            console.error("Err 1:", err);
          } else {
            if (olddata.key[key]) {
              host = olddata.key[key].host;
            }
            delete olddata.key[key];
            callback(olddata, (err) => {
              if (err) {
                console.error(err);
              } else {
                if (type === "missing") {
                  keepLog(
                    user,
                    "delete/permanent",
                    (err) => {
                      if (err) {
                        console.error(err);
                      }
                      return res.status(200).send({
                        success: true,
                      });
                    },
                    { key: key || null }
                  );
                }
                if (type === "invalid") {
                  keepLog(
                    user,
                    "delete/permanent",
                    (err) => {
                      if (err) {
                        console.error(err);
                      }
                      deleteFile(
                        join(
                          __dirname,
                          "private",
                          ".bin",
                          "files",
                          key + ".json"
                        ),
                        (err) => {
                          if (err) {
                            console.error(err);
                          } else {
                            return res.status(200).send({
                              success: true,
                            });
                          }
                        },
                        key,
                        user,
                        false
                      );
                    },
                    { key: key || null }
                  );
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
                        console.error(err);
                      } else {
                        uolddata.data = uolddata.data.filter(
                          (e) => e.key !== key
                        );
                        callback(uolddata, (err) => {
                          if (err) {
                            console.error(err);
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
                                  console.error(err);
                                } else {
                                  return res.status(200).send({
                                    success: true,
                                  });
                                }
                              },
                              key,
                              user,
                              bin
                            );
                          }
                        });
                      }
                    }
                  );
                }
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
    let { body, devider, username, performer, nameOfCreator } = req.body;
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
              .map((e) => normalizeMediaWikiTitle(e.trim()))
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
          if (
            !(
              new Date(`${oldata.data.start_date} ${oldata.data.start_time}`) <
                new Date() &&
              new Date() <
                new Date(`${oldata.data.end_date} ${oldata.data.end_time}`)
            ) &&
            performer !== "Maruf"
          ) {
            return res.status(200).send({
              message: "Be in the time frame to submit",
              type: "error",
            });
          }
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
                let tasks = [];
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
                        };
                        if (
                          wordcount || //wikitext page section + page info
                          editcount || // user section edit
                          lastcontrib || // user section last contributation date
                          precondition || // same with word count + page info
                          permission || // according to permit, page section + creatorLookOut
                          creationdate || // page section withg permission + creatorLookOut
                          nameOfCreator // page section withg permission + creatorLookOut
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
                                if (nameOfCreator) {
                                  username = data.cdata.creator;
                                  finalobj.sub = username;
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
                                talkpage = "Talk:" + e;
                                tasks.push(talkpage);
                                i++;
                                iloop(i, icallback);
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
                              nameOfCreator,
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
                      // filter satate object in warn, info, error and success catagories
                      let error = Object.values(data.state).filter(
                        (e) => e.result == "error"
                      );
                      let info = Object.values(data.state).filter(
                        (e) => e.result == "info"
                      );
                      let warn = Object.values(data.state).filter(
                        (e) => e.result == "warn"
                      );
                      let success = Object.values(data.state).filter(
                        (e) => e.result == "success"
                      );
                      let lgobj = {};
                      error.length ? (lgobj.error = error) : null;
                      info.length ? (lgobj.info = info.length) : null;
                      warn.length ? (lgobj.warn = warn.length) : null;
                      success.length ? (lgobj.success = success.length) : null;
                      sendTasks(
                        {
                          oauth: udata.user.oauth,
                          titles: tasks,
                          text: oldata.data["windowinp-input16-text1"],
                          place: "prepend",
                          project: oldata.project,
                          user: performer,
                        },
                        (err) => {
                          if (err) {
                            console.error(err);
                          } else {
                            keepKeyLog(
                              data.key,
                              username,
                              "submit",
                              (klerr) => {
                                if (klerr) {
                                  console.error(klerr);
                                }
                                return res.status(200).send(data);
                              },
                              {
                                data: lgobj,
                              }
                            );
                          }
                        }
                      );
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
            let pdata =
              oldata.post.page_list[page] ||
              oldata.post.jurries_list[user][page];
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
                if (oldata.post.page_list[page]) {
                  oldata.post.reviewed++;
                  delete oldata.post.page_list[page];
                }
                oldata.post.jurries_list[user][page] = pdata;
                callback(oldata, (err) => {
                  if (err) {
                    return res.status(200).send({
                      error: err,
                    });
                  } else {
                    let list = Object.keys(oldata.post.page_list);
                    keepKeyLog(
                      key,
                      user,
                      "judge",
                      (klerr) => {
                        return res.status(200).send({
                          message: "Judged successfully!",
                          type: "success",
                          redirect: {
                            url:
                              "/judge?key=" +
                              key +
                              "&page=" +
                              list[Math.floor(list.length * Math.random())] +
                              "&judge=" +
                              user,
                            timer: null,
                            button: "Another Random Page",
                          },
                        });
                      },
                      {
                        name: page,
                        state: jdata.state,
                      }
                    );
                  }
                });
              }
            } else {
              let list = Object.keys(oldata.post.page_list);
              return res.status(200).send({
                message: page + " has been judged already!",
                type: "info",
                redirect: {
                  url:
                    "/judge?key=" +
                    key +
                    "&page=" +
                    list[Math.floor(list.length * Math.random())] +
                    "&judge=" +
                    user,
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
            let count = [];
            pagelist = pagelist.filter((e) => {
              if (page_List[e]) {
                delete page_List[e];
                pagecount--;
                count.push(e);
              } else {
                return e;
              }
            });
            Object.entries(jurriesList).forEach(([key, value]) => {
              pagelist = pagelist.filter((e) => {
                if (value[e]) {
                  delete value[e];
                  pagecount--;
                  count.push(e);
                  reviewed--;
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
                keepKeyLog(
                  mainkey,
                  user,
                  "remove pages",
                  (lerr) => {
                    if (lerr) {
                      // console.error(lerr);
                    }
                    return res.status(200).send({
                      message: "Pages removed successfully!",
                      type: "success",
                    });
                  },
                  {
                    data: count,
                  }
                );
              }
            });
          }
        }
      );
    } else {
      return res.status(200).send({
        message: "No key provided",
        type: "error",
      });
    }
  },
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
                  keepKeyLog(key, user, "comment", (klerr) => {
                    if (klerr) {
                      console.error(klerr);
                    }
                    return res.status(200).send({
                      message:
                        "Message sent successfully. return body: <br>" +
                        JSON.stringify(edata, null, 2),
                      type: "success",
                      redirect: null,
                    });
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
                  participent[sub] = {
                    total: 0,
                    reviewed: 0,
                    marks: 0,
                    wc: 0,
                    length: 0,
                  };
                }
                participent[sub].total++;
                if (stat !== "") {
                  participent[sub].reviewed++;
                  let mark = Number(rdata?.data?.dynamic[stat]?.mark) || 0;
                  if (value.wc && mark > 0) {
                    participent[sub].wc += Number(value.wc) || 0;
                  }
                  if (value.length && mark > 0) {
                    participent[sub].length += Number(value.length) || 0;
                  }
                  participent[sub].marks += mark;
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
                  rdata.data.dynamic,
                  startindex,
                  translation,
                  rdata.project
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
  filter: function (req, res) {
    let key = req.body.key;
    let title = req.body.title || null;
    let submitter = req.body.sub || null;
    let reviewer = req.body.rev || null;
    let startDate = req.body.sd || null;
    let endDate = req.body.ed || null;
    let state = req.body.stat || null;
    if (!key) {
      return res.status(200).send({
        message: "No key provided",
        type: "error",
      });
    } else {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            return res.status(200).send({
              message: JSON.stringify(err, null, 2),
              type: "error",
            });
          } else {
            let filteredData = [];

            if (
              title ||
              submitter ||
              reviewer ||
              state ||
              startDate ||
              endDate
            ) {
              let data = rdata.post.page_list;
              Object.entries(rdata.post.jurries_list).forEach(
                ([okey, value]) => {
                  Object.entries(value).forEach(([key, values]) => {
                    data[key] = values;
                  });
                }
              );
              filteredData = Object.entries(data).filter(([name, info]) => {
                const titleMatch =
                  !title || name.toLowerCase().includes(title.toLowerCase());
                const submitterMatch =
                  !submitter ||
                  info.sub.toLowerCase().includes(submitter.toLowerCase());
                const reviewerMatch =
                  !reviewer ||
                  info.rev.toLowerCase().includes(reviewer.toLowerCase());
                const dateMatch =
                  (!startDate || info.sd >= new Date(startDate).getTime()) &&
                  (!endDate || info.sd <= new Date(endDate).getTime());
                const stateMatch =
                  !state ||
                  state === "all" ||
                  info.stat === state ||
                  (state === "none" && info.stat === "") ||
                  (state === "locked" &&
                    info?.lock &&
                    info?.lock?.length > 0 &&
                    info.stat.length < 1);
                return (
                  titleMatch &&
                  submitterMatch &&
                  reviewerMatch &&
                  dateMatch &&
                  stateMatch
                );
              });
            }
            return res.status(200).send(filteredData);
          }
        }
      );
    }
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
        let tableString = wikitable(data.table.main.data);
        let judgeString = "";
        let detailes = "";
        if (data.table.judge) {
          judgeString = "\n\n" + wikitable(data.table.judge.data);
        }
        if (data.table.participent) {
          detailes = "\n\n" + wikitable(data.table.participent.data);
        }
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
                  title: data.table.main.result,
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
                    editPage(
                      udata.user.oauth,
                      data.project,
                      {
                        title: data.table?.judge?.result || null,
                        text: judgeString,
                        place: "append",
                      },
                      (err, edata) => {
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
                              title: data.table?.judge?.result || null,
                              text: detailes,
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
                                  join(
                                    __dirname,
                                    "private",
                                    "db",
                                    "files",
                                    key + ".json"
                                  ),
                                  (err, rdata, callback) => {
                                    if (err) {
                                      return res.status(200).send({
                                        message: JSON.stringify(err, null, 2),
                                        type: "error",
                                      });
                                    } else {
                                      rdata.data.resultPages = {
                                        main: data.table.main.result,
                                        judge:
                                          data.table?.judge?.result || null,
                                        participent:
                                          data.table?.participent?.result ||
                                          null,
                                      };
                                      rdata.result = {
                                        date: new Date().toISOString(),
                                        user: user,
                                        table: data.table.main.data.replace(
                                          /"/g,
                                          "'"
                                        ),
                                        project: data.project,
                                        count: rdata.post.pagecount,
                                        reviewed:
                                          rdata.post.pagecount -
                                          Object.keys(rdata.post.page_list)
                                            .length,
                                        isAotuReviewed:
                                          rdata.data?.autoReviewed || false,
                                      };
                                      delete rdata.post;
                                      callback(rdata, (err) => {
                                        if (err) {
                                          return res.status(200).send({
                                            message: JSON.stringify(
                                              err,
                                              null,
                                              2
                                            ),
                                            type: "error",
                                          });
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
                                                return res.status(200).send({
                                                  message: JSON.stringify(
                                                    err,
                                                    null,
                                                    2
                                                  ),
                                                  type: "error",
                                                });
                                              } else {
                                                updateFile(
                                                  join(
                                                    __dirname,
                                                    "private",
                                                    "querylist.json"
                                                  ),
                                                  (err, rdata, callback) => {
                                                    if (err) {
                                                      return res
                                                        .status(200)
                                                        .send({
                                                          message:
                                                            JSON.stringify(
                                                              err,
                                                              null,
                                                              2
                                                            ),
                                                          type: "error",
                                                        });
                                                    } else {
                                                      delete rdata.key[key];
                                                      callback(rdata, (err) => {
                                                        if (err) {
                                                          return res
                                                            .status(200)
                                                            .send({
                                                              message:
                                                                JSON.stringify(
                                                                  err,
                                                                  null,
                                                                  2
                                                                ),
                                                              type: "error",
                                                            });
                                                        } else {
                                                          return res
                                                            .status(200)
                                                            .send({
                                                              message:
                                                                "Result has been submited successfully!",
                                                              type: "success",
                                                              redirect: {
                                                                url:
                                                                  "/editathon?key=" +
                                                                  key,
                                                                timer: 5,
                                                              },
                                                            });
                                                        }
                                                      });
                                                    }
                                                  }
                                                );
                                              }
                                            },
                                            key,
                                            user,
                                            true
                                          );
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
            if (!rawData[e]?.project) return false;
            if (langcode == "*") return true;
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
        if (langcode == "*") {
          return res.status(200).send({ asAdmin: false, html: html });
        } else {
          isAdmin(user, langcode, (err, asAdmin) => {
            if (err) {
              console.error(err);
              return res.status(200).send({ asAdmin: false, html: html });
            } else {
              return res.status(200).send({ asAdmin, html: html });
            }
          });
        }
      }
    });
  },
  pagelock: function (req, res) {
    let key = req.body.key;
    let user = req.body.user;
    let page = req.body.page;
    let type = req.body.type || "lock";
    if (key && user && page) {
      updateFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata, callback) => {
          if (err) {
            return res.status(200).send({
              message: JSON.stringify(err, null, 2),
              type: "error",
            });
          } else {
            if (rdata.post.page_list[page]) {
              if (type == "unlock") {
                rdata.post.page_list[page].lock = false;
              } else {
                rdata.post.page_list[page].lock = user;
              }
              callback(rdata, (err) => {
                if (err) {
                  return res.status(200).send({
                    message: JSON.stringify(err, null, 2),
                    type: "error",
                  });
                } else {
                  keepKeyLog(
                    key,
                    user,
                    "pagelock",
                    (lerr) => {
                      if (lerr) {
                        console.error(lerr);
                      }
                      console.timeEnd("pagelock");
                      return res.status(200).send({
                        message:
                          type == "lock"
                            ? `<b>${page}</b> is locked to you. Only you can judge it now.`
                            : `<b>${page}</b> is unlocked. Anyone can judge it now.`,
                        type: "success",
                        redirect: {
                          url:
                            "/judge?key=" +
                            key +
                            "&page=" +
                            page +
                            "&judge=" +
                            encodeURIComponent(user),
                          timer: 3,
                        },
                      });
                    },
                    {
                      page: page,
                      type: type,
                    }
                  );
                }
              });
            }
          }
        }
      );
    } else {
      return res.status(200).send({
        message: "Missing key, user or page",
        type: "error",
      });
    }
  },
  autoReview: function (req, res) {
    let { pagelist, demoReviewer, key, user } = req.body;
    if (key && user && pagelist) {
      updateFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata, callback) => {
          if (err) {
            return res.status(200).send({
              message: JSON.stringify(err, null, 2),
              type: "error",
            });
          } else {
            let pages = pagelist.split(",");
            pages.forEach((page) => {
              if (rdata.post.page_list[page]) {
                rdata.post.page_list[page].rev = demoReviewer;
                rdata.post.page_list[page].stat = "autoReviewed";
              }
            });
            callback(rdata, (err) => {
              if (err) {
                return res.status(200).send({
                  message: JSON.stringify(err, null, 2),
                  type: "error",
                });
              } else {
                keepKeyLog(
                  key,
                  user,
                  "autoReview",
                  (lerr) => {
                    if (lerr) {
                      console.error(lerr);
                    }
                    return res.status(200).send({
                      message:
                        "<b>" +
                        pages.length +
                        "</b> pages are auto reviewed successfully.",
                      type: "success",
                      redirect: null,
                    });
                  },
                  { page: pages.join(","), type: "autoReview" }
                );
              }
            });
          }
        }
      );
    } else {
      return res.status(200).send({
        message: "Missing key, user or page",
        type: "error",
      });
    }
  },
};
function removeCircularReferences(obj) {
  const seen = new WeakSet();

  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return; // Omit circular reference
      }
      seen.add(value);
    }
    return value;
  });
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
function normalizeMediaWikiTitle(rawTitle) {
  if (typeof rawTitle !== "string") return null;
  // 1. Replace underscores with spaces
  let title = rawTitle.replace(/_/g, " ");
  // 2. Trim leading and trailing whitespace
  title = title.trim();
  // 3. Collapse multiple internal whitespace characters
  title = title.replace(/\s+/g, " ");
  // 4. Normalize to Unicode NFC
  title = title.normalize("NFC");
  // 5. encode URI and decode it again to remove any special characters
  title = decodeURIComponent(encodeURIComponent(title));
  // 6. Check for illegal characters (based on MediaWiki's blacklist)
  if (/[#<>[\]|{}]/.test(title)) {
    return null; // Invalid title
  }
  return title;
}
function sendTasks(task, callback, type = "task") {
  if (task) {
    request.post(
      {
        url:
          "https://checkmatebata.com/api/task" /*  "http://localhost:8000/api/" */ +
          type,
        json: true,
        body: task,
        headers: {
          "x-totp": totp(),
        },
      },
      (err, res, body) => {
        if (err) {
          return callback(err);
        }
        if (res.statusCode !== 200) {
          return callback(new Error("Failed to send task"));
        }
        return callback(null, body);
      }
    );
  } else {
    return callback("Task not found");
  }
}
/* send all files saved in ./private/db/files when server is not busy and in every 15 minutes */
sendFiles = function (callback) {
  readFile(join(__dirname, "private", "querylist.json"), (err, rdata) => {
    if (err) {
      console.error("Error reading query list:", err);
      return callback(err);
    }
    let keys = Object.keys(rdata.key);
    if (keys.length === 0) {
      //console.log("No files to send.");
      return callback(null, "No files to send.");
    } else {
      console.log("Sending files:", keys);
      function Iloop(i) {
        if (i >= keys.length) {
          return callback(null, "All files sent successfully.");
        } else {
          let key = keys[i];
          readFile(
            join(__dirname, "private", "db", "files", key + ".json"),
            (err, data) => {
              if (err) {
                console.error(`Error reading file ${key}:`, err);
                return Iloop(i + 1);
              } else {
                stat(filePath, (err, stats) => {
                  if (err) {
                    console.error(`Error stating file ${key}:`, err);
                    return Iloop(i + 1);
                  }

                  const now = Date.now();
                  const modifiedTime = stats.mtimeMs;
                  const fifteenMinutes = 15 * 60 * 1000;
                  if (now - modifiedTime > fifteenMinutes) {
                    // Skip file not modified recently
                    return Iloop(i + 1);
                  }
                  try {
                    sendTasks(
                      {
                        key: key,
                        data: removeCircularReferences(data),
                      },
                      (err, response) => {
                        if (err) {
                          console.error(`Error sending file ${key}:`, err);
                        } else {
                          // console.log(`File ${key} sent successfully:`, response);
                        }
                      },
                      "backup"
                    );
                  } catch (parseErr) {
                    console.error(`Error parsing file ${key}:`, parseErr);
                  }
                  Iloop(i + 1);
                });
              }
            }
          );
        }
      }
    }
    Iloop(0);
  });
};

//now loop every 15 minutes
setInterval(() => {
  console.log("Checking for files to send...");
  sendFiles((err, message) => {
    if (err) {
      console.error("Error sending files:", err);
    } else {
      console.log(message);
    }
  });
}, 15 * 60 * 1000); // 15 minutes in milliseconds
