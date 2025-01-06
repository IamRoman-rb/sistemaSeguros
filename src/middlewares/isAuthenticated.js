const isAuthenticated = (req, res, next) => {
  console.log('Middleware de autenticación');
  if(req?.session && req?.session?.user) {
      console.log('Usuario autenticado');
      console.log(req.session.user);
      return next();
    } else {
      return res.redirect('/login');
    }
  };
  
export default isAuthenticated;
  