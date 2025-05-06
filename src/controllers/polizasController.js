import path from "path";
import { readFile, writeFile } from "node:fs/promises";
import { DateTime } from 'luxon';

export const listado = async (req, res) => {
  try {
    let { busqueda = null } = req.query || {};

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json")
    ]

    let [clientes, polizas, coberturas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    // Añadir el cliente correspondiente a cada póliza
    polizas = polizas.map((poliza) => {
      const cliente = clientes.find((c) => c.polizas.includes(poliza.id));
      const cobertura = coberturas.find((c) => c.id === Number(poliza.cobertura))
      return {
        ...poliza,
        cliente,
        cobertura
      };
    });

    // Filtrar las pólizas si hay un término de búsqueda
    if (busqueda) {
      busqueda = busqueda.trim().toLowerCase();
      polizas = polizas.filter((poliza) => {
        return (
          (poliza.cliente && poliza.cliente.nombre.toLowerCase().includes(busqueda)) ||
          (poliza.cliente && poliza.cliente.cuit.toLowerCase().includes(busqueda)) ||
          (poliza.n_poliza && poliza.n_poliza.toString().includes(busqueda)) ||
          (poliza.patente && poliza.patente.toLowerCase().includes(busqueda))
        );
      });
    }
    // Renderizar la vista con las pólizas filtradas y la búsqueda (si existe)
    return res.render("polizas/polizas", { polizas, busqueda });
  } catch (error) {
    console.error("Error al cargar las pólizas:", error.message);
    res.status(500).send("Error al cargar las pólizas: " + error.message);
  }
};

export const nueva = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del cliente desde la URL
    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "automarcas.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ]

    let [clientes, autos, empresas, coberturas, usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    // Buscar al cliente por ID (asegúrate de que ambos sean cadenas)
    const cliente = clientes.find((cliente) => cliente.id.toString() === id);

    if (!cliente) {
      return res.status(404).send("Cliente no encontrado");
    }

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find(user => user.id == usuario.id);

    

    res.render("polizas/nueva", { cliente, autos, empresas, coberturas, usuario: usuario_filtrado});
  } catch (error) {
    console.error("Error al cargar el cliente:", error.message);
    res.status(500).send("Error al cargar el cliente: " + error.message);
  }
};

export const guardar = async (req, res) => {
  try {
    const { body, session } = req;
    const userId = session.user?.id;

    // 1. Validación básica
    if (!userId || !body.clientId || isNaN(Number(body.clientId))) {
      return res.status(400).render('error', {
        title: 'Datos incompletos',
        message: 'Faltan datos requeridos para crear la póliza',
        user: session.user
      });
    }

    // 2. Definir paths de archivos
    const dataPaths = {
      polizas: path.resolve(process.cwd(), "src/data", "polizas.json"),
      clientes: path.resolve(process.cwd(), "src/data", "clientes.json"),
      actividades: path.resolve(process.cwd(), "src/data", "actividades.json")
    };

    // 3. Cargar datos necesarios
    const [polizas, clientes, actividades] = await Promise.all([
      readFile(dataPaths.polizas, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.clientes, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.actividades, 'utf-8').then(JSON.parse).catch(() => [])
    ]);

    // 4. Validar cliente existe
    const cliente = clientes.find(c => c.id === Number(body.clientId));
    if (!cliente) {
      return res.status(404).render('error', {
        title: 'Cliente no encontrado',
        message: 'El cliente asociado no existe en el sistema',
        user: session.user
      });
    }

    // 5. Crear nueva póliza (con validación de tipos)
    const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const fVencimiento = DateTime.fromISO(body.f_ini_vigencia)
      .setZone('America/Argentina/Buenos_Aires')
      .plus({ months: Number(body.periodo) });

    const nuevaPoliza = {
      id: polizas.length > 0 ? Math.max(...polizas.map(p => p.id)) + 1 : 1,
      n_poliza: body.n_poliza,
      f_emision: ahoraArgentina.toFormat('yyyy-MM-dd'),
      f_ini_vigencia: body.f_ini_vigencia,
      f_fin_vigencia: fVencimiento.toFormat('yyyy-MM-dd'),
      periodo: Number(body.periodo),
      suma: Number(body.suma),
      cuotas: Number(body.cuotas),
      usos: body.usos,
      empresa: Number(body.empresa),
      precio: Number(body.precio),
      cobertura: body.cobertura,
      marca: Number(body.marca),
      modelo: body.modelo,
      patente: body.patente,
      anio: Number(body.anio),
      n_chasis: body.n_chasis,
      n_motor: body.n_motor,
      combustible: body.combustible,
      clienteId: Number(body.clientId),
      sucursal: body.sucursal,
      pagos: [],
      usuario: userId
    };

    // 6. Registrar actividad
    const nuevaActividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: nuevaPoliza.id,
      accion: "Creación de póliza",
      id_usuario: userId,
      fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
      hora: ahoraArgentina.toFormat('HH:mm:ss'),
      tipo: 'poliza'
    };

    // 7. Preparar datos actualizados (inmutables)
    const polizasActualizadas = [...polizas, nuevaPoliza];
    const actividadesActualizadas = [...actividades, nuevaActividad];
    const clientesActualizados = clientes.map(c => 
      c.id === Number(body.clientId) 
        ? { ...c, polizas: [...(c.polizas || []), nuevaPoliza.id] } 
        : c
    );

    // 8. Guardar todos los cambios atómicamente
    await Promise.all([
      writeFile(dataPaths.polizas, JSON.stringify(polizasActualizadas, null, 2)),
      writeFile(dataPaths.clientes, JSON.stringify(clientesActualizados, null, 2)),
      writeFile(dataPaths.actividades, JSON.stringify(actividadesActualizadas, null, 2))
    ]);

    // 9. Redirigir con feedback
    req.session.flash = {
      type: 'success',
      message: 'Póliza creada exitosamente'
    };
    res.redirect("/polizas");

  } catch (error) {
    console.error("Error al guardar póliza:", error);
    res.status(500).render('error', {
      title: "Error al guardar",
      message: "Ocurrió un error al crear la póliza",
      error: process.env.NODE_ENV === 'development' ? error : null,
      user: req.session.user
    });
  }
};

export const detalle = async (req, res) => {
  try {
    const { id } = req.params; // ID de la póliza desde la URL

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "automarcas.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];

    const [clientes, polizas, pagos, ciudades, provincias, automarcas, sucursales, empresas, coberturas, usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, "utf-8"))));


    // Buscar la póliza por ID
    let poliza = polizas.find((p) => p.id.toString() === id);
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Buscar el cliente asociado a la póliza
    let cliente = clientes.find((c) => c.polizas.includes(Number(id)));
    if (!cliente) {
      return res.status(404).send("Cliente asociado no encontrado");
    }

    cliente.provincia = provincias.find((p) => p.id === Number(cliente.idprovincia));
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    poliza.marca = automarcas.find((a) => a.id === Number(poliza.marca));
    if (poliza.pagos.length > 0) {
      poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    }
    poliza.cobertura = coberturas.find((c) => c.id === Number(poliza.cobertura));
    // Renderizar la vista con los detalles

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find(user => user.id == usuario.id);       

    res.render("polizas/detalle", { poliza, cliente, id: usuario_filtrado.sucursal });

  } catch (error) {
    console.error("Error al obtener el detalle de la póliza:", error.message);
    res
      .status(500)
      .send("Error al obtener el detalle de la póliza: " + error.message);
  }
};

export const confirmar = async (req, res) => {
  try {
    const { id } = req.params; // ID de la póliza desde la URL
    const usuario = req.session.user
    
    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "automarcas.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json"),
    ];

    const [clientes, polizas, pagos, ciudades, provincias, automarcas, sucursales, empresas, coberturas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, "utf-8"))));


    // Buscar la póliza por ID
    let poliza = polizas.find((p) => p.id.toString() === id);
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Buscar el cliente asociado a la póliza
    let cliente = clientes.find((c) => c.polizas.includes(Number(id)));
    if (!cliente) {
      return res.status(404).send("Cliente asociado no encontrado");
    }

    cliente.provincia = provincias.find((p) => p.id === Number(cliente.idprovincia));
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    poliza.marca = automarcas.find((a) => a.id === Number(poliza.marca));
    poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    poliza.cobertura = coberturas.find((c) => c.id === Number(poliza.cobertura));
    // Renderizar la vista de confirmación desde alertas
    res.render("polizas/confirmar", { poliza, cliente, usuario });
  } catch (error) {
    console.error("Error al confirmar eliminación:", error.message);
    res.status(500).send("Error al confirmar eliminación: " + error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.session.user?.id;

    // 1. Validación de entrada
    if (!id || isNaN(Number(id))) {
      return res.status(400).render('error', {
        title: 'ID inválido',
        message: 'El ID de póliza proporcionado no es válido',
        user: req.session.user
      });
    }

    if (!userId) {
      return res.status(401).render('error', {
        title: 'No autorizado',
        message: 'Debe iniciar sesión para realizar esta acción',
        user: req.session.user
      });
    }

    // 2. Definir paths de archivos
    const dataPaths = {
      polizas: path.resolve(process.cwd(), "src/data", "polizas.json"),
      pagos: path.resolve(process.cwd(), "src/data", "pagos.json"),
      clientes: path.resolve(process.cwd(), "src/data", "clientes.json"),
      actividades: path.resolve(process.cwd(), "src/data", "actividades.json")
    };

    // 3. Cargar datos necesarios
    const [polizas, pagos, clientes, actividades] = await Promise.all([
      readFile(dataPaths.polizas, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.pagos, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.clientes, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.actividades, 'utf-8').then(JSON.parse).catch(() => [])
    ]);

    // 4. Buscar y validar póliza
    const polizaIndex = polizas.findIndex(p => p.id === Number(id));
    if (polizaIndex === -1) {
      return res.status(404).render('error', {
        title: 'Póliza no encontrada',
        message: 'La póliza especificada no existe',
        user: req.session.user
      });
    }

    // 5. Buscar cliente asociado
    const cliente = clientes.find(c => c.polizas?.includes(Number(id)));
    if (!cliente) {
      return res.status(404).render('error', {
        title: 'Cliente no encontrado',
        message: 'No se encontró el cliente asociado a esta póliza',
        user: req.session.user
      });
    }

    // 6. Registrar actividad
    const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const nuevaActividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: Number(id),
      accion: "Eliminar póliza",
      id_usuario: userId,
      fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
      hora: ahoraArgentina.toFormat('HH:mm:ss'),
      tipo: 'poliza'
    };

    // 7. Preparar datos actualizados (inmutables)
    const polizasActualizadas = polizas.map((poliza, index) => 
      index === polizaIndex ? { ...poliza, inhabilitado: true } : poliza
    );

    const pagosActualizados = pagos.map(pago => 
      pago.id_poliza === Number(id) ? { ...pago, desconocido: true } : pago
    );

    const actividadesActualizadas = [...actividades, nuevaActividad];

    // 8. Guardar cambios atómicamente
    await Promise.all([
      writeFile(dataPaths.polizas, JSON.stringify(polizasActualizadas, null, 2)),
      writeFile(dataPaths.pagos, JSON.stringify(pagosActualizados, null, 2)),
      writeFile(dataPaths.actividades, JSON.stringify(actividadesActualizadas, null, 2))
    ]);

    // 9. Redirigir con feedback
    req.session.flash = {
      type: 'success',
      message: 'Póliza eliminada correctamente'
    };
    res.redirect(`/clientes/detalle/${cliente.id}`);

  } catch (error) {
    console.error("Error al eliminar póliza:", error);
    res.status(500).render('error', {
      title: "Error al eliminar",
      message: "Ocurrió un error al eliminar la póliza",
      error: process.env.NODE_ENV === 'development' ? error : null,
      user: req.session.user
    });
  }
};

export const editar = async function editarPoliza(req, res) {
  const { id } = req.params;

  try {
    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "automarcas.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json"),
    ];
    let [clientes, polizas, pagos, autos, empresas, coberturas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))


    // Encontrar la póliza a editar
    const poliza = polizas.find(poliza => poliza.id === parseInt(id));

    if (!poliza) {
      return res.status(404).send('Póliza no encontrada');
    }

    // Encontrar el cliente
    const cliente = clientes.find(cliente => cliente.id === parseInt(poliza.clienteId));

    pagos = pagos.filter(pago => pago.id_poliza === parseInt(id));


    // Renderizar la vista de edición con los datos de la póliza
    res.render('polizas/editar', { poliza, cliente, autos, empresas, pagos, coberturas });
  } catch (error) {
    console.error('Error al editar la póliza:', error);
    res.status(500).send('Error al editar la póliza');
  }
};

export const actualizar = async (req, res) => {
  try {
    const { body, session } = req;
    const userId = session.user?.id;

    // 1. Validación de entrada
    if (!body.id || isNaN(Number(body.id))) {
      return res.status(400).render('error', {
        title: 'ID inválido',
        message: 'El ID de póliza proporcionado no es válido',
        user: session.user
      });
    }

    if (!userId) {
      return res.status(401).render('error', {
        title: 'No autorizado',
        message: 'Debe iniciar sesión para realizar esta acción',
        user: session.user
      });
    }

    // 2. Definir paths de archivos
    const dataPaths = {
      polizas: path.resolve(process.cwd(), "src/data", "polizas.json"),
      actividades: path.resolve(process.cwd(), "src/data", "actividades.json")
    };

    // 3. Cargar datos necesarios
    const [polizas, actividades] = await Promise.all([
      readFile(dataPaths.polizas, 'utf-8').then(JSON.parse).catch(() => []),
      readFile(dataPaths.actividades, 'utf-8').then(JSON.parse).catch(() => [])
    ]);

    // 4. Buscar y validar póliza
    const polizaIndex = polizas.findIndex(p => p.id === Number(body.id));
    if (polizaIndex === -1) {
      return res.status(404).render('error', {
        title: 'Póliza no encontrada',
        message: 'La póliza especificada no existe',
        user: session.user
      });
    }

    // 5. Preparar cambios (con validación de tipos)
    const cambios = {};
    const camposNumericos = new Set(["empresa", "marca", "cobertura", "cuotas", "periodo", "suma", "precio", "anio"]);

    Object.entries(body).forEach(([campo, valor]) => {
      if (campo === "id" || campo === "clientId") return;
      
      if (valor !== undefined && valor !== polizas[polizaIndex][campo]) {
        cambios[campo] = camposNumericos.has(campo) ? Number(valor) : valor;
      }
    });

    // 6. Calcular nueva fecha de vencimiento si cambió el periodo
    if (cambios.periodo) {
      const fVencimiento = DateTime
        .fromISO(polizas[polizaIndex].f_ini_vigencia)
        .setZone('America/Argentina/Buenos_Aires')
        .plus({ months: Number(cambios.periodo) });
      
      cambios.f_fin_vigencia = fVencimiento.toFormat('yyyy-MM-dd');
    }

    // 7. Registrar actividad
    const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const nuevaActividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: polizas[polizaIndex].id,
      accion: "Editar póliza",
      id_usuario: userId,
      fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
      hora: ahoraArgentina.toFormat('HH:mm:ss'),
      tipo: 'poliza'
    };

    // 8. Preparar datos actualizados (inmutables)
    const polizasActualizadas = [...polizas];
    polizasActualizadas[polizaIndex] = { 
      ...polizasActualizadas[polizaIndex], 
      ...cambios 
    };

    const actividadesActualizadas = [...actividades, nuevaActividad];

    // 9. Guardar cambios atómicamente
    await Promise.all([
      writeFile(dataPaths.polizas, JSON.stringify(polizasActualizadas, null, 2)),
      writeFile(dataPaths.actividades, JSON.stringify(actividadesActualizadas, null, 2))
    ]);

    // 10. Redirigir con feedback
    req.session.flash = {
      type: 'success',
      message: 'Póliza actualizada correctamente'
    };
    res.redirect(`/polizas/detalle/${polizas[polizaIndex].id}`);

  } catch (error) {
    console.error('Error al actualizar póliza:', error);
    res.status(500).render('error', {
      title: "Error al actualizar",
      message: "Ocurrió un error al modificar la póliza",
      error: process.env.NODE_ENV === 'development' ? error : null,
      user: req.session.user
    });
  }
};

export const renovar = async (req, res) => {
  try {
    const { id } = req.params; // ID de la póliza desde la URL

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "automarcas.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "coberturas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];

    const [clientes, polizas, pagos, ciudades, provincias, automarcas, sucursales, empresas, coberturas, usuarios] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, "utf-8"))));


    // Buscar la póliza por ID
    let poliza = polizas.find((p) => p.id.toString() === id);
    if (!poliza) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Buscar el cliente asociado a la póliza
    let cliente = clientes.find((c) => c.polizas.includes(Number(id)));
    if (!cliente) {
      return res.status(404).send("Cliente asociado no encontrado");
    }

    cliente.provincia = provincias.find((p) => p.id === Number(cliente.idprovincia));
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    poliza.marca = automarcas.find((a) => a.id === Number(poliza.marca));
    if (poliza.pagos.length > 0) {
      poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    }
    poliza.cobertura = coberturas.find((c) => c.id === Number(poliza.cobertura));
    // Renderizar la vista con los detalles

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find(user => user.id == usuario.id);       

    res.render("polizas/renovar", { poliza, cliente, usuario: usuario_filtrado,ciudades, provincias, autos:automarcas, sucursales, empresas, coberturas });

  } catch (error) {
    console.error("Error al obtener el detalle de la póliza:", error.message);
    res
      .status(500)
      .send("Error al obtener el detalle de la póliza: " + error.message);
  }
};

export const propuesta = async (req, res) => {
  const { id } = req.params; // ID de la póliza desde la URL
  
  const resources = [
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "ciudades.json"),
    path.resolve(process.cwd(), "src/data", "provincias.json"),
    path.resolve(process.cwd(), "src/data", "automarcas.json"),
    path.resolve(process.cwd(), "src/data", "empresas.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
  ];
  try {
    let [clientes, polizas, ciudades, provincias, automarcas, empresas, coberturas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, "utf-8"))));

    let poliza = polizas.find((p) => p.id == id);
    if (!poliza) {
      return res.status(404).send('Póliza no encontrada');
    }

    let cliente = clientes.find((c) => c.id == poliza.clienteId);
    if (!cliente) {
      return res.status(404).send('Cliente no encontrado');
    }

    let ciudad = ciudades.find((c) => c.id == cliente.localidad);
    let provincia = provincias.find((p) => p.id == cliente.provincia);
    let automarca = automarcas.find((a) => a.id == poliza.marca);
    let empresa = empresas.find((e) => e.id == poliza.empresa);
    let cobertura = coberturas.find((c) => c.id == poliza.cobertura);

    let propuesta = {
      poliza: {
        n_poliza: poliza.n_poliza,
        f_emision: poliza.f_emision,
        f_ini_vigencia: poliza.f_ini_vigencia,
        f_fin_vigencia: poliza.f_fin_vigencia,
        periodo: poliza.periodo,
        suma: poliza.suma,
        cuotas: poliza.cuotas,
        usos: poliza.usos,
        precio: poliza.precio,
        modelo: poliza.modelo,
        patente: poliza.patente,
        anio: poliza.anio,
        n_chasis: poliza.n_chasis,
        n_motor: poliza.n_motor,
        combustible: poliza.combustible,
      },
      cliente: {
        nombre: cliente.nombre,
        cuit: cliente.cuit,
        fecha_n: cliente.fecha_n,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        ciudad: ciudad ? ciudad.ciudad : 'Ciudad no encontrada',
        provincia: provincia ? provincia.provincia : 'Provincia no encontrada',
      },
      automarca: automarca ? automarca.marca : 'Marca no encontrada',
      empresa: empresa ? empresa.nombre : 'Empresa no encontrada',
      cobertura: cobertura ? cobertura.descripcion : 'Cobertura no encontrada',
    };

    res.status(200).render('polizas/propuesta', { propuesta });
  } catch (error) {
    res.status(500).send('Error al mostrar la propuesta', error)
    console.error('Error al mostrar la propuesta', error);
  }
}