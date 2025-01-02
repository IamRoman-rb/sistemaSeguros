import fs from "fs";
import path from "path";

const loginController = {
  index: (req, res) => {
    res.render("login");
  },
  post: (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
      return res.status(400).send("Todos los campos son obligatorios");
    }

    try {
      const usersPath = path.resolve(process.cwd(), "src/data", "usuarios.json");

      if (!fs.existsSync(usersPath)) {
        return res.status(404).send("Archivo de usuarios no encontrado");
      }

      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
      
      const user = users.find(
        (u) => u.name === nombre && u.contraseña === contraseña
      );

      if (user) {
        res.send(`¡Bienvenido, ${user.name}!`);
      } else {
        res.status(401).send("Usuario o contraseña incorrectos");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error interno del servidor");
    }
  },
};

export default loginController;