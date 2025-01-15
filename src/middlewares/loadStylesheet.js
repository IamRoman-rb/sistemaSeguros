const loadStylesheet = (req, res, next) => {
    let entity = req.originalUrl.split('/')[1]; // Obtiene la entidad de la URL
    let action = req.path.split('/').filter(Boolean);
    console.log(action);
    if(action.length > 1) action = action[1];
    res.locals.stylesheet = `/css/${entity}/${action}.css`;
    console.log("CSS",res.locals.stylesheet);
    next();
};

export default loadStylesheet;