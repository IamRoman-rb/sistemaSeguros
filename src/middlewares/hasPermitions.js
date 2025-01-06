const hasPermitions = (req, res, next) => {
    const user = req.session.user;
    const entity = req.originalUrl.split('/')[1]; // Obtiene la entidad de la URL
    const action = req.route.path;

    if (user) {
        const permisos = req.session.user.permisos;
        const entidades = Object.keys(permisos);
        const acciones = permisos[entity];
        if (entidades.includes(entity) && acciones.includes(action)) {
            return next(); // Si el usuario tiene permiso para la entidad y la accion, permite el acceso
        }else{
            return res.redirect('/clientes'); // Si el usuario no tiene permiso, denegamos el acceso
        }
    } else {
       return res.redirect('/login'); // Si el usuario no es un administrador, denegamos el acceso
    }
};

export default hasPermitions