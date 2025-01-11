/*

Vistas:
- Caja
- Ingresos
- Egresos
- Resumen

- Caja filtrada por el mes actual y el año actual
  - Listado de los ingresos
    - Listado de las pagos de las polizas realizadas en efectivo
    - Otros ingresos que se hacen en efectivo que no sean pagos de polizas
  - Listado de los egresos
    - Listado de las pagos de las polizas realizadas en transferencia
    - Otros egresos que no sean pagos de polizas : transferencias y servicios
  - Listado de los pagos de las polizas
- Ingresos (formulario de ingreso)
- Egresos (formulario de egreso)
- Resumen de la caja del dia
  - Sumatoria de los ingresos
  - Sumatoria de los egresos
  - Balance = Ingresos - Egresos ( al final del dia tiene que ser 0)


*/


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