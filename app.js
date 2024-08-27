const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const choresRoutes = require("./routes/chores");
const authRoutes = require("./routes/auth");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.uqyei50.mongodb.net/${process.env.MONGO_DB}`;

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions", // name of collection in 'store' db
  // can also config expiration info here
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
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(authRoutes);
app.use(choresRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
