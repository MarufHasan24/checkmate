// Import dependencies
const express = require("express");
const session = require("express-session");
const { join } = require("path");
require("dotenv").config();
const passport = require("passport");
const cookieParser = require("cookie-parser");
const MediaWikiStrategy = require("passport-mediawiki-oauth").OAuthStrategy;
const CONFIG = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  algorithm: process.env.ALGORITHM,
  key: process.env.KEY,
};
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8000; // IMPORTANT!!
const crypto = require("crypto");
const gets = require(join(__dirname, "server.get.js"));
const posts = require(join(__dirname, "server.post.js"));

// Build express app
app.set("views", __dirname + "/public/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public/views"));
app.use(express.json());
app.use(cookieParser(CONFIG.key.split(".").join(CONFIG.algorithm)));
app.use(
  session({
    secret: crypto
      .createHash(CONFIG.algorithm)
      .update(CONFIG.key)
      .digest("base64"),
    saveUninitialized: false, // Only save sessions when necessary
    resave: false, // Avoid resaving unchanged sessions
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
passport.use(
  new MediaWikiStrategy(
    {
      consumerKey: CONFIG.consumer_key,
      consumerSecret: CONFIG.consumer_secret,
    },
    function (token, tokenSecret, profile, done) {
      profile.oauth = {
        consumer_key: CONFIG.consumer_key,
        consumer_secret: CONFIG.consumer_secret,
        token: token,
        token_secret: tokenSecret,
      };
      return done(null, profile);
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
// redirect all the get requests get routes
app.get("/", gets.index);
app.get("/login", gets.login);
app.get("/oauth-callback", gets.oauth);
app.get("/template", gets.template);
app.get("/query", gets.query);
app.get("/dashboard", gets.dashboard);
app.get("/logout", gets.logout);
app.get("/editathon", gets.editathon);
app.get("/editathon/log", gets.editathonLog);
app.get("/submit", gets.submit);
app.get("/judge", gets.judge);
app.get("/remove", gets.remove);
app.get("/result", gets.result);
app.get("/admin", gets.admin.index);
app.get("/admin/log", gets.admin.log);
app.get("/admin/permit", gets.admin.permit);
app.get("/user", gets.user);
/* app.get("/create", gets.create);
app.get("/translate", gets.translate);
app.get("/tools", gets.tools); */
app.get("/filter", gets.filter);
// redirect all the post requests post routes
app.post("/template", posts.template);
app.post("/dashboard", posts.dashboard);
app.post("/delete", posts.delete);
app.post("/submit", posts.submit);
app.post("/judge", posts.judge);
app.post("/filter", posts.filter);
app.post("/remove", posts.remove);
app.post("/comment", posts.comment);
app.post("/get-rows", posts.getRows);
app.post("/dashboard/br", posts.dashboardbr);
app.post("/elemination", posts.elemination);
app.post("/permit", posts.adminP);
app.post("/result", posts.makeResult);
app.post("/language", posts.language);
app.post("/lock", posts.pagelock);
app.post("/backup", posts.backup);
// 404 handler - Place this AFTER all routes
app.use(function (req, res) {
  return res.render("error.ejs", {
    status: 404,
    error: "Looks like you've made a wrong move and checkmate!",
    redirect: null,
    deletable: false,
  });
});

// Start server
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
