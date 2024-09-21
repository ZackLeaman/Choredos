const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const { doubleCsrf } = require("csrf-csrf");

const choresRoutes = require("./routes/chores");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.uqyei50.mongodb.net/${process.env.MONGO_DB}`;

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions", // name of collection in 'store' db
  // can also config expiration info here
});

const {
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  // getTokenFromRequest: (req) => {
  //   console.log(req);

  //   return req.body._csrf;
  // },
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    // accept image
    cb(null, true);
  } else {
    // reject image
    cb(null, false);
  }
};

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(cookieParser(process.env.CSRF_SECRET));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // in prod should be a long string value
    resave: false, // will not be saved on every request but only when session changed
    saveUninitialized: false, // no session get saved for request when doesn't need to be saved
    // cookie: { Max-Age: 10000 } can config cookie or leave out for default
    store,
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  console.log(JSON.stringify(req.body, null, 2));

  next();
});

app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(flash());

app.use((req, res, next) => {
  console.log("HEYO IN APP");

  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        chores: user.chores,
      };
      next();
    })
    .catch((err) => console.log(err));
});

app.use(doubleCsrfProtection);

app.use((req, res, next) => {
  // locals special keyword that is used on every view
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(authRoutes);
app.use(choresRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.redirect("/500");
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
