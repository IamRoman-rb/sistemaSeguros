import fs from "fs";
import path from "path";


const hasPermitions = (req, res, next) => {
    const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
    const permisosData = JSON.parse(fs.readFileSync(permisosPath, "utf8"));
    const user = req.session.user;
    const entity = req.originalUrl.split('/')[1]; // Obtiene la entidad de la URL
    const action = req.route.path;
    const method = req.method.toLowerCase(); // Obtener el método HTTP

    if (user) {
        const role = user.rol;
        const rolePermissions = permisosData.find(p => p.descripcion === role);

        if (rolePermissions) {
            const acciones = rolePermissions.alcances[entity];
            if (acciones && acciones.some(perm => perm.path === action && perm.method.toLowerCase() === method)) {
                return next(); // Si el usuario tiene permiso, permite el acceso
            }
        }
        return res.redirect('/clientes'); // Si el usuario no tiene permiso, denegamos el acceso
    } else {
        return res.redirect('/login'); // Si el usuario no está autenticado, redirigimos a login
    }
};

export default hasPermitions