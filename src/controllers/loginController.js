import fs from "fs";
import path from "path";
import bcrypt from 'bcrypt';


export const login = (req, res) => {
  res.render("login");
};

export const access = async (req, res) => {
  const { nombre, clave } = req.body;
  
  if (!nombre || !clave) {
    return res.status(400).send("Todos los campos son obligatorios");
  }

  try {
    const usersPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
    const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));

    const user = users.find(u => u.nombre === nombre);
    if (user) {
      const isMatch = await bcrypt.compare(clave, user['contraseña']);

      if (isMatch) {
        const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
        const permisos = JSON.parse(fs.readFileSync(permisosPath, "utf8"));
        const permiso = permisos.find(p => p.id === user.permisos);
        req.session.user = {
          id: user.id,
          nombre: user.nombre,
          rol: permiso.descripcion,
          permisos: permiso.alcances,
        };

        res.redirect('/clientes');
      } else {
        res.status(401).send("Usuario o contraseña incorrectos");
      }
    } else {
      res.status(401).send("Usuario no encontrado");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error interno del servidor");
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error al cerrar sesión");
    } else {
      res.redirect("/login");
    }
  });
};
