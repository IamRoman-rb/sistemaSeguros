const polizasController = {
    index: (req, res) => {
      res.render('polizas/polizas'); // Renderiza la vista 'polizas.ejs'
    },
    nueva: (req, res) => {
      res.render('polizas/nueva');
    }
  };
  
  export default polizasController;
  