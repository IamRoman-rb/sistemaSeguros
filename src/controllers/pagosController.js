import path from 'path';
import fs from 'fs';

const pagosController = {
  index: async (req, res) => {
    const pagosPath = path.resolve(process.cwd(), "src/data", "pagos.json");
    const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const usuariosPath = path.resolve(process.cwd(), "src/data", "usuarios.json");
  
    try {
      // Read and parse the payments data
      const pagosData = await fs.promises.readFile(pagosPath, "utf8");
      const clientesData = await fs.promises.readFile(clientesPath, 'utf8');
      const polizasData = await fs.promises.readFile(polizasPath, 'utf8');
      const usuariosData = await fs.promises.readFile(usuariosPath, 'utf8');
  
      // Parse the data (handle potential parsing errors)
      let pagos;
      let clientes;
      let polizas;
      let usuarios;
      try {
        pagos = JSON.parse(pagosData);
        clientes = JSON.parse(clientesData);
        polizas = JSON.parse(polizasData);
        usuarios = JSON.parse(usuariosData);
      } catch (parseError) {
        console.error('Error al parsear los datos:', parseError);
        res.status(500).send('Error interno del servidor (datos corruptos)');
        return; // Exit the function if parsing fails
      }
  
      // Map payments to enriched objects with details
      const pagosConDetalles = pagos.map(async (pago) => {
        const [cliente, poliza, cobrador] = await Promise.all([
          clientes.find(c => c.id === pago.id_cliente),
          polizas.find(p => p.id === pago.id_poliza),
          usuarios.find(u => u.id === parseInt(pago.id_cobrador)),
        ]);
  
        // Handle cases where details might not be found
        return {
          ...pago,
          cliente: cliente || { nombre: 'Cliente no encontrado' }, // Default value for missing client
          poliza: poliza || { n_poliza: 'Póliza no encontrada' }, // Default value for missing policy
          cobrador: cobrador || { nombre: 'Cobrador no encontrado' }, // Default value for missing cobrador
        };
      });
       

      // Wait for all promises to resolve before rendering
      const pagosEnriquecidos = await Promise.all(pagosConDetalles);
  
      res.render('pagos/pagos', { pagos: pagosEnriquecidos });
    } catch (error) {
      console.error('Error al procesar los datos:', error);
      res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
    }
  },
  nuevo: async (req, res) => {
        try {
            const { busqueda } = req.query || {};
    
            const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");
            const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
            
            // Leer los datos de clientes
            const clientesData = await fs.promises.readFile(clientesPath, "utf8");
            const clientes = JSON.parse(clientesData);
    
            // Leer los datos de pólizas
            const polizasData = await fs.promises.readFile(polizasPath, "utf8");
            const polizas = JSON.parse(polizasData);
    
            // Añadir el cliente correspondiente a cada póliza
            const polizasConClientes = polizas.map((poliza) => {
                const cliente = clientes.find((c) => c.polizas.includes(poliza.id));
                return {
                    ...poliza,
                    cliente,
                };
            });
    
            // Filtrar las pólizas si hay un término de búsqueda
            let polizasFiltradas = polizasConClientes;
            if (busqueda) {
                const busquedaLower = busqueda.toLowerCase();
                polizasFiltradas = polizasConClientes.filter((poliza) => {
                    return (
                        (poliza.cliente && poliza.cliente.nombre.toLowerCase().includes(busquedaLower)) ||
                        (poliza.n_poliza && poliza.n_poliza.toString().includes(busqueda)) ||
                        (poliza.patente && poliza.patente.toLowerCase().includes(busquedaLower))
                    );
                });
            }
    
            // Renderizar la vista con las pólizas filtradas y la búsqueda (si existe)
            res.render("pagos/nuevo", { polizas: polizasFiltradas, busqueda });
        } catch (error) {
            console.error("Error al cargar las pólizas:", error.message);
            res.status(500).send("Error al cargar las pólizas: " + error.message);
        }
  },
  pagarPoliza: async (req, res) => {
    const { id } = req.params;
    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const clientesPath = path.resolve(process.cwd(), "src/data", "clientes.json");

    // Leer los datos de los archivos
    const polizasData = await fs.promises.readFile(polizasPath, 'utf-8');
    const clientesData = await fs.promises.readFile(clientesPath, 'utf-8');
    const polizas = JSON.parse(polizasData);
    const clientes = JSON.parse(clientesData);

    // Encontrar la póliza por ID
    const poliza = polizas.find(poliza => poliza.id === parseInt(id));

    if (!poliza) {
        return res.status(404).send('Póliza no encontrada');
    }

    // Encontrar el cliente correspondiente a la póliza
    const cliente = clientes.find(cliente => cliente.id === parseInt(poliza.clienteId));

    // Enviar la póliza y el cliente a la vista
    res.render('pagos/pagarPoliza', { poliza, cliente });
},
realizarPago: async (req, res) => {
  try {
    const id = req.body.polizaId;

    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const pagosPath = path.resolve(process.cwd(), "src/data", "pagos.json");

    // Obtener el usuario autenticado desde la sesión o el sistema de autenticación
    const usuarioAutenticado = req.user; // Asegúrate de que `req.user` contiene la información del usuario
    if (!usuarioAutenticado) {
      return res.status(401).send("Usuario no autenticado.");
    }

    // Leer los datos de los archivos
    const [polizasData, pagosData] = await Promise.all([
      fs.promises.readFile(polizasPath, "utf-8"),
      fs.promises.readFile(pagosPath, "utf-8"),
    ]);

    const polizas = JSON.parse(polizasData);
    const pagos = JSON.parse(pagosData);

    // Encontrar la póliza
    const poliza = polizas.find((p) => p.id === parseInt(id));
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada.");
    }

    // Generar un nuevo ID para el pago
    const nuevoIdPago = pagos.length > 0 ? Math.max(...pagos.map((p) => p.id || 0)) + 1 : 1;

    // Crear el objeto del pago
    const fecha = new Date();
    const pago = {
      id: nuevoIdPago, // ID del pago
      id_cliente: parseInt(poliza.clienteId), // ID del cliente de la póliza
      id_poliza: poliza.id, // ID de la póliza
      n_poliza: poliza.n_poliza, // Número de póliza
      fecha: fecha.toISOString().split("T")[0], // Fecha en formato YYYY-MM-DD
      hora: `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}`, // Hora actual
      monto: poliza.precio, // Precio de la póliza
      cuota: (poliza.cuotasPagas || 0) + 1, // Incrementar cuotas pagadas
      id_cobrador: usuarioAutenticado.id, // ID del usuario autenticado
    };

    // Actualizar el archivo de pagos
    pagos.push(pago);
    await fs.promises.writeFile(pagosPath, JSON.stringify(pagos, null, 2));

    // Actualizar la póliza con las cuotas pagadas
    poliza.cuotasPagas = pago.cuota;
    await fs.promises.writeFile(polizasPath, JSON.stringify(polizas, null, 2));

    // Redirigir a la lista de pagos o a una vista de confirmación
    res.redirect("/pagos");
  } catch (error) {
    console.error("Error al realizar el pago:", error.message);
    res.status(500).send("Error al realizar el pago.");
  }
}

};
  
  export default pagosController;