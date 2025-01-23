import path from "path";
import { readFile, writeFile } from "node:fs/promises";


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
    ]

    let [clientes, autos, empresas, coberturas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    // Buscar al cliente por ID (asegúrate de que ambos sean cadenas)
    const cliente = clientes.find((cliente) => cliente.id.toString() === id);

    if (!cliente) {
      return res.status(404).send("Cliente no encontrado");
    }


    res.render("polizas/nueva", { cliente, autos, empresas, coberturas });
  } catch (error) {
    console.error("Error al cargar el cliente:", error.message);
    res.status(500).send("Error al cargar el cliente: " + error.message);
  }
};
export const guardar = async (req, res) => {
  try {
    /* Agregar sucursal del usuario logueado */
    const { sucursal } = req.session.user;

    /* Validacion de patentes duplicadas */

    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "clientes.json"),
    ]

    let [polizas, clientes] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    const polizasPatente = polizas.filter((poliza) => poliza.patente === req.body.patente);

    if (polizasPatente.length > 0) {
      return res.status(400).send("Patente duplicada");
    }



    // Calcular la fecha actual
    const fechaActual = new Date();
    const dia = fechaActual.getDate();
    const mes = fechaActual.getMonth() + 1; // Los meses se indican desde 0
    const anio = fechaActual.getFullYear();
    const fechaFormateada = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    // Calcular la fecha de vencimiento de la póliza
    const f_vencimiento = new Date(req.body.f_ini_vigencia);
    f_vencimiento.setMonth(f_vencimiento.getMonth() + Number(req.body.periodo));
    const fechaVencimientoFormateada = `${f_vencimiento.getFullYear()}-${(f_vencimiento.getMonth() + 1).toString().padStart(2, '0')}-${f_vencimiento.getDate().toString().padStart(2, '0')}`;
    const nuevaPoliza = {
      n_poliza: req.body.n_poliza,
      f_emision: fechaFormateada,
      f_ini_vigencia: req.body.f_ini_vigencia,
      f_fin_vigencia: fechaVencimientoFormateada,
      periodo: Number(req.body.periodo),
      suma: Number(req.body.suma),
      cuotas: Number(req.body.cuotas),
      empresa: Number(req.body.empresa),
      precio: Number(req.body.precio),
      cobertura: req.body.cobertura,
      marca: Number(req.body.marca),
      modelo: req.body.modelo,
      patente: req.body.patente,
      anio: Number(req.body.anio),
      n_chasis: req.body.n_chasis,
      n_motor: req.body.n_motor,
      combustible: req.body.combustible,
      clienteId: Number(req.body.clientId), // Asociar la póliza al cliente
      sucursal: sucursal,
      pagos: []
    };

    const cliente = clientes.find((cliente) => cliente.id.toString() === req.body.clientId);
    if (!cliente) {
      return res.status(404).send("Cliente no encontrado");
    }

    // Generar un nuevo ID para la póliza
    const nuevoIdPoliza =
      polizas.length > 0 ? Math.max(...polizas.map((p) => p.id)) + 1 : 1;
    nuevaPoliza.id = nuevoIdPoliza;

    // Agregar la nueva póliza a las pólizas existentes
    polizas.push(nuevaPoliza);

    // Guardar el nuevo archivo de pólizas
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));

    // Agregar el ID de la nueva póliza al cliente correspondiente
    cliente.polizas.push(nuevaPoliza.id);

    // Actualizar el archivo de clientes con el nuevo ID de póliza
    await writeFile(resources[1], JSON.stringify(clientes, null, 2));

    res.redirect("/polizas"); // Redirige a la lista de pólizas
  } catch (error) {
    console.error("Error al guardar la póliza:", error.message);
    res.status(500).send("Error al guardar la póliza: " + error.message);
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
    if (poliza.pagos.length > 0) {
      poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    }
    poliza.cobertura = coberturas.find((c) => c.id === Number(poliza.cobertura));
    // Renderizar la vista con los detalles
    res.render("polizas/detalle", { poliza, cliente });

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
    res.render("polizas/confirmar", { poliza, cliente });
  } catch (error) {
    console.error("Error al confirmar eliminación:", error.message);
    res.status(500).send("Error al confirmar eliminación: " + error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.body;

    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "clientes.json"),
    ];

    let [polizas, pagos, clientes] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));


    // Buscar la póliza y eliminarla
    const polizaIndex = polizas.findIndex((p) => p.id.toString() === id);
    if (polizaIndex === -1) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Buscar el cliente asociado a la póliza
    const cliente = clientes.find((c) => c.polizas.includes(Number(id)));

    // Inhabilitar la póliza de la lista
    polizas[polizaIndex].inhabilitado = true;

    // Desconocer los pagos asociados a la póliza
    pagos = pagos.map((pago) => {
      if (pago.id_poliza === Number(id)) {
        pago.desconocido = true;
      }
      return pago;
    });

    // Guardar los cambios
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));
    await writeFile(resources[1], JSON.stringify(pagos, null, 2));

    res.redirect(`/clientes/detalle/${cliente.id}`);
  } catch (error) {
    console.error("Error al eliminar la póliza:", error.message);
    res.status(500).send("Error al eliminar la póliza: " + error.message);
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
    // Leer los datos de las pólizas desde el archivo JSON
    const resources = [
      path.resolve(process.cwd(), "src/data", "polizas.json"),
    ];
    let [polizas] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))))

    // Encontrar el índice de la póliza a modificar
    const index = polizas.findIndex(poliza => poliza.id === parseInt(req.body.id));

    if (index === -1) {
      return res.status(404).send('Póliza no encontrada');
    }

    // Crear un objeto con los cambios a realizar
    const cambios = {};

    // Utilizar un bucle for para iterar sobre todos los campos y crear los condicionales
    let campos = Object.keys(req.body);
    campos = campos.filter(campo => !["id", "clientId"].includes(campo));
    for (const campo of campos) {
      if (req.body[campo] !== undefined && req.body[campo] !== polizas[index][campo]) {
        cambios[campo] = req.body[campo];
      }
    }
    if (campos.includes("empresa") && req.body.empresa !== polizas[index].empresa) {
      cambios.empresa = Number(req.body.empresa);
    }
    if (campos.includes("marca") && req.body.marca !== polizas[index].marca) {
      cambios.marca = Number(req.body.marca);
    }
    if (campos.includes("cobertura") && req.body.cobertura !== polizas[index].cobertura) {
      cambios.cobertura = Number(req.body.cobertura);
    }
    if (campos.includes("cuotas") && req.body.cuotas !== polizas[index].cuotas) {
      cambios.cuotas = Number(req.body.cuotas);
    }

    if (campos.includes("periodo") && req.body.periodo !== polizas[index].periodo) {
      cambios.periodo = Number(req.body.periodo);
    }

    if (campos.includes("periodo") && cambios.periodo != polizas[index].periodo) {
      const f_vencimiento = new Date(polizas[index].f_ini_vigencia);
      f_vencimiento.setMonth(f_vencimiento.getMonth() + Number(cambios.periodo));
      cambios.f_fin_vigencia = `${f_vencimiento.getFullYear()}-${(f_vencimiento.getMonth() + 1).toString().padStart(2, '0')}-${f_vencimiento.getDate().toString().padStart(2, '0')}`;
    }

    // Aplicar los cambios a la póliza
    Object.assign(polizas[index], cambios);

    // return res.status(200).json({poliza: polizas[index], message: 'Poliza actualizada correctamente'});

    // Escribir los datos actualizados en el archivo JSON
    await writeFile(resources[0], JSON.stringify(polizas, null, 2));

    res.redirect(`/polizas/detalle/${polizas[index].id}`); // Redirige a la lista de pólizas
  } catch (error) {
    console.error('Error al modificar la póliza:', error);
    res.status(500).send('Error al modificar la póliza');
  }
}

