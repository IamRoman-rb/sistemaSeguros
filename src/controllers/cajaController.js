const cajaController = {
    index: (req, res) => {
      res.render('caja/caja'); // Renderiza la vista 'index.ejs'
    },
    ingreso: (req, res) => {
      res.render('caja/ingresos');
    },
    resumen: (req, res) => {
      res.render('caja/resumen');
    }
  };
  
  export default cajaController;