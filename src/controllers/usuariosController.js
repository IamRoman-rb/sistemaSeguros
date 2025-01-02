const usuariosController = {
    index: (req, res) => {
      res.render('usuarios/usuarios'); // Renderiza la vista 'index.ejs'
    },
    nuevo: (req, res) => {
      res.render('usuarios/nuevo'); // Renderiza la vista 'index.ejs'
    },
    perfil: (req, res) => {
      res.render('usuarios/perfil'); // Renderiza la vista 'index.ejs'
    },
  };
  
  export default usuariosController;