const isAuthenticated = (req, res, next) => {
    if (req?.session?.user) {
      console.log('Usuario autenticado');
      console.log(req.session.user);
      next();
    } else {
      res.redirect('/login');
    }
  };
  
export default isAuthenticated;
  