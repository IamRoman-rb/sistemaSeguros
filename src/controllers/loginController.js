import fs from "fs";
import path from "path";
import bcrypt from 'bcrypt';

const loginController = {
  index: (req, res) => {
    res.render("login");
  },
  post: async (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
      return res.status(400).send("Todos los campos son obligatorios");
    }
  
    try {
      const usersPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  
      const user = users.find(u => u.nombre === nombre);
  
      if (user) {
        // Pass the password entered by the user and the hashed password from the database
        
        const isMatch = await bcrypt.compare(contraseña, user.contraseña);

        console.log(isMatch);
        

        if (isMatch) {
          res.redirect('/polizas');
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