import express from "express";
import { body } from "express-validator";
import {
  getChangePassword,
  getLogin,
  getResetPassword,
  getSignup,
  postChangePassword,
  postLogin,
  postLogout,
  postResetPassword,
  postSignup,
} from "../controllers/auth.js";
import isAuth from "../middleware/is-auth.js";
import User from "../models/user.js";

const router = express.Router();

router.get("/signup", getSignup);

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
  postSignup
);

router.get("/login", getLogin);

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
  postLogin
);

router.post("/logout", isAuth, postLogout);

router.get("/reset-password", getResetPassword);

router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .escape()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],
  postResetPassword
);

router.get("/reset-password/:resetToken", getChangePassword);

router.post(
  "/change-password",
  [
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
  postChangePassword
);

export default router;
