import path from "path";
import {readFile,writeFile} from "node:fs/promises";
import bcrypt from "bcrypt";


export const listar = async (req, res) => {
    try {
      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
        path.resolve(process.cwd(), "src/data", "permisos.json"),
        path.resolve(process.cwd(), "src/data", "sucursales.json"),
      ];
      let [usuarios, permisos, sucursales] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));
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
  const resources = [
    path.resolve(process.cwd(), "src/data", "permisos.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
  ];
  let [permisos, sucursales] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

    res.render("usuarios/nuevo", { permisos,sucursales }); // Renderiza la vista 'index.ejs'
  };

export const guardar = async (req, res) => {
    try {
      const { nombre, clave, permiso, dni,sucursal} = req.body;

      const usuariosPath = path.resolve(
        process.cwd(),
        "src/data",
        "usuarios.json"
      );
      const usuariosData = await readFile(usuariosPath, "utf8");
      const usuarios = JSON.parse(usuariosData);

      // Verificar si el usuario ya existe por DNI
      const usuarioExistente = usuarios.find((u) => u.dni === dni);
      if (usuarioExistente) {
        return res.status(400).send("El usuario con ese DNI ya existe");
      }

      // Encriptar la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(clave, saltRounds);

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
      await writeFile(usuariosPath, JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al crear el usuario:", error.message);
      res.status(500).send("Error al crear el usuario");
    }
  };

export const perfil = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "permisos.json")

  ];
  let [usuarios, polizas, pagos, sucursales, permisos] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))
  
  const usuario = usuarios.find((u) => u.id === req.session.user.id);

  if (!usuario) {
    return res.status(404).send("Usuario no encontrado");
  }

  usuario.permisos = permisos.find(p => p.id === Number(usuario.permisos));
  usuario.sucursal = sucursales.find(s => s.id === Number(usuario.sucursal));

  polizas = polizas.map(poliza => ({ ...poliza, pagos: pagos.filter(pago => pago.id_poliza === poliza.id)}));
  
  // polizas cobradas por el usuario

  polizas = polizas.filter(poliza => poliza.pagos.some(pago => pago.id_cobrador === usuario.id)); 

  // polizas cobradas por el usuario en año actual y mes actual

  let mesActual = polizas.filter(poliza => poliza.pagos.some(pago => new Date(pago.fecha).getFullYear() === new Date().getFullYear() && new Date(pago.fecha).getMonth() === new Date().getMonth()));

  res.render("usuarios/perfil", { usuario, polizas, mesActual });
} 

export const detalle =  async (req, res) => {
    try {
      const { id } = req.params; // Obtener el ID del usuario desde la URL

      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
        path.resolve(process.cwd(), "src/data", "permisos.json"),
        path.resolve(process.cwd(), "src/data", "sucursales.json"),
      ];
      let [usuarios, permisos, sucursales] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

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

      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
        path.resolve(process.cwd(), "src/data", "permisos.json"),
        path.resolve(process.cwd(), "src/data", "sucursales.json"),
      ];
      let [usuarios, permisos, sucursales] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

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

      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
      ];
      let [usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

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
      await writeFile(resources[0], JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al actualizar el usuario:", error.message);
      res.status(500).send("Error al actualizar el usuario");
    }
  };


export const eliminar = async (req, res) => {
    try {
      const { id } = req.body;

      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
      ];
      let [usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

      const usuarioIndex = usuarios.findIndex((u) => u.id === parseInt(id));

      if (usuarioIndex === -1) {
        return res.status(404).send("Usuario no encontrado");
      }

      // Cambiar el estado del usuario a inactivo
      usuarios[usuarioIndex].activo = false;

      // Guardar los cambios en el archivo JSON
      await writeFile(resources[0], JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error.message);
      res.status(500).send("Error al eliminar el usuario");
    }
};
export const habilitar = async (req, res) => {
    try {
      const { id } = req.body;

      const resources = [
        path.resolve(process.cwd(), "src/data", "usuarios.json"),
      ];
      let [usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

      const usuarioIndex = usuarios.findIndex((u) => u.id === parseInt(id));

      if (usuarioIndex === -1) {
        return res.status(404).send("Usuario no encontrado");
      }

      // Cambiar el estado del usuario a inactivo
      usuarios[usuarioIndex].activo = true;

      // Guardar los cambios en el archivo JSON
      await writeFile(resources[0], JSON.stringify(usuarios, null, 2));

      res.redirect("/usuarios");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error.message);
      res.status(500).send("Error al eliminar el usuario");
    }
};