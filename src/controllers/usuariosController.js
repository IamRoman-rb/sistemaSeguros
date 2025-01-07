import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";


export const listar = async (req, res) => {
    try {
      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const permisosPath = path.resolve(
        process.cwd(),
        "src/data",
        "permisos.json"
      );
      const sucursalesPath = path.resolve(
        process.cwd(),
        "src/data",
        "sucursales.json"
      );
      const usuariosData = await fs.promises.readFile(usuariosPath, "utf8");
      const permisosData = await fs.promises.readFile(permisosPath, "utf8");
      const sucursalesData = await fs.promises.readFile(sucursalesPath, "utf8");
      const usuarios = JSON.parse(usuariosData);
      const permisos = JSON.parse(permisosData);
      const sucursales = JSON.parse(sucursalesData);

      // Agregar la descripción del permiso a cada usuario
      const usuariosConPermisos = usuarios.map((usuario) => {
        const permiso = permisos.find((p) => p.id === usuario.permisos);
        const sucursal = sucursales.find((s) => s.id === usuario.sucursal);
        return {
          ...usuario,
          permiso,
          sucursal
        };
      });

      res.render("usuarios/usuarios", { usuarios: usuariosConPermisos });
    } catch (error) {
      console.error("Error al cargar los usuarios:", error.message);
      res.status(500).send("Error al cargar los usuarios");
    }
  };
export const  nuevo = async (req, res) => {
    const permisosPath = path.resolve(
      process.cwd(),
      "src/data",
      "permisos.json"
    );
    const permisosData = await fs.promises.readFile(permisosPath, "utf8");
    const permisos = JSON.parse(permisosData);
    const sucursalesPath = path.resolve(
      process.cwd(),
      "src/data",
      "sucursales.json"
    );
    const sucursalesData = await fs.promises.readFile(sucursalesPath, "utf8");
    const sucursales = JSON.parse(sucursalesData);

    res.render("usuarios/nuevo", { permisos: permisos,sucursales:sucursales }); // Renderiza la vista 'index.ejs'
  };

export const guardar = async (req, res) => {
    try {
      const { nombre, contraseña, permiso, dni,sucursal} = req.body;

      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const usuariosData = await fs.promises.readFile(usuariosPath, "utf8");
      const usuarios = JSON.parse(usuariosData);

      // Verificar si el usuario ya existe por DNI
      const usuarioExistente = usuarios.find((u) => u.dni === dni);
      if (usuarioExistente) {
        return res.status(400).send("El usuario con ese DNI ya existe");
      }

      // Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

      // Generar un nuevo ID
      const nuevoId = usuarios.length + 1;

      const permisoId = parseInt(permiso);

      const nuevoUsuario = {
        id: nuevoId,
        nombre,
        contraseña: hashedPassword,
        permisos: permisoId,
        dni,
        sucursal:parseInt(sucursal),
        activo: true
      };

      usuarios.push(nuevoUsuario);

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al crear el usuario:", error.message);
      res.status(500).send("Error al crear el usuario");
    }
  };

export const perfil = (req, res) => res.render("usuarios/perfil");

export const detalle =  async (req, res) => {
    try {
      const { id } = req.params; // Obtener el ID del usuario desde la URL

      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const permisosPath = path.resolve(
        process.cwd(),
        "src/data",
        "permisos.json"
      );
      const sucursalesPath = path.resolve(
        process.cwd(),
        "src/data",
        "sucursales.json"
      );
      const usuariosData = await fs.promises.readFile(usuariosPath, "utf8");
      const permisosData = await fs.promises.readFile(permisosPath, "utf8");
      const sucursalesData = await fs.promises.readFile(sucursalesPath, "utf8");
      const usuarios = JSON.parse(usuariosData);
      const permisos = JSON.parse(permisosData);
      const sucursales = JSON.parse(sucursalesData);

      const usuario = usuarios.find((u) => u.id === parseInt(id));

      if (!usuario) {
        return res.status(404).send("Usuario no encontrado");
      }

      const permiso = permisos.find((p) => p.id === usuario.permisos);
      const sucursal = sucursales.find((s) => s.id === usuario.sucursal);

      res.render("usuarios/detalle", { usuario, permiso, sucursal });
    } catch (error) {
      console.error("Error al cargar el detalle del usuario:", error.message);
      res.status(500).send("Error al cargar el detalle del usuario");
    }
  };

  // Método para mostrar el formulario de edición
export const editar = async (req, res) => {
    try {
      const { id } = req.params;

      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const permisosPath = path.resolve(
        process.cwd(),
        "src/data",
        "permisos.json"
      );
      const sucursalesPath = path.resolve(
        process.cwd(),
        "src/data",
        "sucursales.json"
      );
      const usuariosData = await fs.promises.readFile(usuariosPath, "utf8");
      const permisosData = await fs.promises.readFile(permisosPath, "utf8");
      const sucursalesData = await fs.promises.readFile(sucursalesPath, "utf8");
      const usuarios = JSON.parse(usuariosData);
      const permisos = JSON.parse(permisosData);
      const sucursales = JSON.parse(sucursalesData);
      const usuario = usuarios.find((u) => u.id === parseInt(id));

      if (!usuario) {
        return res.status(404).send("Usuario no encontrado");
      }
      res.render("usuarios/editar", { usuario, permisos, sucursales });
    } catch (error) {
      console.error("Error al cargar el formulario de edición:", error.message);
      res.status(500).send("Error al cargar el formulario de edición");
    }
  };

  // Método para procesar el formulario de edición
  export const actualizar = async (req, res) => {
    try {
      const { nombre, clave, permiso, dni, userId, sucursal } = req.body;

      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const usuariosData = await fs.promises.readFile(usuariosPath, "utf8");
      const usuarios = JSON.parse(usuariosData);

      const usuarioIndex = usuarios.findIndex((u) => u.id === parseInt(userId));

      if (usuarioIndex === -1) {
        return res.status(404).send("Usuario no encontrado");
      }

      // Verificar si el DNI ya existe en otro usuario (excepto el que se actualiza)
      const usuarioExistente = usuarios.find(
        (u, index) => u.dni === dni && index !== usuarioIndex
      );
      if (usuarioExistente) {
        return res.status(400).send("El usuario con ese DNI ya existe");
      }

      if(clave != null){
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(clave, saltRounds);
        usuarios[usuarioIndex].contraseña = hashedPassword;
      }

      usuarios[usuarioIndex].nombre = nombre;
      usuarios[usuarioIndex].permisos = parseInt(permiso);
      usuarios[usuarioIndex].dni = dni;
      usuarios[usuarioIndex].sucursal = parseInt(sucursal);

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al actualizar el usuario:", error.message);
      res.status(500).send("Error al actualizar el usuario");
    }
  };


export const eliminar = (req, res) => {
    try {
      const { id } = req.body;

      const usuariosPath = path.resolve(process.cwd(),"src/data/usuarios.json");
      const usuariosData = fs.readFileSync(usuariosPath, "utf8");
      const usuarios = JSON.parse(usuariosData);

      const usuarioIndex = usuarios.findIndex((u) => u.id === parseInt(id));

      if (usuarioIndex === -1) {
        return res.status(404).send("Usuario no encontrado");
      }

      // Cambiar el estado del usuario a inactivo
      usuarios[usuarioIndex].activo = false;

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error.message);
      res.status(500).send("Error al eliminar el usuario");
    }
};