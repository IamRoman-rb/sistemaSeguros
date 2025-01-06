const setUserMiddleware = (req,res,next) => {
  res.locals.user = req.session.user ? req.session.user : null  
  console.log(res.locals.user)
  return next()
}
export default setUserMiddleware