const express = require("express");
const choresController = require("../controllers/chores");
const { body, check } = require("express-validator");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", isAuth, choresController.getChores);

router.get("/create", isAuth, choresController.getCreateChore);

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
    body("imageUrl").isURL(),
    check("links.*.display")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Links must have display text of at least 1 character."),
    check("links.*.link").trim().isURL().withMessage("Links must be URLs."),
  ],
  isAuth,
  choresController.postCreateChore
);

router.post("/complete-chore", isAuth, choresController.postChoreComplete);

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
    body("imageUrl").isURL(),
    check("links.*.display")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Links must have display text of at least 1 character."),
    check("links.*.link").trim().isURL().withMessage("Links must be URLs."),
  ],
  isAuth,
  choresController.postEditChore
);

router.get("/edit/:choreId", isAuth, choresController.getEditChore);

router.post("/delete/:choreId", isAuth, choresController.postDeleteChore);

module.exports = router;
