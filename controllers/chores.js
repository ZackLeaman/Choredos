const Chore = require("../models/chore.js");

exports.getChores = (req, res, next) => {
  // const lastCompleted = new Date();
  // const daysTillDue = 12;
  // let nextDue = new Date(lastCompleted);
  // nextDue.setDate(nextDue.getDate() + daysTillDue);
  // nextDue = new Date(nextDue).toLocaleDateString();

  const today = new Date().toDateString();

  Chore.find()
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

  // .then(() => {
  //   res.render("index", {
  //     path: "/",
  //     pageTitle: "Choredos",
  //     chores: [
  //       // {
  //       //   _id: Date.now(),
  //       //   title: "Change Air Filter",
  //       //   lastCompleted: [lastCompleted.toLocaleDateString()],
  //       //   // daysTillRenewal: 10,
  //       //   nextDue,
  //       //   description:
  //       //     "Need to change the air filter in attic on our A/C machine.",
  //       //   imageUrl:
  //       //     "https://m.media-amazon.com/images/I/614W-erkG7L._AC_UF894,1000_QL80_.jpg",
  //       //   links: [
  //       //     {
  //       //       description: "Where to buy.",
  //       //       url: "https://amazon.com/",
  //       //     },
  //       //   ],
  //       // },
  //       // {
  //       //   _id: Date.now(),
  //       //   title: "Change Air Filter",
  //       //   lastCompleted: [lastCompleted.toLocaleDateString()],
  //       //   nextDue,
  //       //   description:
  //       //     "Need to change the air filter in attic on our A/C machine.",
  //       //   imageUrl:
  //       //     "https://m.media-amazon.com/images/I/614W-erkG7L._AC_UF894,1000_QL80_.jpg",
  //       //   links: [
  //       //     {
  //       //       description: "Where to buy.",
  //       //       url: "https://amazon.com/",
  //       //     },
  //       //   ],
  //       // },
  //       // {
  //       //   _id: Date.now(),
  //       //   title: "Change Air Filter",
  //       //   lastCompleted: [lastCompleted.toLocaleDateString()],
  //       //   nextDue,
  //       //   description:
  //       //     "Need to change the air filter in attic on our A/C machine.",
  //       //   imageUrl:
  //       //     "https://m.media-amazon.com/images/I/614W-erkG7L._AC_UF894,1000_QL80_.jpg",
  //       //   links: [
  //       //     {
  //       //       description: "Where to buy.",
  //       //       url: "https://amazon.com/",
  //       //     },
  //       //   ],
  //       // },
  //     ],
  //   });
  // })
};

exports.getCreateChore = (req, res, next) => {
  // const chore = new Chore({
  //   title: "fake title",
  //   lastCompleted: [Date.now()],
  //   nextDue: Date.now(),
  //   description: "This is my fake description",
  //   imageUrl: "this is my fake image url",
  //   links: ["Fake link here"],
  // });
  // chore.save();

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
  });

  console.log(chore);

  chore
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch((e) => console.log(e));
};

exports.postChoreComplete = (req, res, next) => {
  const { _id } = req.body;

  Chore.findById(_id)
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

  Chore.findById(id)
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

  const links = [];
  for (let i = 0; i < 5; i++) {
    if (req.body[`linkUrl${i}`]) {
      links.push({
        display: req.body[`linkDisplay${i}`],
        link: req.body[`linkUrl${i}`],
      });
    }
  }

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
};

exports.postDeleteChore = (req, res, next) => {
  const _id = req.params.choreId;

  console.log(_id);

  Chore.findByIdAndDelete(_id)
    .then(() => {
      res.status(303).redirect("/");
    })
    .catch((e) => console.log(e));
};
