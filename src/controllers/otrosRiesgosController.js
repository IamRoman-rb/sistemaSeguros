import path from "path";
import { readFile, writeFile } from "node:fs/promises";
import { DateTime } from "luxon";

export const listado = async (req, res) => {
  try {
    const { busqueda = null } = req.query || {};

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
    ];

    const readJsonFile = async (filePath) => {
      const data = await readFile(filePath, "utf-8");
      return JSON.parse(data);
    };

    let [clientes, polizas] = await Promise.all(resources.map(readJsonFile));

    // Añadir el cliente correspondiente a cada póliza
    polizas = polizas.map((poliza) => {
      const cliente = clientes.find((c) => c.polizas.includes(poliza.id));
      return {
        ...poliza,
        cliente,
      };
    });

    // Filtrar las pólizas si hay un término de búsqueda
    if (busqueda) {
      const searchTerm = busqueda.trim().toLowerCase();
      polizas = polizas.filter((poliza) => {
        return (
          poliza.cliente &&
          (poliza.cliente.nombre.toLowerCase().includes(searchTerm) ||
            poliza.cliente.cuit.toLowerCase().includes(searchTerm) ||
            poliza.n_poliza.toString().includes(searchTerm))
        );
      });
    }

    res.status(200).render("otros-riesgos/otrosRiesgos", { polizas, busqueda });
  } catch (error) {
    console.error("Error en listado:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
};

export const nueva = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del cliente desde la URL
    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];

    let [clientes, empresas, usuarios] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    // Buscar al cliente por ID (asegúrate de que ambos sean cadenas)
    const cliente = clientes.find((cliente) => cliente.id.toString() === id);

    if (!cliente) {
      return res.status(404).send("Cliente no encontrado");
    }

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    res.render("otros-riesgos/nueva", {
      cliente,
      empresas,
      usuario: usuario_filtrado,
    });
  } catch (error) {
    console.error("Error al cargar el cliente:", error.message);
    res.status(500).send("Error al cargar el cliente: " + error.message);
  }
};

export const guardar = async (req, res) => {
  try {
    // Definir rutas con nombres descriptivos
    const otrosRiesgosPath = path.resolve(
      process.cwd(),
      "src/data",
      "otros_riesgos.json"
    );
    const clientesPath = path.resolve(
      process.cwd(),
      "src/data",
      "clientes.json"
    );
    const actividadesPath = path.resolve(
      process.cwd(),
      "src/data",
      "actividades.json"
    );

    // Leer archivos
    const [otrosRiesgos, clientes, actividades] = await Promise.all([
      readFile(otrosRiesgosPath, "utf-8").then(JSON.parse),
      readFile(clientesPath, "utf-8").then(JSON.parse),
      readFile(actividadesPath, "utf-8").then(JSON.parse),
    ]);

    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );
    const fechaFormateada = ahoraArgentina.toFormat("yyyy-MM-dd");

    const f_vencimiento = DateTime.fromISO(req.body.f_ini_vigencia)
      .setZone("America/Argentina/Buenos_Aires")
      .plus({ months: Number(req.body.periodo) });
    const fechaVencimientoFormateada = f_vencimiento.toFormat("yyyy-MM-dd");

    const nuevaPoliza = {
      n_poliza: req.body.n_poliza,
      f_emision: fechaFormateada,
      f_ini_vigencia: req.body.f_ini_vigencia,
      f_fin_vigencia: fechaVencimientoFormateada,
      tipo_poliza: req.body.tipo_poliza,
      periodo: Number(req.body.periodo),
      cuotas: Number(req.body.cuotas),
      empresa: Number(req.body.empresa),
      precio: Number(req.body.precio),
      clienteId: Number(req.body.clientId),
      sucursal: req.body.sucursal,
      pagos: [],
      usuario: req.body.id,
    };

    const cliente = clientes.find(
      (cliente) => cliente.id.toString() === req.body.clientId
    );
    if (!cliente) {
      return res.status(404).send("Cliente no encontrado");
    }

    const nuevoIdPoliza = ahoraArgentina.toMillis();
    nuevaPoliza.id = nuevoIdPoliza;

    otrosRiesgos.push(nuevaPoliza);

    let actividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: nuevoIdPoliza,
      accion: "Creacion de poliza",
      id_usuario: req.session.user.id,
      fecha: ahoraArgentina.toFormat("yyyy-MM-dd"),
      hora: ahoraArgentina.toFormat("HH:mm:ss"),
      tipo: "poliza",
    };

    actividades.push(actividad);

    // Actualizar cliente
    cliente.polizas.push(nuevaPoliza.id);

    // Escribir archivos con rutas explícitas
    await Promise.all([
      writeFile(otrosRiesgosPath, JSON.stringify(otrosRiesgos, null, 2)),
      writeFile(clientesPath, JSON.stringify(clientes, null, 2)),
      writeFile(actividadesPath, JSON.stringify(actividades, null, 2)),
    ]);

    res.redirect("/otros-riesgos");
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
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];

    const [
      clientes,
      polizas,
      pagos,
      ciudades,
      provincias,
      sucursales,
      empresas,
      usuarios,
    ] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

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

    cliente.provincia = provincias.find(
      (p) => p.id === Number(cliente.idprovincia)
    );
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    if (poliza.pagos.length > 0) {
      poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    }

    // Renderizar la vista con los detalles

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    res.render("otros-riesgos/detalle", {
      poliza,
      cliente,
      id: usuario_filtrado.sucursal,
    });
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
    const usuario = req.session.user;

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
    ];

    const [
      clientes,
      polizas,
      pagos,
      ciudades,
      provincias,
      sucursales,
      empresas,
    ] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

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

    cliente.provincia = provincias.find(
      (p) => p.id === Number(cliente.idprovincia)
    );
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));

    // Renderizar la vista de confirmación desde alertas
    res.render("otros-riesgos/confirmar", { poliza, cliente, usuario });
  } catch (error) {
    console.error("Error al confirmar eliminación:", error.message);
    res.status(500).send("Error al confirmar eliminación: " + error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.body;

    const resources = [
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "actividades.json"),
    ];

    let [polizas, pagos, clientes, actividades] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );

    let actividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: id,
      accion: "eliminar poliza",
      id_usuario: req.session.user.id,
      fecha: ahoraArgentina.toFormat("yyyy-MM-dd"),
      hora: ahoraArgentina.toFormat("HH:mm:ss"),
      tipo: "poliza",
    };

    let polizaIndex = polizas.findIndex((p) => p.id === Number(id));
    if (polizaIndex === -1) {
      return res.status(404).send("Póliza no encontrada");
    }

    let cliente = clientes.find((c) => c.polizas.includes(Number(id)));

    polizas[polizaIndex].inhabilitado = true;

    pagos = pagos.map((pago) => {
      if (pago.id_poliza === Number(id)) {
        pago.desconocido = true;
      }
      return pago;
    });

    actividades.push(actividad);

    await Promise.all([
      writeFile(resources[0], JSON.stringify(polizas, null, 2)),
      writeFile(resources[1], JSON.stringify(pagos, null, 2)),
      writeFile(resources[3], JSON.stringify(actividades, null, 2)),
    ]);

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
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
    ];
    let [clientes, polizas, pagos, empresas] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    // Encontrar la póliza a editar
    const poliza = polizas.find((poliza) => poliza.id === parseInt(id));

    if (!poliza) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Encontrar el cliente
    const cliente = clientes.find(
      (cliente) => cliente.id === parseInt(poliza.clienteId)
    );

    pagos = pagos.filter((pago) => pago.id_poliza === parseInt(id));

    // Renderizar la vista de edición con los datos de la póliza
    res.render("otros-riesgos/editar", { poliza, cliente, empresas, pagos });
  } catch (error) {
    console.error("Error al editar la póliza:", error);
    res.status(500).send("Error al editar la póliza");
  }
};

export const actualizar = async (req, res) => {
  try {
    const resources = [
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "actividades.json"),
    ];
    const [polizas, actividades] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    const index = polizas.findIndex(
      (poliza) => poliza.id === parseInt(req.body.id)
    );

    if (index === -1) {
      return res.status(404).send("Póliza no encontrada");
    }

    const cambios = {};

    let campos = Object.keys(req.body);
    campos = campos.filter((campo) => !["id", "clientId"].includes(campo));

    for (const campo of campos) {
      if (
        req.body[campo] !== undefined &&
        req.body[campo] !== polizas[index][campo]
      ) {
        cambios[campo] = req.body[campo];
      }
    }

    // Conversión de tipos para campos numéricos
    const camposNumericos = ["empresa", "cuotas", "periodo", "precio"];
    camposNumericos.forEach((campo) => {
      if (cambios[campo]) {
        cambios[campo] = Number(cambios[campo]);
      }
    });

    if (cambios.periodo) {
      const f_vencimiento = DateTime.fromISO(polizas[index].f_ini_vigencia)
        .setZone("America/Argentina/Buenos_Aires")
        .plus({ months: Number(cambios.periodo) });
      cambios.f_fin_vigencia = f_vencimiento.toFormat("yyyy-MM-dd");
    }

    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );

    let actividad = {
      id: ahoraArgentina.toMillis(),
      id_poliza: polizas[index].id,
      accion: "Editar poliza",
      id_usuario: req.session.user.id,
      fecha: ahoraArgentina.toFormat("yyyy-MM-dd"),
      hora: ahoraArgentina.toFormat("HH:mm:ss"),
      tipo: "poliza",
    };

    actividades.push(actividad);

    Object.assign(polizas[index], cambios);

    await Promise.all([
      writeFile(resources[0], JSON.stringify(polizas, null, 2)),
      writeFile(resources[1], JSON.stringify(actividades, null, 2)),
    ]);

    res.redirect(`/otros-riesgos/detalle/${polizas[index].id}`);
  } catch (error) {
    console.error("Error al modificar la póliza:", error);
    res.status(500).send("Error al modificar la póliza");
  }
};

export const renovar = async (req, res) => {
  try {
    const { id } = req.params; // ID de la póliza desde la URL

    const resources = [
      path.resolve(process.cwd(), "src/data", "clientes.json"),
      path.resolve(process.cwd(), "src/data", "otros_riesgos.json"),
      path.resolve(process.cwd(), "src/data", "pagos.json"),
      path.resolve(process.cwd(), "src/data", "ciudades.json"),
      path.resolve(process.cwd(), "src/data", "provincias.json"),
      path.resolve(process.cwd(), "src/data", "sucursales.json"),
      path.resolve(process.cwd(), "src/data", "empresas.json"),
      path.resolve(process.cwd(), "src/data", "usuarios.json"),
    ];

    const [
      clientes,
      polizas,
      pagos,
      ciudades,
      provincias,
      sucursales,
      empresas,
      usuarios,
    ] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

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

    cliente.provincia = provincias.find(
      (p) => p.id === Number(cliente.idprovincia)
    );
    cliente.ciudad = ciudades.find((c) => c.id === Number(cliente.idciudad));

    poliza.empresa = empresas.find((e) => e.id === Number(poliza.empresa));
    poliza.sucursal = sucursales.find((s) => s.id === Number(poliza.sucursal));
    if (poliza.pagos.length > 0) {
      poliza.pagos = pagos.filter((pago) => pago.id_poliza === Number(id));
    }
    // Renderizar la vista con los detalles

    let usuario = req.session.user;

    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    res.render("otros-riesgos/renovar", {
      poliza,
      cliente,
      usuario: usuario_filtrado,
      ciudades,
      provincias,
      sucursales,
      empresas,
      pagos,
    });
  } catch (error) {
    console.error("Error al obtener el detalle de la póliza:", error.message);
    res
      .status(500)
      .send("Error al obtener el detalle de la póliza: " + error.message);
  }
};
