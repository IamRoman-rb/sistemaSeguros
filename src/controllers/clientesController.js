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
    },
    nuevo: async (req, res) => {
      res.render('clientes/nuevo');
    },
    crearCliente: async (req, res) => {
      try {
        const { nombre, cuit, fecha_n, telefono, provincia, localidad, direccion } = req.body;

        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
        const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
        const clientes = JSON.parse(clientesData);

        // Verificar si el cliente ya existe
        const clienteExistente = clientes.find(cliente => cliente.cuit === cuit);

        if (clienteExistente) {
            return res.status(400).send('El cliente con ese CUIT ya existe.');
        }

        // Si el cliente no existe, lo creamos
        const nuevoCliente = {
            id: Date.now(),
            nombre, 
            cuit, 
            fecha_n, 
            telefono, 
            provincia, 
            localidad, 
            direccion,
            polizas: []
        };

        clientes.push(nuevoCliente);

        await fs.promises.writeFile(clientesPath, JSON.stringify(clientes, null, 2));

        res.redirect('/clientes');
    } catch (error) {
        console.error('Error al crear el cliente:', error.message);
        res.status(500).send('Error al crear el cliente');
    }
    },
    confirmar: async (req, res) => {
        const { id } = req.params;

        res.render('alertas/eliminarCliente', { clienteId: id });
    },
    eliminar: async (req, res) =>{
      try {
      const { id } = req.params;

      // Ruta al archivo JSON de clientes
      const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
      // Ruta al archivo JSON de pólizas
      const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");

      // Leer los datos de los archivos JSON
      const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
      const clientes = JSON.parse(clientesData);
      const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
      const polizas = JSON.parse(polizasData);

      // Filtrar los clientes para eliminar el que coincide con el ID
      const clientesFiltrados = clientes.filter(cliente => cliente.id !== Number(id));

      // Filtrar las pólizas que pertenecen al cliente a eliminar
      const polizasFiltradas = polizas.filter(poliza => !clientesFiltrados.some(cliente => cliente.polizas.includes(poliza.id)));

      // Escribir los clientes y pólizas filtrados en sus respectivos archivos JSON
      await fs.promises.writeFile(clientesPath, JSON.stringify(clientesFiltrados, null, 2));
      await fs.promises.writeFile(polizasPath, JSON.stringify(polizasFiltradas, null, 2));

      res.redirect('/clientes');
  } catch (error) {
      console.error('Error al eliminar el cliente:', error.message);
      res.status(500).send('Error al eliminar el cliente');
  }}
  };
  
  export default clientesController;