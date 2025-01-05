import path from 'path';
import fs from 'fs';

const pagosController = {
index: async (req, res) => {
    try {
      const pagosPath = path.resolve(process.cwd(), "src/data", "pagos.json");
      const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
      const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
      const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");

      // Leer los datos de los archivos usando fs.promises.readFile
      const pagosData = await fs.promises.readFile(pagosPath, 'utf-8');
      const clientesData = await fs.promises.readFile(clientesPath, 'utf-8');
      const polizasData = await fs.promises.readFile(polizasPath, 'utf-8');
      const usuariosData = await fs.promises.readFile(usuariosPath, 'utf-8');

      const pagos = JSON.parse(pagosData);
      const clientes = JSON.parse(clientesData);
      const polizas = JSON.parse(polizasData);
      const usuarios = JSON.parse(usuariosData);

      // Enriquecer los datos de pagos con información de clientes, pólizas y cobradores
      const pagosConDetalles = pagos.map(pago => {
        const cliente = clientes.find(c => c.id === pago.id_cliente);
        const poliza = polizas.find(p => p.id === pago.id_poliza);
        const cobrador = usuarios.find(u => u.id === pago.id_cobrador);

        return {
          ...pago,
          cliente,
          poliza,
          cobrador,
        };
      });

      res.render("pagos/pagos", { pagos: pagosConDetalles });
    } catch (error) {
      console.error("Error al cargar los pagos:", error.message);
      res.status(500).send("Error al cargar los pagos");
    }
  },
  };
  
  export default pagosController;