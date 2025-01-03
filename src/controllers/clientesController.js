import path from 'path';
import fs from 'fs';

const clientesController = {
    index: async (req, res) => {
      try {
        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
        const clientes = JSON.parse(clientesData);

        res.render('clientes/clientes', { clientes });
    } catch (error) {
        console.error('Error al cargar los clientes:', error.message);
        res.status(500).send('Error al cargar los clientes: ' + error.message);
    }
    },
    nuevo: (req, res) => {
      res.render('clientes/nuevo');
    },
    detalle: async (req, res) => {
      try {
        const { id } = req.params;

        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");

        const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
        const polizasData = await fs.promises.readFile(polizasPath, 'utf8');

        const clientes = JSON.parse(clientesData);
        const polizas = JSON.parse(polizasData);

        // Buscar al cliente por ID
        const cliente = clientes.find(cliente => cliente.id === Number(id));

        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        // Obtener las pólizas del cliente
        const polizasCliente = polizas.filter(poliza => cliente.polizas.includes(poliza.id));

        res.render('clientes/detalle', { cliente, polizasCliente });
    } catch (error) {
        console.error('Error al obtener los detalles del cliente:', error.message);
        res.status(500).send('Error al obtener los detalles del cliente');
    }
    }
  };
  
  export default clientesController;