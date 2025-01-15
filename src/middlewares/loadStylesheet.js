const loadStylesheet = (req, res, next) => {
    let entity = req.originalUrl.split('/')[1]; // Obtiene la entidad de la URL
    let action = req.path.split('/').filter(Boolean);
    console.log(action);
    switch (action.length) {
        case 1:
           action = action[0] 
        break;
        
        case 2:
            entity = action[0];
            action = action[1];
        break;
    
        default:
            action = action[1];
        break;
    }
    res.locals.stylesheet = `${entity}/${action}.css`;
    console.log("CSS",res.locals.stylesheet);
    next();
};

export default loadStylesheet;