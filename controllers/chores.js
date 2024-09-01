const Chore = require("../models/chore.js");
const User = require("../models/user.js");
const { validationResult } = require("express-validator");

exports.getChores = (req, res, next) => {
  const today = new Date().toDateString();
  console.log(today);

  Chore.find({ userId: req.user })
    .sort({ nextDue: 1 })
    .then((chores) => {
      const mappedChores = chores.map((c) => {
        const nextDue = new Date(c.nextDue);
        console.log(nextDue, nextDue.toLocaleDateString());

        let lastCompleted = "";
        if (c.lastCompleted.length > 0) {
          lastCompleted = new Date(
            c.lastCompleted[c.lastCompleted.length - 1]
          ).toDateString();
        }
        return {
          ...c._doc,
          _id: c._id.toString(),
          nextDue: nextDue.toDateString(),
          lastCompleted,
          isCompletedToday: today === lastCompleted,
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

exports.getCreateChore = (req, res, next) => {
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

exports.postCreateChore = (req, res, next) => {
  const { title, dueDate, dueEvery, description, imageUrl } = req.body;

  const links = [];
  for (let i = 0; i < 5; i++) {
    if (req.body[`linkUrl${i}`]) {
      links.push({
        display: req.body[`linkDisplay${i}`],
        link: req.body[`linkUrl${i}`],
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

  const chore = new Chore({
    title,
    dueEvery,
    description,
    imageUrl,
    links,
    lastCompleted: [],
    nextDue: new Date(dueDate).toISOString(),
    userId: req.user,
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
      res.redirect("/");
    })
    .catch((e) => {
      const error = new Error(e);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postChoreComplete = (req, res, next) => {
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
      const date = new Date();
      chore.lastCompleted.push(date.toISOString());
      date.setDate(date.getDate() + chore.dueEvery);
      chore.nextDue = date.toISOString();
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

exports.getEditChore = (req, res, next) => {
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
          dueDate: mappedChore.nextDue,
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

exports.postEditChore = (req, res, next) => {
  const { _id, title, dueDate, dueEvery, description, imageUrl, chore } =
    req.body;

  const links = [];
  for (let i = 0; i < 5; i++) {
    if (req.body[`linkUrl${i}`]) {
      links.push({
        display: req.body[`linkDisplay${i}`],
        link: req.body[`linkUrl${i}`],
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
      chore.nextDue = new Date(dueDate).toISOString();
      chore.dueEvery = dueEvery;
      chore.description = description;
      chore.imageUrl = imageUrl;
      chore.links = links;

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

exports.postDeleteChore = (req, res, next) => {
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
