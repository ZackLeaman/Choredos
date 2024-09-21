import express from "express";
import { body, check } from "express-validator";
import {
  getChores,
  getCreateChore,
  getEditChore,
  postChoreComplete,
  postCreateChore,
  postDeleteChore,
  postEditChore,
} from "../controllers/chores.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();

router.get("/", isAuth, getChores);

router.get("/create", isAuth, getCreateChore);

router.post(
  "/create",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("dueDate").isDate().trim(),
    body("dueEvery")
      .isInt()
      .custom((val) => {
        if (val <= 0) {
          throw new Error("Due every must be greater than 0.");
        }
        return true;
      }),
    body("description")
      .isLength({ min: 0, max: 400 })
      .trim()
      .withMessage("Description must not exceed 400 characters."),
    // body("imageUrl").isURL(),
    check("links.*.display")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 1 })
      .withMessage("Links must have display text of at least 1 character."),
    check("links.*.link")
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage("Links must be URLs."),
  ],
  isAuth,
  postCreateChore
);

router.post("/complete-chore", isAuth, postChoreComplete);

router.post(
  "/edit",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("dueDate").isDate().trim(),
    body("dueEvery")
      .isInt()
      .custom((val) => {
        if (val <= 0) {
          throw new Error("Due every must be greater than 0.");
        }
        return true;
      }),
    body("description")
      .isLength({ min: 0, max: 400 })
      .trim()
      .withMessage("Description must not exceed 400 characters."),
    // body("imageUrl").isURL(),
    check("links.*.display")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 1 })
      .withMessage("Links must have display text of at least 1 character."),
    check("links.*.link")
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage("Links must be URLs."),
  ],
  isAuth,
  postEditChore
);

router.get("/edit/:choreId", isAuth, getEditChore);

router.post("/delete/:choreId", isAuth, postDeleteChore);

export default router;
