export default (req,res,next) => {
  res.locals.user = req.session.user ? req.session.user : null
  console.log("ENTRE :D");
  
  console.log(req.session.user)
  next()
}