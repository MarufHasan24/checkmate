// dependencies
require("dotenv").config();
const CONFIG = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  algorithm: process.env.ALGORITHM,
  key: process.env.KEY,
  admin: process.env.ADMIN.split(","),
  creator: process.env.CREATOR,
};
const passport = require("passport");
// lib
const {
  uriDecript,
  updateFile,
  writeFileOwn,
  readFile,
  stat,
  join,
  keepLog,
  logTableKey,
  logTable,
  readDirOwn,
} = require("./public/lib/node.js");
const { getWikitext } = require("./public/lib/mwiki.js");
// Routes to handle GET requests
module.exports = {
  index: function (req, res) {
    //get data from cookie and session
    const user =
      (req && req.session && req.session.user) ||
      (req.cookies && req.cookies?.user ? JSON.parse(req.cookies.user) : null);
    readDirOwn(join(__dirname, "private", ".bin", "files"), (err, dirdata) => {
      if (err) {
        //console.error(err);
        return res.render("error.ejs", {
          status: 500,
          error: "Error reading data",
          redirect: null,
        });
      } else {
        //dirData is an array of file's data, we need to map it to get the data structure
        let oldHtml = dirdata
          .map((obj) => {
            return `<tr>
            <td colspan="3">
                <div class="patrol-entry">
                    <div class="top">
                        <a href="/editathon?key=${obj.key}">${obj.name}</a>
                    </div>
                    <div class="details">Date: ${new Date(
                      obj.date
                    ).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "2-digit",
                      year: "numeric",
                      month: "2-digit",
                    })} | Project: <a href="https://${obj.project}.org/">${
              obj.project
            }.org</a></div>
                </div>
            </td>
        </tr>`;
          })
          .join("");
        readFile(join(__dirname, "private", "querylist.json"), (err, data) => {
          if (err) {
            //console.error(err);
            return res.render("error.ejs", {
              status: 500,
              error: "Error reading data",
              redirect: null,
            });
          } else {
            /* Make a quick list of queries */
            data = data.key;
            let keys = Object.keys(data);
            /* First sort keys according to the date
             * then if hosted day is same, sort according to the key
             * then hosted day is 6 months old then remove it from the list
             */
            keys.sort((a, b) => {
              if (data[a].date < data[b].date) return 1;
              if (data[a].date > data[b].date) return -1;
              if (a < b) return -1;
              if (a > b) return 1;
              return 0;
            });

            let html = keys
              .map(
                (key) => `<tr>
                                <td colspan="3">
                                    <div class="patrol-entry">
                                        <div class="top">
                                            <a href="/editathon?key=${key}">${data[key].name}</a>
                                        </div>
                                        <div class="bottom">
                                            <span>Host: <a href="/query?host=${data[key].host}">${data[key].host}</a></span> |
                                            <span>Project: <a href="https://${data[key].project}.org/">${data[key].project}</a></span>
                                        </div>
                                    </div>
                                </td>
                            </tr>`
              )
              .join("");

            res.render("index.ejs", {
              url: req.baseUrl,
              user: JSON.stringify(user),
              html: html,
              oldHtml: oldHtml,
            });
          }
        });
      }
    });
  },
  login: function (req, res) {
    //console.log("login:", req.query?.callback);
    if (req.query?.callback) {
      req.session.callback = req.query?.callback || "";
    }
    res.redirect(req.baseUrl + "/oauth-callback");
  },
  oauth: function (req, res, next) {
    /* passport.authenticate("mediawiki", function (err, usr) {
      if (err) {
        return next(err);
      }
      if (!usr) {
        return res.redirect(req.baseUrl + "/login");
      }
      req.logIn(usr, function (err) {
        if (err) {
          return next(err);
        } else {
          delete usr._raw;
          let temp = usr._json;
          delete usr._json;
          let user = { ...temp, ...usr };
          /* Start  */
    let usr = require("./private/data.json");
    delete usr._raw;
    let temp = { ...usr._json };
    delete usr._json;
    let user = { ...temp, ...usr };
    /* End */
    const filePath = join(
      __dirname,
      "private",
      "user",
      `usr-${encodeURIComponent(user.username)}.json`
    );
    stat(filePath, (err, stats) => {
      if (err) {
        keepLog(
          user.username,
          "create user",
          (lerr) => {
            if (lerr) {
              //console.error(lerr);
            }
            writeFileOwn(filePath, JSON.stringify(user), (err) => {
              if (err) {
                //console.error(err);
              }
              res.cookie("user", JSON.stringify(user), {
                maxAge: 60 * 60 * 24 * 7, // 1 week
                httpOnly: true,
              });
              req.session.user = user;
              res.redirect(req.baseUrl + "/");
            });
          },
          {
            ip:
              req.headers["x-forwarded-for"] ||
              req.ip ||
              req.headers["x-client-ip"] ||
              req.socket.remoteAddress ||
              null,
          }
        );
      } else {
        keepLog(
          user.username,
          "login" + (req.session?.callback ? "/" + req.session.callback : ""),
          (lerr) => {
            if (lerr) {
              //console.error(lerr);
            }
            updateFile(filePath, (err, data, callback) => {
              if (err) {
                //console.error(err);
              } else {
                data.user = user;
                data.lastModified = new Date().toISOString();
                callback(data, (err) => {
                  if (err) {
                    //console.error(err);
                  } else {
                    res.cookie("user", JSON.stringify(user), {
                      maxAge: 60 * 60 * 24 * 7, // 1 week
                      httpOnly: true,
                    });
                    req.session.user = user;
                    return res.render("callback.ejs", {
                      user,
                      jsonuser: JSON.stringify(user),
                      url: encodeURIComponent(req.session?.callback || ""),
                    });
                  }
                });
              }
            });
          },
          {
            ...stats,
            ip:
              req.headers["x-forwarded-for"] ||
              req.ip ||
              req.headers["x-client-ip"] ||
              req.socket.remoteAddress ||
              null,
          }
        );
      }
    });
    /* }
      });
    })(req, res, next); */
  },
  template: function (req, res) {
    if (req.query && req.query.data) {
      let obj = uriDecript(req.query.data);
      //console.log(obj);
      if (obj) {
        if (obj.expire > Date.now()) {
          readFile(
            join(__dirname, "private", "db", "templates", obj.template.file),
            (err, data) => {
              if (err) {
                //console.error(err);
              } else {
                res.render("template.ejs", {
                  data: data,
                  url: req.baseUrl + "/template",
                  obj: obj,
                  jsonobj: JSON.stringify(obj),
                });
              }
            }
          );
        } else {
          //do nothing
          res.render("error.ejs", {
            status: 400,
            error:
              "key is expired already. If you want to change something, please proceed to dashboard.",
            redirect: {
              url: "/dashboard?key=" + obj.key,
              name: "Go to dashboard",
            },
          });
        }
      } else {
        res.render("error.ejs", {
          status: 400,
          error: "Invalid query",
          redirect: null,
        });
      }
    } else {
      res.render("error.ejs", {
        status: 400,
        error: "Missing params",
        redirect: null,
      });
    }
  },
  query: function (req, res) {
    const host = decodeURIComponent(req.query.host || "");
    const name = decodeURIComponent(req.query.name || "");
    const project = req.query?.project;
    const mkey = req.query?.key;
    readFile(
      join(__dirname, "private", "querylist.json"),
      (err, parsedData) => {
        if (err) {
          //console.error(err);
          return res.render("error.ejs", {
            status: 500,
            error: "Error reading data",
            redirect: null,
          });
        }
        let Data = { name: [], key: [], host: [], date: [], project: [] };
        // Otherwise, filter based on other parameters
        const keys = Object.entries(parsedData.key);
        keys.forEach(([key, keyobj]) => {
          const matchesHost = host ? keyobj.host === host : true;
          const matcheskey = mkey ? key.includes(mkey) : true;
          let matchesName = true;
          name
            ? name
                .toLowerCase()
                .split(" ")
                .forEach((n) => {
                  matchesName =
                    matchesName && keyobj.name.toLowerCase().includes(n);
                })
            : true;

          const matchesProject = project ? keyobj.project === project : true;
          if (matchesHost && matchesName && matchesProject && matcheskey) {
            Data.key.push(key);
            Data.name.push(keyobj.name);
            Data.host.push(keyobj.host);
            Data.project.push(keyobj.project);
            Data.date.push(keyobj.date.split("T")[0]);
          }
        });
        const html = Data.key
          .map(
            (_, i) => `<tr>
        <td data-label='Name'>${Data.name[i]}</td>
        <td data-label='Key'><a href='${"/editathon?key=" + Data.key[i]}'>${
              Data.key[i]
            }</a></td>
        <td data-label='Date'>${Data.date[i]}</td>
        <td data-label='Project'><a href='https://${Data.project[i]}.org/'>${
              Data.project[i]
            }</a></td>
        <td data-label='Host'><a href='/query?host=${encodeURIComponent(
          Data.host[i]
        )}'>${Data.host[i]}</a></td>
      </tr>`
          )
          .join("");

        res.render("list.ejs", {
          html,
          data: { key: mkey, project, host, name },
        });
      }
    );
  },
  dashboard: function (req, res) {
    let key = (req && req?.query && req?.query?.key) || null;
    let pass = (req && req?.query && req?.query?.pass) || null;
    if (!key) {
      res.render("dashboard.ejs", {
        key: key,
        data: null,
        pass: pass,
        jsondata: JSON.stringify(null),
      });
    } else {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            res.render("error.ejs", {
              status: 403,
              error:
                "Maybe you can find a proper explanation in the editathon page.",
              redirect: {
                url: "/editathon?key=" + key,
                name: "Editathon",
              },
              deletable: false,
            });
          } else {
            if (Object.keys(rdata.data).length) {
              if (!rdata?.post) {
                if (rdata.result) {
                  res.redirect("/result?key=" + key + "&type=view");
                } else {
                  res.render("error.ejs", {
                    status: 403,
                    error:
                      "Maybe you can find a proper explanation in the editathon page.",
                    redirect: {
                      url: "/editathon?key=" + key,
                      name: "Editathon",
                    },
                    deletable: false,
                  });
                }
              } else {
                /* res.cookie(
              "tempdata",
              { ...data, key, pass },
              { maxAge: 60 * 20, httpOnly: true }
            ); */
                let sdata = {
                  ...rdata.data,
                  pagecount: rdata.post.pagecount,
                  usercount: rdata.post.usercount,
                  reviewed: rdata.post.reviewed,
                  jurries_list: rdata.post.jurries_list,
                  key: rdata.key,
                  host: rdata.host,
                  adminList: CONFIG.admin,
                };
                let wastranslation = req.session?.trans;
                req.cookies && req.cookies.trans
                  ? (req.session.trans = JSON.parse(req.cookies.trans))
                  : null;
                getTranslation(
                  req.session,
                  rdata.data.langcode,
                  (terr, trns) => {
                    if (terr) {
                      //console.error(terr);
                    } else {
                      if (!wastranslation) {
                        res.cookie(
                          "trans",
                          JSON.stringify(req.session?.trans),
                          {
                            maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
                            httpOnly: true,
                          }
                        );
                      }
                    }
                    //console.log(rdata.post.jurries_list);
                    res.render("dashboard.ejs", {
                      key: key,
                      pass: pass,
                      checkpass: rdata.pass,
                      data: sdata,
                      trns: trns,
                      jsondata: JSON.stringify({
                        ...sdata,
                        trns: encodeURIComponent(JSON.stringify(trns)),
                      }),
                    });
                  }
                );
              }
            } else {
              res.render("error.ejs", {
                status: 400,
                error: "Invalid File.",
                redirect: null,
                deletable: { key, type: "invalid" },
              });
            }
          }
        }
      );
    }
  },
  logout: function (req, res) {
    let callback = req.query?.callback;
    keepLog(
      req.query.username,
      "logout",
      (lerr) => {
        if (lerr) {
          //console.error(lerr);
        }
        delete req.session.user;
        res.clearCookie("user");
        res
          .status(200)
          .redirect("/" + (callback ? decodeURIComponent(callback) : ""));
      },
      {
        ip:
          req.headers["x-forwarded-for"] ||
          req.ip ||
          req.headers["x-client-ip"] ||
          req.socket.remoteAddress ||
          null,
      }
    );
  },
  editathon: function (req, res) {
    let key = req.query.key;
    if (!key) {
      res.render("editathon.ejs", {
        key: null,
        data: null,
        jsondata: JSON.stringify(null),
      });
    } else {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            readFile(
              join(__dirname, "private", ".bin", "files", key + ".json"),
              (err, rdata) => {
                if (err) {
                  return res.render("error.ejs", {
                    status: 400,
                    error: "File not found!",
                    redirect: null,
                    adminList: CONFIG.admin.join(","),
                    deletable: { key, type: "missing" },
                  });
                } else {
                  let sdata = {
                    resultPage: rdata.data.resultPages,
                    ...rdata.data,
                    result: rdata.result,
                    key: rdata.key,
                    host: rdata.host,
                    date: rdata.date,
                    name: rdata.name,
                    project: rdata.project,
                    host: rdata.host,
                    adminList: CONFIG.admin,
                  };
                  if (rdata.result) {
                    res.render("showResult.ejs", {
                      key,
                      data: sdata,
                      jsondata: JSON.stringify(sdata),
                      adminList: CONFIG.admin.join(","),
                      result: true,
                      trns: null,
                    });
                  } else if (
                    Object.keys(rdata?.post).length == 0 ||
                    Object.keys(rdata?.data).length == 0
                  ) {
                    res.render("error.ejs", {
                      status: 400,
                      error: "Deleted invalid File.",
                      redirect: null,
                      deletable: { key, type: "invalid" },
                    });
                  } else {
                    res.render("error.ejs", {
                      status: 403,
                      error: "Unexpected error.",
                      redirect: null,
                      deletable: false,
                    });
                  }
                }
              }
            );
          } else {
            if (
              Object.keys(rdata?.post).length == 0 ||
              Object.keys(rdata?.data).length == 0
            ) {
              console.error("Invalid file", rdata);
              res.render("error.ejs", {
                status: 400,
                error: "Invalid File.",
                redirect: null,
                deletable: { key, type: "invalid" },
              });
            } else {
              let sdata = {
                ...rdata.data,
                pagecount: rdata.post.pagecount,
                usercount: rdata.post.usercount,
                reviewed: rdata.post.reviewed,
                jurries_list: rdata.post.jurries_list,
                key: rdata.key,
                host: rdata.host,
                adminList: CONFIG.admin,
              };
              getTranslation(req.session, rdata.data.langcode, (terr, trns) => {
                res.render("editathon.ejs", {
                  key,
                  trns: trns,
                  data: sdata,
                  jsondata: JSON.stringify({
                    ...sdata,
                    trns: encodeURIComponent(JSON.stringify(trns)),
                  }),
                });
              });
            }
          }
        }
      );
    }
  },
  editathonLog: function (req, res) {
    let key = req.query.key;
    if (!key) {
      readDirOwn(
        join(__dirname, "private", "db", "log"),
        (err, dirdata, files) => {
          if (err) {
            //console.error(err);
            return res.render("error.ejs", {
              status: 500,
              error: "Error reading data",
              redirect: null,
              deletable: false,
            });
          } else {
            let html =
              "<table>" +
              files
                .map((obj) => {
                  obj = obj.replace(".json", "");
                  return `<tr>
            <td colspan="3">
                <div class="patrol-entry">
                    <div class="top">
                        <a href="/editathon/log?key=${obj}">${obj}</a>
                    </div>
                    </div>
            </td>
        </tr>`;
                })
                .join("") +
              "</table>";
            res.render("editathonLog.ejs", {
              key: null,
              data: null,
              html: null,
              list: html,
              jsondata: JSON.stringify(null),
            });
          }
        },
        false
      );
    } else {
      readFile(
        join(__dirname, "private", "db", "log", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            return res.render("error.ejs", {
              status: 404,
              error: "File not found!",
              redirect: null,
              deletable: false,
            });
          } else {
            res.render("editathonLog.ejs", {
              key,
              data: rdata,
              html: logTableKey(rdata),
              list: null,
              jsondata: JSON.stringify(rdata),
            });
          }
        }
      );
    }
  },
  submit: function (req, res) {
    const key = req.query?.key || null;
    if (key) {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            res.render("error.ejs", {
              status: 400,
              error: "File not found!",
              redirect: null,
            });
          } else {
            res.render("submit.ejs", {
              key: key,
              data: rdata.data,
              jsondata: JSON.stringify(rdata.data),
              user: req.session?.user?.displayName || "",
            });
          }
        }
      );
    } else {
      res.render("submit.ejs", { user: null, key: key, data: null });
    }
  },
  judge: function (req, res) {
    const key = req.query?.key || null;
    const user =
      req?.query?.judge ||
      req?.session?.user?.displayName ||
      req?.cookies?.user?.displayName ||
      null;
    if (key && user) {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            res.render("error.ejs", {
              status: 400,
              error: "File not found!",
              redirect: null,
            });
          } else {
            if (user && !rdata.data.jurries.split(",").includes(user)) {
              res.render("error.ejs", {
                status: 403,
                error:
                  "You are not allowed to judge this page. Please contact the host.",
                redirect: {
                  url: "/editathon?key=" + key,
                  name: "Editathon",
                },
                deletable: false,
              });
            } else {
              let pagelist = rdata.post.page_list;
              let list = Object.keys(pagelist);
              let temp = [...list];
              for (let i = temp.length - 1; i >= 0; i--) {
                if (pagelist[temp[i]].sub == user) {
                  list.splice(i, 1);
                }
              }
              const page =
                req?.query?.page ||
                list[Math.floor(list.length * Math.random())];
              if (!req.query?.page) {
                res.redirect(
                  "/judge?key=" +
                    key +
                    "&page=" +
                    list[Math.floor(list.length * Math.random())] +
                    "&judge=" +
                    user
                );
              } else {
                if (list.length) {
                  if (
                    !list.includes(page) &&
                    !Object.keys(rdata.post.jurries_list[user]).includes(page)
                  ) {
                    res.render("error.ejs", {
                      status: 400,
                      error:
                        page +
                        " is not in the waiting list. May be it's already judged by someone.",
                      redirect: {
                        url:
                          "/judge?key=" +
                          key +
                          "&page=" +
                          list[Math.floor(list.length * Math.random())],
                        name: "Judge another page",
                      },
                      deletable: false,
                    });
                  } else {
                    getWikitext(
                      page,
                      rdata.data.base_component,
                      (error, wikidata) => {
                        if (error) {
                          res.render("error.ejs", {
                            status: 400,
                            error:
                              page + "<br>" + error.code + " : " + error.info,
                            redirect: {
                              url:
                                "/judge?key=" +
                                key +
                                "&page=" +
                                list[Math.floor(list.length * Math.random())],
                              name: "Judge another page",
                            },
                          });
                        } else {
                          let dsobj = {};
                          if (
                            Object.keys(rdata.post.jurries_list[user]).includes(
                              page
                            )
                          ) {
                            dsobj = rdata.post.jurries_list[user][page];
                          } else {
                            dsobj = pagelist[page];
                          }
                          res.render("judge.ejs", {
                            key: key,
                            user: user || null,
                            pagelist: list,
                            page: page,
                            jurries: rdata.data.jurries,
                            html: wikidata.text,
                            isLocked: dsobj?.lock,
                            pagedata: {
                              creator: wikidata.creator,
                              creation: wikidata.creation,
                              ...dsobj,
                            },
                            data: {
                              judge: user,
                              project: rdata.data.base_component,
                              opts: rdata.data.dynamic,
                            },
                            jsondata: JSON.stringify({
                              project: rdata.data.base_component,
                              opts: rdata.data.dynamic,
                              jurries: rdata.data.jurries.split(","),
                              key,
                              pagelist: list,
                              page,
                              template: rdata.data.feedback_template,
                              creator: wikidata.creator,
                              stat: dsobj?.stat || "",
                              submitter: dsobj.sub,
                              isLocked: dsobj?.lock || false,
                            }),
                          });
                        }
                      }
                    );
                  }
                } else {
                  if (temp.length) {
                    res.render("message.ejs", {
                      message: "you are the only left submittor here!",
                      type: "info",
                      redirect: {
                        url: "/editathon?key=" + key,
                        timer: null,
                        button: "Editathon",
                      },
                    });
                  } else {
                    res.render("message.ejs", {
                      message: "Their is no page to judge here!",
                      type: "info",
                      redirect: {
                        url: "/editathon?key=" + key,
                        timer: null,
                        button: "Editathon",
                      },
                    });
                  }
                }
              }
            }
          }
        }
      );
    } else {
      if (!key) {
        res.render("error.ejs", {
          status: 400,
          error: "Missing params",
          redirect: null,
        });
      } else if (!user) {
        res.render("judge.ejs", {
          key: key,
          user: null,
          pagelist: null,
          page: req?.query?.page || null,
          jurries: null,
          html: null,
          isLocked: false,
          pagedata: null,
          data: null,
          jsondata: JSON.stringify(null),
        });
      }
    }
  },
  remove: function (req, res) {
    let key = req.query.key;
    if (!key) {
      res.render("deletePage.ejs", {
        key: null,
        data: null,
        jsondata: JSON.stringify(null),
      });
    } else {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            //console.error(err);
            return res.render("error.ejs", {
              status: 400,
              error: "File not found!",
              redirect: null,
            });
          } else {
            if (!rdata?.post) {
              if (rdata.result) {
                res.redirect("/result?key=" + key + "&type=view");
              } else {
                res.render("error.ejs", {
                  status: 400,
                  error: JSON.stringify(rdata, null, 2),
                  redirect: null,
                });
              }
            } else {
              let sdata = rdata.data;
              let wastranslation = req.session?.trans;
              req.cookies && req.cookies.trans
                ? (req.session.trans = JSON.parse(req.cookies.trans))
                : null;
              getTranslation(req.session, rdata.data.langcode, (terr, trns) => {
                if (terr) {
                  //console.error(terr);
                } else {
                  if (!wastranslation) {
                    res.cookie("trans", JSON.stringify(req.session?.trans), {
                      maxAge: 60 * 60 * 1000 * 24 * 30, // 30 days
                      httpOnly: true,
                    });
                  }
                }
                res.render("deletePage.ejs", {
                  key,
                  trns: trns,
                  data: sdata,
                  jsondata: JSON.stringify({
                    ...sdata,
                    trns: encodeURIComponent(JSON.stringify(trns)),
                  }),
                });
              });
            }
          }
        }
      );
    }
  },
  result: function (req, res) {
    let key = (req && req.query && req.query.key) || null;
    if (!key) {
      res.render("result.ejs", {
        key: key,
        data: null,
        jsondata: JSON.stringify(null),
      });
    } else {
      readFile(
        join(__dirname, "private", "db", "files", key + ".json"),
        (err, rdata) => {
          if (err) {
            console.error(err);
            res.render("error.ejs", {
              status: 403,
              error:
                "Maybe you can find a proper explanation in the editathon page.",
              redirect: {
                url: "/editathon?key=" + key,
                name: "Editathon",
              },
              deletable: false,
            });
          } else {
            req.cookies && req.cookies.user
              ? (req.session.user = JSON.parse(req.cookies.user))
              : null;
            if (req.session.user) {
              let participent = {};
              //marge rdata.post.page_list and rdata.data.jurries_list in page_list
              Object.entries(rdata.post.page_list).forEach(([okey, value]) => {
                let sub = value.sub;
                if (!participent[sub]) {
                  participent[sub] = {};
                }
                participent[sub][okey] = value;
              });
              Object.entries(rdata.post.jurries_list).forEach(
                ([okey, value]) => {
                  Object.entries(value).forEach(([key, values]) => {
                    let sub = values.sub;
                    if (!participent[sub]) {
                      participent[sub] = {};
                    }
                    participent[sub][key] = values;
                  });
                }
              );
              let sdata = {
                pagecount: rdata.post.pagecount,
                usercount: rdata.post.usercount,
                reviewed: rdata.post.reviewed,
                key: rdata.key,
                host: rdata.host,
                project: rdata.project,
                result: rdata.data.result,
                reaminingTime:
                  Date.parse(
                    rdata.data["end_date"] + " " + rdata.data["end_time"]
                  ) - Date.now(),
              };
              res.render("result.ejs", {
                key: key,
                data: sdata,
                jsondata: JSON.stringify({
                  jlist: rdata.post.jurries_list,
                  dynamic: rdata.data.dynamic,
                  participent: participent,
                  user: req.session.user.displayName,
                  project: rdata.project,
                }),
              });
            } else {
              res.redirect("/login?callback=result%3Fkey%3D" + key);
            }
          }
        }
      );
    }
  },
  error: function (req, res) {
    if (req.query) {
      res.render("error.ejs", {
        status: req.query.status || 400,
        error: req.query.error || "Error",
        redirect: req.query.redirect || null,
        deletable: req.query.deletable || null,
      });
    } else {
      res.render("error.ejs", {
        status: 400,
        error: "Error",
        redirect: null,
        deletable: null,
      });
    }
  },
  // admin
  admin: {
    index: function (req, res) {
      let { m, y } = req.query;
      let date = new Date();
      const logFile = join(
        __dirname,
        "private",
        "log",
        `log-${y || date.getFullYear()}-${m || date.getMonth() + 1}.json`
      );
      req.cookies && req.cookies?.user
        ? (req.session.user = JSON.parse(req.cookies.user))
        : null;
      if (req.session.user) {
        if (CONFIG.admin.includes(req.session.user.displayName)) {
          readFile(logFile, (err, data) => {
            if (err) {
              res.render("admin.ejs", {
                html: "<h2></h2>",
                data: JSON.stringify({
                  message: "No log in This month yet!",
                  redirect: {
                    url: "/admin",
                    button: "Current month",
                  },
                }),
                isCreator: CONFIG.creator == req.session.user.displayName,
                isAdmin: false,
              });
            } else {
              res.render("admin.ejs", {
                data: JSON.stringify(data),
                isCreator: CONFIG.creator == req.session.user.displayName,
                isAdmin: true,
              });
            }
          });
        } else {
          res.redirect("/");
        }
      } else {
        res.redirect("/login?callback=admin");
      }
    },
    //sub set of admin
    log: function (req, res) {
      let { m, y } = req.query;
      let date = new Date();
      const logFile = join(
        __dirname,
        "private",
        "log",
        `log-${y || date.getFullYear()}-${m || date.getMonth() + 1}.json`
      );
      req.cookies && req.cookies?.user
        ? (req.session.user = JSON.parse(req.cookies.user))
        : null;
      if (req.session.user) {
        if (CONFIG.admin.includes(req.session.user.displayName)) {
          readFile(logFile, (err, data) => {
            if (err) {
              res.render("admin.log.ejs", {
                html: "<h2>No log in This month yet!</h2>",
              });
            } else {
              res.render("admin.log.ejs", { html: logTable(data) });
            }
          });
        } else {
          return res.render("admin.ejs", {
            isAdmin: false,
            data: JSON.stringify({
              message:
                "As you are not a member of admin panel, you are not alowed to be here!",
              redirect: {
                url: "/",
                timer: 7,
              },
            }),
          });
        }
      } else {
        res.redirect("/login?callback=admin");
      }
    },
    permit: function (req, res) {
      const reqdir = join(__dirname, "private", "log", "request");
      req.cookies && req.cookies?.user
        ? (req.session.user = JSON.parse(req.cookies.user))
        : null;
      if (req.session.user) {
        if (CONFIG.admin.includes(req.session.user.displayName)) {
          readDirOwn(reqdir, (err, data) => {
            if (err && err.length) {
              for (i in err) {
                return res.render("error.ejs", {
                  status: 400,
                  error: JSON.stringify(err[i], null, 2),
                  redirect: null,
                });
              }
            } else {
              res.render("admin.permit.ejs", {
                data,
                user: req.session.user.displayName,
              });
            }
          });
        } else {
          return res.render("admin.ejs", {
            isAdmin: false,
            data: JSON.stringify({
              message:
                "As you are not a member of admin panel, you are not alowed to be here!",
              redirect: {
                url: "/",
                timer: 7,
              },
            }),
          });
        }
      } else {
        res.redirect("/login?callback=admin");
      }
    },
  },
  user: function (req, res) {
    let user = req.query.user || null;
    if (user) {
      readFile(
        join(
          __dirname,
          "private",
          "user",
          "usr-" + encodeURIComponent(user) + ".json"
        ),
        (err, rdata) => {
          if (err) {
            console.error(err);
            return res.render("error.ejs", {
              status: 404,
              error: "User not found!",
              redirect: null,
            });
          } else {
            delete rdata.user.oauth;
            res.render("user.ejs", {
              user: rdata.user.displayName,
              jsondata: JSON.stringify(rdata),
            });
          }
        }
      );
    } else {
      res.render("user.ejs", {
        user: null,
        jsondata: JSON.stringify(null),
      });
    }
  },
  translate: function (req, res) {
    res.sendFile(`${__dirname}/public/views/underConst.html`);
  },
  create: function (req, res) {
    res.sendFile(`${__dirname}/public/views/underConst.html`);
  },
  tools: function (req, res) {
    res.sendFile(`${__dirname}/public/views/underConst.html`);
  },
};
function getTranslation(session, langcode, callback) {
  if (session && session.trans && session.trans.langcode == langcode) {
    callback(null, session.trans);
  } else {
    readFile(
      join(__dirname, "private", "db", "translation", langcode + ".tran"),
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
  }
}
