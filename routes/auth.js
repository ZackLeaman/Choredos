const express = require("express");
const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator");
const User = require("../models/user");

const router = express.Router();

router.get("/signup", authController.getSignup);

router.post(
  "/signup",
  [
    body("username")
      .trim()
      .escape()
      .isLength({ min: 5 })
      .withMessage("Please enter a username with at least 5 characters."),
    body("email")
      .isEmail()
      .escape()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail()
      .custom((value) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail already exists, please pick a different one."
            );
          }
        });
      }),
    body(
      "password",
      "Must be a password that contains at least 1 lowercase, uppercase, number, and a special character, and have a minimum length of 5."
    )
      .trim()
      .escape()
      .isStrongPassword({
        minLength: 5,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
    body("confirmPassword")
      .trim()
      .escape()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .escape()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Must be a valid password.").trim().escape(),
  ],
  authController.postLogin
);

router.post("/logout", isAuth, authController.postLogout);

module.exports = router;
