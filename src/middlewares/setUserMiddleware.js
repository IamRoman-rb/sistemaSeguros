export default (req, res, next) => {
    if (req.session && req.session.user) {
      req.user = req.session.user;
    } else {
      req.user = null;
    }
    next();
  };
  