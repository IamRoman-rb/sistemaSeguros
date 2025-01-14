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
    let [pagos, clientes, polizas, usuarios]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === parseInt(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    if(["Empleado"].includes(req.session.user.rol)) {
      pagos = pagos.filter(pago => pago.cobrador.id === req.session.user.id);
    }

    res.render('pagos/pagos', { pagos });
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
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios, provincias, ciudades, coberturas, automarcas, sucursales, empresas]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === Number(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    const pago = pagos.find(p => p.id === Number(id));

    if (!pago) {
      return res.status(404).send('Pago no encontrado');
    }

    pago.cliente.provincia = provincias.find(p => p.id == Number(pago.cliente.provincia));
    pago.cliente.localidad = ciudades.find(c => c.id == Number(pago.cliente.localidad));
    pago.poliza.cobertura = coberturas.find(c => c.id == Number(pago.poliza.cobertura));
    pago.poliza.marca = automarcas.find(a => a.id == Number(pago.poliza.marca));
    pago.poliza.empresa = empresas.find(e => e.id == Number(pago.poliza.empresa));
    pago.cobrador.sucursal = sucursales.find(s => s.id == Number(pago.cobrador.sucursal));

    res.render('pagos/pago', { pago });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};

export const recibo = async (req, res) => {
  const { id } = req.params;

  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios, provincias, ciudades, coberturas, automarcas, sucursales, empresas]= await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));


    pagos = pagos.map(pago => ({
      ...pago,
      cliente: clientes.find(c => c.id === pago.id_cliente) || { nombre: 'Cliente no encontrado' },
      poliza: polizas.find(p => p.id === pago.id_poliza) || { n_poliza: 'Póliza no encontrada' },
      cobrador: usuarios.find(u => u.id === Number(pago.id_cobrador)) || { nombre: 'Cobrador no encontrado' },
    }));

    const pago = pagos.find(p => p.id === Number(id));

    if (!pago) {
      return res.status(404).send('Pago no encontrado');
    }

    pago.cliente.provincia = provincias.find(p => p.id == Number(pago.cliente.provincia));
    pago.cliente.localidad = ciudades.find(c => c.id == Number(pago.cliente.localidad));
    pago.poliza.cobertura = coberturas.find(c => c.id == Number(pago.poliza.cobertura));
    pago.poliza.marca = automarcas.find(a => a.id == Number(pago.poliza.marca));
    pago.poliza.empresa = empresas.find(e => e.id == Number(pago.poliza.empresa));
    pago.cobrador.sucursal = sucursales.find(s => s.id == Number(pago.cobrador.sucursal));

    res.render('pagos/recibo', { pago });
  } catch (error) {
    console.error('Error al procesar los datos:', error);
    res.status(500).send('Error interno del servidor'); // Handle unexpected errors gracefully
  }
};


export const pagar = async (req, res) => {
  const { id } = req.params;
  const resources = [
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
  ];
  const [polizas, clientes, provincias, ciudades, coberturas, automarcas, pagos, empresas] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

  // Encontrar la póliza por ID
  const poliza = polizas.find(poliza => poliza.id === parseInt(id));
  if (!poliza) return res.status(404).send('Póliza no encontrada');

  // Encontrar el cliente correspondiente a la póliza
  const cliente = clientes.find(cliente => cliente.id === parseInt(poliza.clienteId));
  if (!cliente) return res.status(404).send('Cliente no encontrado');

  cliente.provincia = provincias.find(({ id }) => id == Number(cliente.provincia));
  cliente.localidad = ciudades.find(({ id }) => id == Number(cliente.localidad));
  poliza.cobertura = coberturas.find(({ id }) => id == Number(poliza.cobertura));
  poliza.marca = automarcas.find(({ id }) => id == Number(poliza.marca));
  poliza.pagos = pagos.filter(pago => pago.id_poliza === poliza.id);
  poliza.empresa = empresas.find(({ id }) => id == Number(poliza.empresa));

  // Enviar la póliza y el cliente a la vista
  res.render('pagos/pagar', { poliza, cliente });
};

export const acreditar = async (req, res) => {
  try {
    const {polizaId} = req.body;

    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
    ];
    const [polizas, pagos] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, 'utf-8'))));

    // Encontrar la póliza
    const poliza = polizas.find((p) => p.id === parseInt(polizaId));
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada.");
    }

    // Crear el objeto del pago
    const fecha = new Date();
    const pago = {
      id: fecha.getTime(), // ID del pago
      id_cliente: Number(poliza.clienteId), // ID del cliente de la póliza
      id_poliza: Number(poliza.id), // ID de la póliza
      n_poliza:  Number(poliza.n_poliza), // Número de póliza
      fecha: fecha.toISOString().split('T')[0], // Fecha en formato YYYY-MM-DD
      hora: `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}`, // Hora actual
      valor: Number(poliza.precio), // Premio de la póliza
      forma_pago: req.body.metodo,
      observaciones: req.body.observaciones,
      id_cobrador: Number(req.session.user.id), // ID del cobrador 
    };

    // Actualizar el archivo de pagos
    pagos.push(pago);
    await writeFile(resources[1], JSON.stringify(pagos, null, 2));

    // Actualizar la póliza con las cuotas pagadas
    polizas[polizas.findIndex((p) => p.id === Number(polizaId))].pagos.push(pago.id);
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));

    // Redirigir a la lista de pagos o a una vista de confirmación
    res.redirect(`/polizas/detalle/${polizaId}`);
  } catch (error) {
    console.error("Error al realizar el pago:", error.message);
    res.status(500).send("Error al realizar el pago.");
  }
};

export const eliminar = async (req, res) => {
  try {
    const { pagoId, polizaId } = req.body;
    const resources = [
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
    ];
    let [pagos, polizas] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, "utf-8"))));

    // Encontrar el pago
    const pago = pagos.findIndex((p) => p.id === Number(pagoId));
    if (pago === -1) {
      return res.status(404).send("Pago no encontrado.");
    }
    // Desconocer el pago
    pagos[pago].desconocido = true;

    // Actualizar el archivo de pagos
    await writeFile(resources[0], JSON.stringify(pagos, null, 2));

    // Redirigir a la lista de pagos o a una vista de confirmación
    res.redirect(`/polizas/detalle/${polizaId}`);
  } catch (error) {
    console.error("Error al eliminar el pago:", error.message);
    res.status(500).send("Error al eliminar el pago.");
  }
};
