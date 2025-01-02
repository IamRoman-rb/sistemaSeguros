import fs from "fs";
import path from "path";

const loginController = {
    index: (req, res) => {
      res.render('login'); // Renderiza la vista 'index.ejs'
    },
    post: (req, res) => {
      const { nombre, contraseña } = req.body; // Captura los datos enviados por el formulario
  
      // Leer el archivo JSON de usuarios
      const usersPath = path.join(process.cwd(), "data", "usuarios.json");
      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  
      // Buscar el usuario en el JSON
      const user = users.find((u) => u.name === nombre && u.contraseña === contraseña);
  
      if (user) {
          // Usuario encontrado: redirigir o mostrar éxito
          res.send(`¡Bienvenido, ${user.name}!`);
      } else {
          // Usuario no encontrado: mostrar error
          res.status(401).send("Usuario o contraseña incorrectos");
      }
    }
  };
  
  export default loginController;