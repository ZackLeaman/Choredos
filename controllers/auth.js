const User = require("../models/user.js");
const bcrypt = require("bcryptjs");

exports.getSignup = (req, res, next) => {
  res.render("signup", {
    path: "/signup",
    pageTitle: "Signup",
  });
};

exports.postSignup = (req, res, next) => {
  const { username, password, email } = req.body;
  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        res.redirect("/signup");
      }

      return bcrypt.hash(password, 12);
    })
    .then((hashedPw) => {
      const user = new User({
        email,
        password: hashedPw,
        username,
        chores: [],
      });
      return user.save();
    })
    .then((user) => {
      res.redirect("/login");
    })
    .catch((e) => console.log(e));
};

exports.getLogin = (req, res, next) => {
  res.render("login", {
    path: "/login",
    pageTitle: "Login",
  });
};

exports.postLogin = (req, res, next) => {
  const { password, email } = req.body;

  let foundUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        console.log("ERROR: no user with that email!");
        return res.redirect("/login");
      }

      foundUser = user;

      return bcrypt.compare(password, user.password);
    })
    .then((doMatch) => {
      if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = foundUser;
        return req.session.save((err) => {
          console.log(err);
          return res.redirect("/");
        });
      }

      res.redirect("/login");
      console.log("ERROR: incorrect password!");
    })
    .catch((e) => console.log(e));
};

exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
