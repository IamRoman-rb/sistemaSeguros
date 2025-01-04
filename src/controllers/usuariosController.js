import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const usuariosController = {
  index: async (req, res) => {
    try {
        const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
        const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
        const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
        const permisosData = await fs.promises.readFile(permisosPath, 'utf8');
        const usuarios = JSON.parse(usuariosData);
        const permisos = JSON.parse(permisosData);

        // Agregar la descripción del permiso a cada usuario
        const usuariosConPermisos = usuarios.map(usuario => {
            const permiso = permisos.find(p => p.id === usuario.permisos);
            return {
                ...usuario,
                descripcionPermiso: permiso ? permiso.descripcion : 'Permiso no encontrado'
            };
        });

        res.render('usuarios/usuarios', { usuarios: usuariosConPermisos });
    } catch (error) {
        console.error('Error al cargar los usuarios:', error.message);
        res.status(500).send('Error al cargar los usuarios');
    }
},
    nuevo: async (req, res) => {
      const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
      const permisosData = await fs.promises.readFile(permisosPath, 'utf8');
      const permisos = JSON.parse(permisosData);
      
      res.render('usuarios/nuevo', { permisos: permisos }); // Renderiza la vista 'index.ejs'
    },
   
    crearUsuario: async (req, res) => {
        try {
            const { nombre, contraseña, permiso, dni } = req.body;
    
            const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
            const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
            const usuarios = JSON.parse(usuariosData);
    
            // Verificar si el usuario ya existe por DNI
            const usuarioExistente = usuarios.find(u => u.dni === dni);
            if (usuarioExistente) {
                return res.status(400).send('El usuario con ese DNI ya existe');
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
                dni
            };
    
            usuarios.push(nuevoUsuario);
    
            // Guardar los cambios en el archivo JSON
            fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    
            res.redirect('/usuarios');
        } catch (error) {
            console.error('Error al crear el usuario:', error.message);
            res.status(500).send('Error al crear el usuario');
        }
    },
    perfil: (req, res) => {
      res.render('usuarios/perfil'); // Renderiza la vista 'index.ejs'
    },
    detalleUsuario: async (req, res) => {
      try {
          const { id } = req.params; // Obtener el ID del usuario desde la URL
  
          const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
          const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
          const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
          const permisosData = await fs.promises.readFile(permisosPath, 'utf8');
          const usuarios = JSON.parse(usuariosData);
          const permisos = JSON.parse(permisosData);
  
          const usuario = usuarios.find(u => u.id === parseInt(id));
  
          if (!usuario) {
              return res.status(404).send('Usuario no encontrado');
          }
  
          const permiso = permisos.find(p => p.id === usuario.permisos);
  
          res.render('usuarios/detalle', { usuario, permiso });
      } catch (error) {
          console.error('Error al cargar el detalle del usuario:', error.message);
          res.status(500).send('Error al cargar el detalle del usuario');
      }
    },
    // ... (código existente)

// Método para mostrar el formulario de edición
editar: async (req, res) => {
  try {
      const { id } = req.params;

      const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
      const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
      const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
      const permisosData = await fs.promises.readFile(permisosPath, 'utf8');
      const usuarios = JSON.parse(usuariosData);
      const permisos = JSON.parse(permisosData);
      const usuario = usuarios.find(u => u.id === parseInt(id));

      if (!usuario) {
          return res.status(404).send('Usuario no encontrado');
      }

      const permiso = permisos.find(p => p.id === usuario.permisos);

      res.render('usuarios/editar', { usuario, permiso, permisos });
  } catch (error) {
      console.error('Error al cargar el formulario de edición:', error.message);
      res.status(500).send('Error al cargar el formulario de edición');
  }
},

// Método para procesar el formulario de edición
actualizar: async (req, res) => {
  try {
    const { id } = req.params;
      const {nombre, contraseña, permiso } = req.body;

      const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
      const permisosPath = path.resolve(process.cwd(), "src/data", "permisos.json");
      const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
      const permisosData = await fs.promises.readFile(permisosPath, 'utf8');
      const usuarios = JSON.parse(usuariosData);

      const usuarioIndex = usuarios.findIndex(u => u.id === parseInt(id));

      const permisoId = parseInt(permiso);

      if (usuarioIndex === -1) {
        return res.status(404).send('Usuario no encontrado');
      }
  
      usuarios[usuarioIndex].nombre = nombre;
      usuarios[usuarioIndex].contraseña = contraseña;
      usuarios[usuarioIndex].permisos = permisoId;

      // Guardar los cambios en el archivo JSON
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

      res.redirect('/usuarios');
  } catch (error) {
      console.error('Error al actualizar el usuario:', error.message);
      res.status(500).send('Error al actualizar el usuario');
  }
}
  };
  
  export default usuariosController;