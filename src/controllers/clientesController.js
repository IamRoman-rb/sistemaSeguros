const clientesController = {
    index: (req, res) => {
      res.render('clientes/clientes'); // Renderiza la vista 'index.ejs'
    },
    nuevo: (req, res) => {
      res.render('clientes/nuevo');
    }
  };
  
  export default clientesController;