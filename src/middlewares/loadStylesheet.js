const loadStylesheet = (req, res, next) => {
    const entity = req.originalUrl.split('/')[1]; // Obtiene la entidad de la URL
    let action = req.path.split('/').filter(Boolean);
    if(action.length > 1) action = action[1];
    res.locals.stylesheet = `/css/${entity}/${action}.css`;
    next();
};

export default loadStylesheet;