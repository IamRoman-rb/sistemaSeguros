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
      const resources = [
          path.resolve(process.cwd(), "src/data", "polizas.json"),
          path.resolve(process.cwd(), "src/data", "clientes.json"),
          path.resolve(process.cwd(), "src/data", "actividades.json"),
      ];

      const [polizas, clientes, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

      // const polizasPatente = polizas.filter((poliza) => poliza.patente === req.body.patente);

      // if (polizasPatente.length > 0) {
      //     return res.status(400).send("Patente duplicada");
      // }

      const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

      const fechaFormateada = ahoraArgentina.toFormat('yyyy-MM-dd');

      const f_vencimiento = DateTime.fromISO(req.body.f_ini_vigencia).setZone('America/Argentina/Buenos_Aires').plus({ months: Number(req.body.periodo) });
      const fechaVencimientoFormateada = f_vencimiento.toFormat('yyyy-MM-dd');

      const nuevaPoliza = {
          n_poliza: req.body.n_poliza,
          f_emision: fechaFormateada,
          f_ini_vigencia: req.body.f_ini_vigencia,
          f_fin_vigencia: fechaVencimientoFormateada,
          periodo: Number(req.body.periodo),
          suma: Number(req.body.suma),
          cuotas: Number(req.body.cuotas),
          usos: req.body.usos,
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
          clienteId: Number(req.body.clientId),
          sucursal: req.body.sucursal,
          pagos: [],
          usuario: req.body.id,
      };

      const cliente = clientes.find((cliente) => cliente.id.toString() === req.body.clientId);
      if (!cliente) {
          return res.status(404).send("Cliente no encontrado");
      }

      const nuevoIdPoliza = polizas.length > 0 ? Math.max(...polizas.map((p) => p.id)) + 1 : 1;
      nuevaPoliza.id = nuevoIdPoliza;

      polizas.push(nuevaPoliza);

      let actividad = {
          id: ahoraArgentina.toMillis(),
          id_poliza: nuevoIdPoliza,
          accion: "Creacion de poliza",
          id_usuario: req.session.user.id,
          fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
          hora: ahoraArgentina.toFormat('HH:mm:ss'),
          tipo: 'poliza'
      };

      actividades.push(actividad);

      await Promise.all([
          writeFile(resources[0], JSON.stringify(polizas, null, 2)),
          writeFile(resources[1], JSON.stringify(clientes, null, 2)),
          writeFile(resources[2], JSON.stringify(actividades, null, 2)),
      ]);

      cliente.polizas.push(nuevaPoliza.id);

      await writeFile(resources[1], JSON.stringify(clientes, null, 2));

      res.redirect("/polizas");
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

      const resources = [
          path.resolve(process.cwd(), "src/data", "polizas.json"),
          path.resolve(process.cwd(), "src/data", "pagos.json"),
          path.resolve(process.cwd(), "src/data", "clientes.json"),
          path.resolve(process.cwd(), "src/data", "actividades.json"),
      ];

      let [polizas, pagos, clientes, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

      const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

      let actividad = {
          id: ahoraArgentina.toMillis(),
          id_poliza: id,
          accion: "eliminar poliza",
          id_usuario: req.session.user.id,
          fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
          hora: ahoraArgentina.toFormat('HH:mm:ss'),
          tipo: 'poliza'
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
      const resources = [
          path.resolve(process.cwd(), "src/data", "polizas.json"),
          path.resolve(process.cwd(), "src/data", "actividades.json"),
      ];
      const [polizas, actividades] = await Promise.all(resources.map(async (resource) => JSON.parse(await readFile(resource, 'utf-8'))));

      const index = polizas.findIndex(poliza => poliza.id === parseInt(req.body.id));

      if (index === -1) {
          return res.status(404).send('Póliza no encontrada');
      }

      const cambios = {};

      let campos = Object.keys(req.body);
      campos = campos.filter(campo => !["id", "clientId"].includes(campo));

      for (const campo of campos) {
          if (req.body[campo] !== undefined && req.body[campo] !== polizas[index][campo]) {
              cambios[campo] = req.body[campo];
          }
      }

      // Conversión de tipos para campos numéricos
      const camposNumericos = ["empresa", "marca", "cobertura", "cuotas", "periodo", "suma", "precio", "anio"];
      camposNumericos.forEach(campo => {
          if (cambios[campo]) {
              cambios[campo] = Number(cambios[campo]);
          }
      });


      if (cambios.periodo) {
          const f_vencimiento = DateTime.fromISO(polizas[index].f_ini_vigencia).setZone('America/Argentina/Buenos_Aires').plus({ months: Number(cambios.periodo) });
          cambios.f_fin_vigencia = f_vencimiento.toFormat('yyyy-MM-dd');
      }

      const ahoraArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

      let actividad = {
          id: ahoraArgentina.toMillis(),
          id_poliza: polizas[index].id,
          accion: "Editar poliza",
          id_usuario: req.session.user.id,
          fecha: ahoraArgentina.toFormat('yyyy-MM-dd'),
          hora: ahoraArgentina.toFormat('HH:mm:ss'),
          tipo: 'poliza'
      };

      actividades.push(actividad);

      Object.assign(polizas[index], cambios);

      await Promise.all([
          writeFile(resources[0], JSON.stringify(polizas, null, 2)),
          writeFile(resources[1], JSON.stringify(actividades, null, 2)),
      ]);

      res.redirect(`/polizas/detalle/${polizas[index].id}`);
  } catch (error) {
      console.error('Error al modificar la póliza:', error);
      res.status(500).send('Error al modificar la póliza');
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