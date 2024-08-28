const Chore = require("../models/chore.js");
const User = require("../models/user.js");

exports.getChores = (req, res, next) => {
  const today = new Date().toDateString();

  Chore.find({ userId: req.user })
    .sort({ nextDue: 1 })
    .then((chores) => {
      const mappedChores = chores.map((c) => {
        const nextDue = new Date(c.nextDue);
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
      });
    })
    .catch((e) => console.log(e));
};

exports.getCreateChore = (req, res, next) => {
  res.render("create-chore", {
    path: "/create",
    pageTitle: "Create Chore",
    editMode: false,
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

  const chore = new Chore({
    title,
    dueEvery,
    description,
    imageUrl,
    links,
    lastCompleted: [],
    nextDue: dueDate,
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
        console.log("ERROR: could not find user");
      }

      user.chores.push(_savedChore);
      return user.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((e) => console.log(e));
};

exports.postChoreComplete = (req, res, next) => {
  const { _id } = req.body;

  User.findById(req.user)
    .then((user) => {
      if (!user) {
        const error = new Error("could not find user");
        throw error;
      }

      if (user.chores.findIndex((c) => c.toString() === _id) !== -1) {
        return Chore.findById(_id);
      } else {
        const error = new Error("user not associated with chore");
        throw error;
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
    .catch((e) => console.log(e));
};

exports.getEditChore = (req, res, next) => {
  const id = req.params.choreId;

  User.findById(req.user)
    .then((user) => {
      if (!user) {
        const error = new Error("could not find user");
        throw error;
      }

      if (user.chores.findIndex((c) => c.toString() === id) !== -1) {
        return Chore.findById(id);
      } else {
        const error = new Error("user not associated with chore");
        throw error;
      }
    })
    .then((chore) => {
      const mappedChore = {
        ...chore._doc,
        _id: chore._id.toString(),
      };

      res.render("create-chore", {
        path: "/edit",
        pageTitle: "Edit Chore",
        chore: mappedChore,
        editMode: true,
      });
    })
    .catch((e) => console.log(e));
};

exports.postEditChore = (req, res, next) => {
  const { _id, title, dueDate, dueEvery, description, imageUrl } = req.body;

  User.findById(req.user).then((user) => {
    if (!user) {
      console.log("ERROR: could not find user");
      return res.redirect("/");
    }

    const links = [];
    for (let i = 0; i < 5; i++) {
      if (req.body[`linkUrl${i}`]) {
        links.push({
          display: req.body[`linkDisplay${i}`],
          link: req.body[`linkUrl${i}`],
        });
      }
    }

    if (user.chores.findIndex((c) => c.toString() === _id) !== -1) {
      Chore.findById(_id)
        .then((chore) => {
          chore.title = title;
          chore.dueDate = dueDate;
          chore.dueEvery = dueEvery;
          chore.description = description;
          chore.imageUrl = imageUrl;
          chore.links = links;

          return chore.save();
        })
        .then(() => {
          res.redirect("/");
        })
        .catch((e) => console.log(e));
    } else {
      res.redirect("/");
    }
  });
};

exports.postDeleteChore = (req, res, next) => {
  const _id = req.params.choreId;
  const userId = req.user;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        console.log("Error: could not find user");
        return res.redirect("/");
      }

      if (user.chores.findIndex((c) => c.toString() === _id) === -1) {
        console.log("Error: could not find user chore");
        return res.redirect("/");
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
    .catch((e) => console.log(e));
};
