import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";


export const listar = async (req, res) => {
    try {
      const empresasPath = path.resolve(
        process.cwd(),
        "src/data",
        "empresas.json"
      );
      const coberturasPath = path.resolve(
        process.cwd(),
        "src/data",
        "coberturas.json"
      );
      const empresasData = await fs.promises.readFile(empresasPath, "utf8");
      const empresas = JSON.parse(empresasData);

      const coberturasData = await fs.promises.readFile(coberturasPath, "utf-8");
      const coberturas = JSON.parse(coberturasData);

      const empresasConCoberturas = empresas.map(empresa => {
        const coberturasEmpresa = coberturas.filter(cobertura => cobertura.id_empresa === empresa.id);
        
        return {
            ...empresa,
            coberturas: coberturasEmpresa.map(c => c.coberturas)
        };
    });
    
      res.render("empresas/empresas", { empresas: empresasConCoberturas });
    } catch (error) {
      console.error("Error al cargar las empresas:", error.message);
      res.status(500).send("Error al cargar las empresas");
    }
  };
export const  nuevo = async (req, res) => {
    res.render("empresas/nueva");
  };

export const guardar = async (req, res) => {
    try {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).send("El campo nombre es obligatorio");
      }

      const empresasPath = path.resolve(
        process.cwd(),
        "src/data",
        "empresas.json"
      );
      const empresasData = await fs.promises.readFile(empresasPath, "utf8");
      const empresas = JSON.parse(empresasData);

      // Verificar si el usuario ya existe por DNI
      const empresaExistente = empresas.find((e) => e.nombre === nombre);
      if (empresaExistente) {
        return res.status(400).send("El usuario con ese DNI ya existe");
      }

      // Generar un nuevo ID
      const nuevoId = empresas.length + 1;

      const nuevaEmpresa = {
        id: nuevoId,
        nombre,
        coberturas: []
      };

      empresas.push(nuevaEmpresa);

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(empresasPath, JSON.stringify(empresas, null, 2));

      res.redirect("/empresas");
    } catch (error) {
      console.error("Error al crear una nueva empresa:", error.message);
      res.status(500).send("Error al crear una nueva empresa");
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