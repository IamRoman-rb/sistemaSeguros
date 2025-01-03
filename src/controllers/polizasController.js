import path from "path";
import fs from "fs";
const polizasController = {
    index: async (req, res) => {
      try {
        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        console.log(polizasPath);
        
        const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
        const polizas = JSON.parse(polizasData);
  
        res.render('polizas/polizas', { polizas });
      } catch (error) {
        console.error('Error al cargar las pólizas:', error.message);
        res.status(500).send('Error al cargar las pólizas: ' + error.message);
      }
    },
    nueva: async (req, res) => {
      try {
          const { id } = req.params; // Obtener el ID del cliente desde la URL
          console.log('ID recibido:', id);
  
          const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
          const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
          const clientes = JSON.parse(clientesData);
  
          console.log('Clientes disponibles:', clientes);
  
          // Buscar al cliente por ID (asegúrate de que ambos sean cadenas)
          const cliente = clientes.find(cliente => cliente.id.toString() === id);
  
          if (!cliente) {
              return res.status(404).send('Cliente no encontrado');
          }
  
          res.render('polizas/nueva', { cliente });
      } catch (error) {
          console.error('Error al cargar el cliente:', error.message);
          res.status(500).send('Error al cargar el cliente: ' + error.message);
      }
  },
  crearPoliza: async (req, res) => {
    try {
        const { id } = req.params; // ID del cliente desde la URL
        const nuevaPoliza = {
            n_poliza: req.body.n_poliza,
            f_emision: req.body.f_emision,
            f_ini_vigencia: req.body.f_ini_vigencia,
            f_fin_vigencia: req.body.f_fin_vigencia,
            suma: req.body.suma,
            cuotas: req.body.cuotas,
            empresa: req.body.empresa,
            precio: req.body.precio,
            marca: req.body.marca,
            modelo: req.body.modelo,
            patente: req.body.patente,
            anio: req.body.anio,
            n_chasis: req.body.n_chasis,
            n_motor: req.body.n_motor,
            combustible: req.body.combustible,
            clienteId: id // Asociar la póliza al cliente
        };

        const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
        const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");

        // Leer clientes para verificar que el cliente existe
        const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
        const clientes = JSON.parse(clientesData);

        const cliente = clientes.find(cliente => cliente.id.toString() === id);
        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }

        // Leer pólizas existentes
        const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
        const polizas = JSON.parse(polizasData);

        // Generar un nuevo ID para la póliza
        const nuevoIdPoliza = polizas.length > 0 ? Math.max(...polizas.map(p => p.id)) + 1 : 1;
        nuevaPoliza.id = nuevoIdPoliza;

        // Agregar la nueva póliza a las pólizas existentes
        polizas.push(nuevaPoliza);

        // Guardar el nuevo archivo de pólizas
        await fs.promises.writeFile(polizasPath, JSON.stringify(polizas, null, 2));

        // Agregar el ID de la nueva póliza al cliente correspondiente
        cliente.polizas.push(nuevaPoliza.id);

        // Actualizar el archivo de clientes con el nuevo ID de póliza
        await fs.promises.writeFile(clientesPath, JSON.stringify(clientes, null, 2));

        res.redirect('/polizas'); // Redirige a la lista de pólizas
    } catch (error) {
        console.error('Error al guardar la póliza:', error.message);
        res.status(500).send('Error al guardar la póliza: ' + error.message);
    }
},
    buscarCliente: async (req, res) => {
      try {
          const { nombre } = req.query || {};
          const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
  
          const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
          const clientes = JSON.parse(clientesData);
  
          const clientesEncontrados = nombre
              ? clientes.filter(cliente =>
                    cliente.nombre.toLowerCase().includes(nombre.toLowerCase()))
              : [];
          console.log(clientesEncontrados);
          
          res.render('polizas/buscarCliente', { clientes: clientesEncontrados });
      } catch (error) {
          console.error('Error al buscar clientes:', error.message);
          res.render('polizas/buscarCliente', { clientes: [] });
      }
  }
  
  };
  
  export default polizasController;
  