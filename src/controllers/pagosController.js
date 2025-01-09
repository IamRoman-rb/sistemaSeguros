import path from 'path';
import {readFile,writeFile} from 'node:fs/promises';

export const listar = async (req, res) => {

  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    const [pagos, clientes, polizas, usuarios]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    let pagosConDetalles = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === parseInt(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));


    if(["Empleado"].includes(req.session.user.rol)) {
      pagosConDetalles = pagosConDetalles.filter(pago => pago.cobrador.id === req.session.user.id);
    }


    res.render('pagos/pagos', { pagos: pagosConDetalles });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};

  export const detalle = async (req, res) => {
    const { id } = req.params;
  
    const resources = [
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];
  
    try {
      const [pagosData, clientesData, polizasData, usuariosData] = await Promise.all(resources.map(readFile));
  
      const [pagos, clientes, polizas, usuarios] = await Promise.all([
        pagosData.then(JSON.parse),
        clientesData.then(JSON.parse),
        polizasData.then(JSON.parse),
        usuariosData.then(JSON.parse),
      ]);
  
      const pagosEnriquecidos = pagos.map(pago => ({
        ...pago,
        cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
        poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
        cobrador: usuarios.find(u => u.id === parseInt(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
      }));
  
      const pago = pagosEnriquecidos.find(p => p.id === parseInt(id));
  
      if (!pago) {
        return res.status(404).send('Pago no encontrado');
      }
  
      res.render('pagos/detalle', { pago });
    } catch (error) {
      console.error('Error al procesar los datos:', error);
      res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
    }
  };

  export const nuevo = async (req, res) => {
    const {parametro=null, busqueda=null} = req.query;
    const resources = [
     path.resolve(process.cwd(), "src/data", "clientes.json"),
     path.resolve(process.cwd(), "src/data", "polizas.json"),
    ];
    const [clientes, polizas]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    const polizasConClientes = polizas.map((poliza) => ({
      ...poliza,
      cliente: clientes.find((c) => c.polizas.includes(poliza.id)),
    }));

    const hoy = new Date();

    if( parametro && busqueda){
      const polizasFiltradas = polizasConClientes.filter((poliza) => {
        const busquedaLower = busqueda.toLowerCase();
        switch (parametro) {
          case "n_poliza":
            return poliza.n_poliza && poliza.n_poliza.toString().includes(busqueda);
          case "patente":
            return poliza.patente && poliza.patente.toLowerCase().includes(busquedaLower);
          case "cliente":
            return poliza.cliente && poliza.cliente.nombre.toLowerCase().includes(busquedaLower);
          default:
            return false;
        }
      })
     return res.render("pagos/nuevo", { polizas: polizasFiltradas, busqueda, parametro });
    }
    const polizasFiltradas = polizasConClientes.filter((poliza) => {
      const fechaVigencia = new Date(poliza.f_fin_vigencia);
      const diferencia = fechaVigencia.getTime() - hoy.getTime();
      return diferencia > 0 && diferencia < 31 * 24 * 60 * 60 * 1000;
    });

    //return res.status(200).json({ polizas: polizasFiltradas, busqueda, parametro });
    return res.render("pagos/nuevo", { polizas: polizasFiltradas, busqueda, parametro });
  };

  export const pagar = async (req, res) => {
    const { id } = req.params;
    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "clientes.json"),
    ];
    const [polizas, clientes] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    // Encontrar la póliza por ID
    const poliza = polizas.find(poliza => poliza.id === parseInt(id));
    if (!poliza) return res.status(404).send('Póliza no encontrada');

    // Encontrar el cliente correspondiente a la póliza
    const cliente = clientes.find(cliente => cliente.id === parseInt(poliza.clienteId));

    // Enviar la póliza y el cliente a la vista
    res.render('pagos/pagarPoliza', { poliza, cliente });
  };
export const acreditar = async (req, res) => {
  try {
    const {polizaId:id} = req.body;

    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
    ];
    const [polizas, pagos] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

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
      id_cobrador: req.session.user.id, // ID del usuario autenticado
    };

    // Actualizar el archivo de pagos
    pagos.push(pago);
    await writeFile(resources[1], JSON.stringify(pagos, null, 2));

    // Actualizar la póliza con las cuotas pagadas
    poliza.cuotasPagas = pago.cuota;
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));

    // Redirigir a la lista de pagos o a una vista de confirmación
    res.redirect("/pagos");
  } catch (error) {
    console.error("Error al realizar el pago:", error.message);
    res.status(500).send("Error al realizar el pago.");
  }
}
