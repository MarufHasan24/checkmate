const request = require("request").defaults({ jar: true }),
  url = "https://bn.wikipedia.org/w/api.php";
function login(callback) {
  getCsrfToken((tokens) => {
    callback(tokens);
  });
  // Step 1: GET request to fetch login token
  function getLoginToken(callback) {
    let params = {
      action: "query",
      meta: "tokens",
      type: "login",
      format: "json",
    };
    request.get({ url: url, qs: params }, function (error, res, body) {
      let data;
      if (error) {
        return;
      }
      data = JSON.parse(body);
      loginRequest(data.query.tokens.logintoken, (data) => {
        callback(data);
      });
    });
  }
  function loginRequest(loginToken, callback) {
    let params = {
      action: "login",
      lgname: "মোহাম্মদ মারুফ",
      lgpassword: "mr-node@kb06g8vgagou4klklqmv545j6n6vgk5j",
      lgtoken: loginToken,
      format: "json",
    };

    request.post({ url: url, form: params }, function (error, res, body) {
      if (error) {
        return;
      }
      callback(JSON.parse(body).login);
    });
  }
  function getCsrfToken(callback) {
    console.log("Getting CSRF token...");
    getLoginToken((data) => {
      if (data.result == "Success") {
        var params = {
          action: "query",
          format: "json",
          meta: "tokens",
          formatversion: "2",
          type: "csrf",
        };
        request.get({ url: url, qs: params }, function (error, response, body) {
          if (error) {
            console.error(error);
          } else {
            body = JSON.parse(body);
            callback(body.query.tokens.csrftoken);
          }
        });
      } else {
        callback(data);
      }
    });
  }
}
function edit(page, data, token, callback, where) {
  let params = {
    action: "query",
    titles: page,
    prop: "revisions",
    rvprop: "content",
    format: "json",
  };
  request.get({ url: url, qs: params }, function (error, res, body) {
    if (error) {
      callback(error);
    } else {
      let result = JSON.parse(body);
      let pageData =
        result.query.pages[Object.keys(result.query.pages)[0]].revisions[0][
          "*"
        ];
      let updatedData;

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
        summary: "checkmatebot দ্বারা সম্পাদনা করা হয়েছে।",
        token: token,
        format: "json",
      };

      request.post({ url: url, form: editParams }, function (error, res, body) {
        if (error) {
          callback(error);
        } else {
          let result = JSON.parse(body);
          if (result.error) {
            callback(result);
          } else {
            callback(null, result.edit);
          }
        }
      });
    }
  });
}
login((token) => {
  edit(
    "ব্যবহারকারী:মোহাম্মদ মারুফ/খেলাঘর",
    "abba",
    token,
    (err, data) => {
      if (err) {
        console.error(err);
      } else {
        console.log(data);
      }
    },
    "append"
  );
});
