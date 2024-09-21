import { validationResult } from "express-validator";
import Chore from "../models/chore.js";
import User from "../models/user.js";
import {
  getDateString,
  compareUTCDates,
  getDateAsUTC,
  getDateInputValue,
} from "../utils/date-helper.js";
import { getIcalObjectInstance, sendemail } from "../utils/calendar-invite.js";

const sendCalInviteEmail = async (chore) => {
  User.findById(chore.userId)
    .then((user) => {
      // TODO remove user specific validation
      if (user.email !== "zleaman3@gmail.com") {
        return;
      }
      const calObject = getIcalObjectInstance(
        chore._id,
        chore.sequence,
        getDateInputValue(new Date(chore.nextDue)),
        `${chore.title} Chore Due`,
        `${chore.description}`,
        "Choredo",
        user.email
      );
      return sendemail(
        user.email,
        `Choredo: ${chore.title} Due Update`,
        `<p>The following chore due date has been updated: <b>${chore.title}</b> due on <b>${chore.nextDue}</b></p>`,
        calObject
      );
    })
    .catch((e) => {
      console.log(e);
    });
};

export const getChores = (req, res, next) => {
  Chore.find({ userId: req.user })
    .sort({ nextDue: 1 })
    .then((chores) => {
      const mappedChores = chores.map((c) => {
        const nextDue = c.nextDue;

        let lastCompleted;
        if (c.lastCompleted.length > 0) {
          lastCompleted = new Date(c.lastCompleted[c.lastCompleted.length - 1]);
        }

        let isCompletedToday = false;
        if (lastCompleted !== undefined) {
          isCompletedToday = compareUTCDates(new Date(), lastCompleted);
        }

        return {
          ...c._doc,
          _id: c._id.toString(),
          nextDue: getDateString(nextDue),
          lastCompleted:
            lastCompleted !== undefined ? getDateString(lastCompleted) : "",
          isCompletedToday,
        };
      });
      console.log(mappedChores);
      res.render("index", {
        path: "/",
        pageTitle: "Choredos",
        chores: mappedChores,
        username: req.session.isLoggedIn ? req.session.user.username : "",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export const getCreateChore = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("create-chore", {
    path: "/create",
    pageTitle: "Create Chore",
    editMode: false,
    username: req.session.isLoggedIn ? req.session.user.username : "",
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    oldInput: {
      title: "",
      dueDate: "",
      dueEvery: "",
      description: "",
      imageUrl: "",
      links: [],
    },
    validationErrors: [],
  });
};

export const postCreateChore = (req, res, next) => {
  const { title, dueDate, dueEvery, description, imageUrl } = req.body;

  const links = [];
  for (let i = 0; i < 5; i++) {
    if (req.body[`linkUrl${i}`]) {
      const link =
        req.body[`linkUrl${i}`].length > 0 ? req.body[`linkUrl${i}`] : "";
      const display =
        req.body[`linkDisplay${i}`].length > 0
          ? req.body[`linkDisplay${i}`]
          : link;
      links.push({
        display,
        link,
      });
    }
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("create-chore", {
      path: "/create",
      pageTitle: "Create Chore",
      editMode: false,
      username: req.session.isLoggedIn ? req.session.user.username : "",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: { title, dueDate, dueEvery, description, imageUrl, links },
      validationErrors: errors.array(),
    });
  }
  const nextDueDate = new Date(dueDate);

  const chore = new Chore({
    title,
    dueEvery,
    description,
    imageUrl,
    links,
    lastCompleted: [],
    nextDue: getDateAsUTC(nextDueDate).toISOString(),
    userId: req.user,
    sequence: 0,
  });

  let _savedChore;

  chore
    .save()
    .then((savedChore) => {
      _savedChore = savedChore;
      return User.findById(req.user);
    })
    .then((user) => {
      if (!user) {
        throw new Error("Could not find user");
      }

      user.chores.push(_savedChore);
      return user.save();
    })
    .then(() => {
      sendCalInviteEmail(_savedChore);
      res.redirect("/");
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export const postChoreComplete = (req, res, next) => {
  const { _id } = req.body;

  User.findById(req.user)
    .then((user) => {
      if (!user) {
        throw new Error("Could not find user");
      }

      if (user.chores.findIndex((c) => c.toString() === _id) !== -1) {
        return Chore.findById(_id);
      } else {
        throw new Error("Could not find user chore");
      }
    })
    .then((chore) => {
      const todayUTC = getDateAsUTC(new Date());
      // cap last completed to 10 entries
      if (chore.lastCompleted.length >= 10) {
        chore.lastCompleted.shift();
      }
      chore.lastCompleted.push(todayUTC.toISOString());
      todayUTC.setDate(todayUTC.getDate() + chore.dueEvery);
      chore.nextDue = todayUTC.toISOString();
      chore.sequence += 1;
      sendCalInviteEmail(chore);
      return chore.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export const getEditChore = (req, res, next) => {
  const id = req.params.choreId;

  User.findById(req.user)
    .then((user) => {
      if (!user) {
        throw new Error("Could not find user");
      }

      if (user.chores.findIndex((c) => c.toString() === id) !== -1) {
        return Chore.findById(id);
      } else {
        throw new Error("Could not find user chore");
      }
    })
    .then((chore) => {
      const mappedChore = {
        ...chore._doc,
        _id: chore._id.toString(),
      };

      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render("create-chore", {
        path: "/edit",
        pageTitle: "Edit Chore",
        chore: mappedChore,
        editMode: true,
        username: req.session.isLoggedIn ? req.session.user.username : "",
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
          title: mappedChore.title,
          dueDate: getDateInputValue(new Date(mappedChore.nextDue)),
          dueEvery: mappedChore.dueEvery,
          description: mappedChore.description,
          imageUrl: mappedChore.imageUrl,
          links: mappedChore.links,
        },
        validationErrors: [],
      });
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export const postEditChore = (req, res, next) => {
  const { _id, title, dueDate, dueEvery, description, imageUrl, chore } =
    req.body;

  const links = [];
  for (let i = 0; i < 5; i++) {
    if (req.body[`linkUrl${i}`]) {
      const link =
        req.body[`linkUrl${i}`].length > 0 ? req.body[`linkUrl${i}`] : "";
      const display =
        req.body[`linkDisplay${i}`].length > 0
          ? req.body[`linkDisplay${i}`]
          : link;
      links.push({
        display,
        link,
      });
    }
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("create-chore", {
      path: "/edit",
      pageTitle: "Edit Chore",
      chore,
      editMode: true,
      username: req.session.isLoggedIn ? req.session.user.username : "",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: { title, dueDate, dueEvery, description, imageUrl, links },
      validationErrors: errors.array(),
    });
  }

  User.findById(req.user)
    .then((user) => {
      if (!user) {
        throw new Error("Could not find user");
      }

      if (user.chores.findIndex((c) => c.toString() === _id) !== -1) {
        return Chore.findById(_id);
      } else {
        throw new Error("Could not find user chore");
      }
    })
    .then((chore) => {
      chore.title = title;
      chore.dueEvery = dueEvery;
      chore.description = description;
      chore.imageUrl = imageUrl;
      chore.links = links;
      const newNextDue = getDateAsUTC(new Date(dueDate)).toISOString();
      if (newNextDue !== chore.nextDue) {
        chore.nextDue = getDateAsUTC(new Date(dueDate)).toISOString();
        chore.sequence += 1;
        sendCalInviteEmail(chore);
      }

      return chore.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export const postDeleteChore = (req, res, next) => {
  const _id = req.params.choreId;
  const userId = req.user;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        throw new Error("Could not find user");
      }

      if (user.chores.findIndex((c) => c.toString() === _id) === -1) {
        throw new Error("Could not find user chore");
      }

      user.chores = user.chores.filter((c) => c.toString() !== _id);
      return user.save();
    })
    .then(() => {
      return Chore.findByIdAndDelete(_id);
    })
    .then(() => {
      res.status(303).redirect("/");
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

export default null;
