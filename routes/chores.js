const express = require("express");
const choresController = require("../controllers/chores");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", isAuth, choresController.getChores);

router.get("/create", isAuth, choresController.getCreateChore);

router.post("/create", isAuth, choresController.postCreateChore);

router.post("/complete-chore", isAuth, choresController.postChoreComplete);

router.post("/edit", isAuth, choresController.postEditChore);

router.get("/edit/:choreId", isAuth, choresController.getEditChore);

router.post("/delete/:choreId", isAuth, choresController.postDeleteChore);

module.exports = router;
