import fs from "fs";
import path from "path";
import bcrypt from 'bcrypt';

const loginController = {
  index: (req, res) => {
    res.render("login");
  },
  post: async (req, res) => {
    const { nombre, clave } = req.body;
  
    if (!nombre || !clave) {
      return res.status(400).send("Todos los campos son obligatorios");
    }

    try {
      const usersPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  
      const user = users.find(u => u.nombre === nombre);
  
      if (user) {
        const isMatch = await bcrypt.compare(clave, user.clave);
  
        if (isMatch) {
          req.session.user = {
            id: user.id,
            nombre: user.nombre,
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
  }
  
};

export default loginController;