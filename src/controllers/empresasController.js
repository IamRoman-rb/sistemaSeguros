import path from "path";
import fs from "fs";

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

    res.render("empresas/empresas", { empresas, coberturas });
  } catch (error) {
    console.error("Error al cargar las empresas:", error.message);
    res.status(500).send("Error al cargar las empresas");
  }
};
export const nuevo = async (req, res) => {
  const coberturasPath = path.resolve(
    process.cwd(),
    "src/data",
    "coberturas.json"
  );

  const coberturasData = await fs.promises.readFile(coberturasPath, "utf-8");
  const coberturas = JSON.parse(coberturasData);

  res.render("empresas/nueva", { coberturas });
};

export const guardar = async (req, res) => {
  try {
    const { nombre, coberturas } = req.body;

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

    // Crear la nueva empresa
    const nuevaEmpresa = {
      id: nuevoId,
      nombre,
      coberturas: coberturas.map(cobertura => parseInt(cobertura)),
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

export const detalle = async (req, res) => {
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

    const coberturasData = await fs.promises.readFile(coberturasPath, "utf8");
    const coberturas = JSON.parse(coberturasData);

    const empresa = empresas.find((e) => e.id === parseInt(id));

    res.render("empresas/editar", { empresa, coberturas });
  } catch (error) {
    console.error("Error al cargar el formulario de edición:", error.message);
    res.status(500).send("Error al cargar el formulario de edición");
  }
};

// Método para procesar el formulario de edición
export const actualizar = async (req, res) => {
  try {
    let { id, nombre, coberturas } = req.body;    

    if (coberturas) {
      if (coberturas.length <= 1) {
        coberturas = [coberturas];
      }
    }else{
      coberturas = [];
    }

    const empresasPath = path.resolve(
        process.cwd(),
        "src/data",
        "empresas.json"
    );

    const empresasData = await fs.promises.readFile(empresasPath, "utf8");
    const empresas = JSON.parse(empresasData);

    const empresaIndex = empresas.findIndex(empresa => empresa.id === parseInt(id));   

    if (empresaIndex === -1) {
        return res.status(404).send('Empresa no encontrada');
    }

    const empresa = empresas[empresaIndex];

    // Actualizar los campos
    empresa.nombre = nombre;
    empresa.coberturas = coberturas.map(c => parseInt(c));

    // Guardar los cambios
    fs.writeFileSync(empresasPath, JSON.stringify(empresas, null, 2));

    res.redirect("/empresas");
} catch (error) {
    console.error("Error al actualizar la empresa:", error);
    res.status(500).send("Error al actualizar la empresa");
}
};

export const eliminar = (req, res) => {
  try {
    const { id } = req.body;

    const usuariosPath = path.resolve(process.cwd(), "src/data/usuarios.json");
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


// FALTA ELIMINAR, EDITAR, ACTUALIZAR