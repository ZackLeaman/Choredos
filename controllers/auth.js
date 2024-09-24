import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";
import User from "../models/user.js";
import { sendemail } from "../utils/calendar-invite.js";

export const getSignup = (req, res, next) => {
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

export const postSignup = (req, res, next) => {
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

export const getLogin = (req, res, next) => {
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

export const postLogin = (req, res, next) => {
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

export const postLogout = (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

export const getResetPassword = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("reset-password", {
    path: "/reset-password",
    pageTitle: "Reset Password",
    isResetRequest: true,
    email: "",
    errorMessage: message,
    validationErrors: [],
  });
};

export const postResetPassword = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("reset-password", {
      path: "/reset-password",
      pageTitle: "Reset Password",
      isResetRequest: true,
      email: "",
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log("crypto error", err);
      return res.redirect("/reset-password");
    }
    const { email } = req.body;
    // convert hex values to ascii characters to get token to save
    const token = buffer.toString("hex");
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.flash("error", "User validation failure.");
          return res.redirect("/reset-password");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save().then((result) => {
          req.flash("error", "Reset Password Email Sent!");
          res.redirect("/");
          const html = `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset-password/${token}"> link to set a new password.</p>
          `;

          return sendemail(email, "Choredo: Password Reset", html);
        });
      })
      .catch((err) => {
        console.log("error", err);
      });
  });
};

export const getChangePassword = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  const { resetToken } = req.params;

  User.findOne({
    resetToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("reset-password", {
        path: "/reset-password",
        pageTitle: "Change Password",
        email: user.email,
        isResetRequest: false,
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: resetToken,
        validationErrors: [],
      });
    })
    .catch((err) => console.log(err));
};

export const postChangePassword = (req, res) => {
  const { userId, password, passwordToken, email, confirmPassword } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("reset-password", {
      path: "/reset-password",
      pageTitle: "Change Password",
      email,
      isResetRequest: false,
      userId,
      passwordToken,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        password,
        confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  return User.findById(userId).then((user) => {
    if (user && user.resetToken === passwordToken && user.email === email) {
      return bcrypt
        .hash(password, 12)
        .then((hashedPw) => {
          user.password = hashedPw;
          user.resetToken = "";
          user.resetTokenExpiration = 0;
          return user.save();
        })
        .then(() => {
          res.render("login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Password Changed Successfully",
            oldInput: { email },
            validationErrors: [],
          });
        })
        .catch((e) => {
          const error = new Error(e);
          error.httpStatusCode = 500;
          return next(error);
        });
    } else {
      // handle user info mismatch to change password
      return res.render("reset-password", {
        path: "/reset-password",
        pageTitle: "Reset Password",
        isResetRequest: true,
        email: "",
        errorMessage:
          "There was an issue finding the user. Please request another password reset.",
        validationErrors: [],
      });
    }
  });
};

export default null;
