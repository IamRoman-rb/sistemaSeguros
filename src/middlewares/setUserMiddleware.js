const setUserMiddleware = (req,res,next) => {
  res.locals.user = req.session.user ? req.session.user : null  
  return next()
}
export default setUserMiddleware