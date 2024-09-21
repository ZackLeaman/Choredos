export const get404 = (req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthenticated: req.session.isLoggedIn,
    username: req.session.isLoggedIn ? req.session.user.username : "",
  });
};

export const get500 = (req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
    username: req.session.isLoggedIn ? req.session.user.username : "",
  });
};

export default null;
