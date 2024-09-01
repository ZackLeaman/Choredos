const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const { username, password, email, confirmPassword } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        username,
        email,
        password,
        confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  return bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email,
        password: hashedPw,
        username,
        chores: [],
      });
      return user.save();
    })
    .then(() => {
      res.render("login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "",
        oldInput: { email },
        validationErrors: [],
      });
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: { email: "" },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const { password, email } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // common error status code sent
    return res.status(422).render("login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.status(422).render("login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password.",
          oldInput: { email },
          validationErrors: [],
        });
      }

      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }

          req.flash("error", "Invalid email or password.");
          return res.status(422).render("login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: { email },
            validationErrors: [],
          });
        })
        .catch((e) => {
          console.log(e);
          res.redirect("/login");
        });
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
