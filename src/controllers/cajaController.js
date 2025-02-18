import { readFile, writeFile } from "node:fs/promises";
import path from "path";
import { DateTime } from "luxon";

export const caja = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "caja.json"),
    path.resolve(process.cwd(), "src/data", "sucursales.json"),
    path.resolve(process.cwd(), "src/data", "coberturas.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );
    const anioActual = ahoraArgentina.year;
    const mesActual = ahoraArgentina.month; // No restar 1 al mes a menos que sea intencional
    const diaActual = ahoraArgentina.day;

    let [pagos, polizas, caja, sucursales, coberturas, clientes, usuarios] =
      await Promise.all(
        resources.map(async (resource) =>
          JSON.parse(await readFile(resource, "utf-8"))
        )
      );

    let usuario = req.session.user;
    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    // Obtener la sucursal del usuario actual
    const sucursalUsuario = usuario_filtrado.sucursal;   

    // Filtrar ingresos y egresos por la sucursal del usuario que los realizó
    let ingresos = caja.filter((item) => {
      const usuarioItem = usuarios.find((user) => user.id === Number(item.id_usuario));
      
      return (
        item.tipo === "ingreso" &&
        usuarioItem &&
        usuarioItem.sucursal === sucursalUsuario
      );
    });

    let egresos = caja.filter((item) => {
      const usuarioItem = usuarios.find((user) => user.id === Number(item.id_usuario));
      return (
        item.tipo === "egreso" &&
        usuarioItem &&
        usuarioItem.sucursal === sucursalUsuario
      );
    });

    ingresos = ingresos.filter((item) => !item.desconocido);
    egresos = egresos.filter((item) => !item.desconocido);

    ingresos = ingresos.filter((ingreso) => {
      const fechaIngreso = DateTime.fromISO(ingreso.fecha).setZone(
        "America/Argentina/Buenos_Aires"
      );
      return (
        fechaIngreso.year === anioActual &&
        fechaIngreso.month === mesActual &&
        fechaIngreso.day === diaActual
      );
    });

    egresos = egresos.filter((egreso) => {
      const fechaEgreso = DateTime.fromISO(egreso.fecha).setZone(
        "America/Argentina/Buenos_Aires"
      );
      return (
        fechaEgreso.year === anioActual &&
        fechaEgreso.month === mesActual &&
        fechaEgreso.day === diaActual
      );
    });

    // Filtrar pagos por la sucursal del cobrador
    pagos = pagos.filter((pago) => {
      const fechaPago = DateTime.fromISO(pago.fecha).setZone(
        "America/Argentina/Buenos_Aires"
      );
      const cobrador = usuarios.find((user) => user.id === Number(pago.id_cobrador));
      return (
        cobrador &&
        cobrador.sucursal === sucursalUsuario &&
        fechaPago.year === anioActual &&
        fechaPago.month === mesActual &&
        fechaPago.day === diaActual &&
        !pago.desconocido
      );
    });

    pagos = pagos.map((pago) => {
      const poliza = polizas.find(
        (poliza) => poliza.id === Number(pago.id_poliza)
      );
      const cliente = clientes.find(
        (cliente) => cliente.id === Number(poliza?.clienteId)
      );
      const cobrador = usuarios.find(
        (usuarios) => usuarios.id === Number(pago.id_cobrador)
      );
      const sucursal = sucursales.find(
        (sucursal) => sucursal.id === Number(cobrador?.sucursal)
      );
      const cobertura = coberturas.find(
        (cobertura) => cobertura.id === Number(poliza?.cobertura)
      );

      return {
        fecha: pago.fecha,
        valor: pago.valor,
        forma_pago: pago.forma_pago,
        cliente: cliente
          ? `${cliente.nombre} | ${cliente.cuit}`
          : "Cliente no encontrado",
        cobrador:
          cobrador && sucursal
            ? `${cobrador.nombre} | ${sucursal.nombre}`
            : "Cobrador o sucursal no encontrado",
        descripcion:
          poliza && cobertura
            ? `Poliza N° ${poliza.n_poliza} | ${cobertura.nombre}`
            : "Póliza o cobertura no encontrada",
      };
    });

    let pagosEnEfectivo = pagos.filter(
      (pago) => pago.forma_pago === "efectivo"
    );

    let total =
      pagosEnEfectivo.reduce((p, a) => p + Number(a.valor), 0) +
      ingresos.reduce((p, a) => p + Number(a.monto), 0) -
      egresos.reduce((p, a) => p + Number(a.monto), 0);

    return res
      .status(200)
      .render("caja/caja", {
        ingresos,
        egresos,
        pagosEnEfectivo,
        total,
        usuario: usuario_filtrado,
      });
  } catch (error) {
    console.error("Error en la carga de la caja", error.message);
    res.status(500).send("Error al cargar la caja");
  }
};

export const ingreso = async (req, res) => {
  const resources = [path.resolve(process.cwd(), "src/data", "caja.json")];
  try {
    let [caja] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );
    caja = caja.filter((item) => item.tipo === "ingreso");
    let motivos = caja.map((item) => item.motivo);
    motivos = [...new Set(motivos)];

    res.render("caja/ingresos", { motivos, id: req.session.user.id });
  } catch (error) {
    console.error("Error en la carga de la caja", error.message);
    res.status(500).send("Error al cargar la caja");
  }
};

export const egreso = async (req, res) => {
  const resources = [path.resolve(process.cwd(), "src/data", "caja.json")];
  try {
    let [caja] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );
    caja = caja.filter((item) => item.tipo === "egreso");
    let motivos = caja.map((item) => item.motivo);
    motivos = [...new Set(motivos)];
    res.render("caja/egresos", { motivos, id: req.session.user.id });
  } catch (error) {
    console.error("Error en la carga de la caja", error.message);
    res.status(500).send("Error al cargar la caja");
  }
};
export const guardar = async (req, res) => {
  const resources = [path.resolve(process.cwd(), "src/data", "caja.json")];
  try {
    let [caja] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );
    const { id_usuario, monto, tipo, motivo, descripcion } = req.body;

    // Obtener la fecha y hora actual con Luxon en la zona horaria de Argentina
    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );

    const id = ahoraArgentina.toMillis(); // Usar milisegundos desde la época como ID único
    const fechaFormateada = ahoraArgentina.toFormat("yyyy-MM-dd"); // Formato ISO 8601 para la fecha

    const nuevo = {
      id_usuario,
      id,
      monto,
      tipo,
      motivo,
      descripcion,
      fecha: fechaFormateada,
    };

    caja.push(nuevo);
    await writeFile(
      path.resolve(process.cwd(), "src/data", "caja.json"),
      JSON.stringify(caja, null, 2)
    );

    res.redirect("/caja");
  } catch (error) {
    console.error("Error en la carga de la caja", error.message);
    res.status(500).send("Error al cargar la caja");
  }
};

export const resumen = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    let [caja, pagos, usuarios] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    const ahoraArgentina = DateTime.now().setZone(
      "America/Argentina/Buenos_Aires"
    );
    const anioActual = ahoraArgentina.year;

    let resumenes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      anio: anioActual, // Año actual para los resumenes
      ingresos: [],
      egresos: [],
      balance: 0,
    }));

    pagos = pagos.filter((pago) => !pago.desconocido);

    let usuario = req.session.user;
    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    // Mapear cobradores
    caja = caja.map((c) => ({
      ...c,
      cobrador: usuarios.find((u) => u.id === Number(c.id_usuario)),
    }));
    pagos = pagos.map((p) => ({
      ...p,
      cobrador: usuarios.find((u) => u.id === Number(p.id_cobrador)),
    }));

    // Filtrar por sucursal
    caja = caja.filter(
      (c) => c.cobrador && c.cobrador.sucursal == usuario_filtrado.sucursal
    );
    pagos = pagos.filter(
      (p) => p.cobrador && p.cobrador.sucursal == usuario_filtrado.sucursal
    );


    caja = caja.filter((item) => !item.desconocido);
    pagos = pagos.filter((item) => !item.desconocido);

    resumenes = resumenes.map((resumen) => {
      const fechaInicioMes = DateTime.fromObject({
        year: resumen.anio,
        month: resumen.mes,
      }).setZone("America/Argentina/Buenos_Aires");
      const fechaFinMes = fechaInicioMes.endOf("month");

      let ingresosCaja = caja
        .filter(
          (item) =>
            item.tipo === "ingreso" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) >= fechaInicioMes &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) <= fechaFinMes
        )
        .map((item) => Number(item.monto));

      let egresosCaja = caja
        .filter(
          (item) =>
            item.tipo === "egreso" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) >= fechaInicioMes &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) <= fechaFinMes
        )
        .map((item) => Number(item.monto));

      let ingresosPagos = pagos
        .filter(
          (item) =>
            item.forma_pago === "efectivo" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) >= fechaInicioMes &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ) <= fechaFinMes
        )
        .map((item) => Number(item.valor));

      resumen.fecha = fechaInicioMes.toFormat("MM/yyyy");
      resumen.fechaAlt = fechaInicioMes.toMillis();
      resumen.ingresos =
        ingresosCaja.reduce((a, b) => a + b, 0) +
        ingresosPagos.reduce((a, b) => a + b, 0);
      resumen.egresos = egresosCaja.reduce((a, b) => a + b, 0);
      resumen.balance = resumen.ingresos - resumen.egresos;
      return resumen;
    });

    return res.status(200).render("caja/resumen", { resumenes });
  } catch (error) {
    console.error("Error en la carga de la caja", error.message);
    res.status(500).send("Error al cargar la caja");
  }
};

export const detalle = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    let [caja, pagos, usuarios] = await Promise.all(
      resources.map(async (resource) =>
        JSON.parse(await readFile(resource, "utf-8"))
      )
    );

    let usuario = req.session.user;
    let usuario_filtrado = usuarios.find((user) => user.id == usuario.id);

    pagos = pagos.filter((pago) => !pago.desconocido);

    caja = caja.map((c) => ({
      ...c,
      cobrador: usuarios.find((u) => u.id === Number(c.id_usuario)),
    }));
    pagos = pagos.map((p) => ({
      ...p,
      cobrador: usuarios.find((u) => u.id === Number(p.id_cobrador)),
    }));

    caja = caja.filter((item) => !item.desconocido);
    pagos = pagos.filter((item) => !item.desconocido);

    if (usuario_filtrado.permisos != 1) {
      caja = caja.filter(
        (c) => c.cobrador && c.cobrador.sucursal == usuario_filtrado.sucursal
      );
      pagos = pagos.filter(
        (p) => p.cobrador && p.cobrador.sucursal == usuario_filtrado.sucursal
      );
    }

    const fechaParametro = DateTime.fromMillis(Number(req.params.id)).setZone(
      "America/Argentina/Buenos_Aires"
    );
    const month = fechaParametro.month;
    const year = fechaParametro.year;
    const countDays = fechaParametro.daysInMonth;

    caja = caja.filter(
      (c) =>
        DateTime.fromISO(c.fecha).setZone("America/Argentina/Buenos_Aires")
          .month === month &&
        DateTime.fromISO(c.fecha).setZone("America/Argentina/Buenos_Aires")
          .year === year
    );
    pagos = pagos.filter(
      (p) =>
        DateTime.fromISO(p.fecha).setZone("America/Argentina/Buenos_Aires")
          .month === month &&
        DateTime.fromISO(p.fecha).setZone("America/Argentina/Buenos_Aires")
          .year === year
    );

    let resumen = Array.from({ length: countDays }, (_, i) => {
      const date = DateTime.fromObject({ year, month, day: i + 1 }).setZone(
        "America/Argentina/Buenos_Aires"
      );

      let ingresosCaja = caja
        .filter(
          (item) =>
            item.tipo === "ingreso" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ).day === date.day
        )
        .map((item) => Number(item.monto));

      let egresosCaja = caja
        .filter(
          (item) =>
            item.tipo === "egreso" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ).day === date.day
        )
        .map((item) => Number(item.monto));

      let ingresosPagos = pagos
        .filter(
          (item) =>
            item.forma_pago === "efectivo" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ).day === date.day
        )
        .map((item) => Number(item.valor));

      let egresosPagos = pagos
        .filter(
          (item) =>
            item.forma_pago === "transferencia" &&
            DateTime.fromISO(item.fecha).setZone(
              "America/Argentina/Buenos_Aires"
            ).day === date.day
        )
        .map((item) => Number(item.valor));

      ingresosCaja = ingresosCaja.reduce((a, b) => a + b, 0);
      egresosCaja = egresosCaja.reduce((a, b) => a + b, 0);
      ingresosPagos = ingresosPagos.reduce((a, b) => a + b, 0);
      egresosPagos = egresosPagos.reduce((a, b) => a + b, 0);

      return {
        fecha: date.toMillis(),
        fechaAlt: date.toFormat("yyyy-MM-dd"),
        ingresos: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(ingresosCaja + ingresosPagos),
        egresos: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(egresosCaja + egresosPagos),
        balance: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(ingresosCaja + ingresosPagos - (egresosCaja + egresosPagos)),
      };
    });
    

    Object.defineProperty(String.prototype, "capitalizar", {
      value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
      },
      writable: true,
      configurable: true,
    });

    return res.status(200).render("caja/detalle", {
      mes: fechaParametro.toLocaleString({ month: "long" }).capitalizar(),
      anio: year,
      resumen,
    });
  } catch (error) {
    res.status(500).send(error);
    console.error(error);
  }
};

export const confirmar = async (req, res) => {
  try{
    const { id } = req.params;
    const resources = [
      path.resolve(process.cwd(), "src/data", "caja.json"),
    ];

    let [caja] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, "utf-8"))));  

    let movimiento = caja.find((m)  => m.id == id);
    
    res.status(200).render('caja/confirmar', { id: req.session.user, movimiento: movimiento });
  }catch (error){
    res.send(error);
    console.error(error);
    
  }
}

export const eliminarIngresoEgreso = async (req, res) => {  
  try {
    const { id, id_movimiento } = req.body;

    // Verifica que los datos requeridos estén presentes
    if (!id || !id_movimiento) {
      return res.status(400).send("Faltan datos requeridos.");
    }

    const resources = [
      path.resolve(process.cwd(), "src/data", "caja.json"),
      path.resolve(process.cwd(), "src/data", "actividades.json"),
    ];

    // Lee los archivos JSON
    let [caja, actividades] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, "utf-8"))));

    // Encuentra el índice del movimiento
    let movimientoIndex = caja.findIndex((m) => m.id === Number(id_movimiento));
    

    if (movimientoIndex === -1) {
      return res.status(404).send("Movimiento no encontrado.");
    }

    // Obtén el objeto del movimiento
    let movimiento = caja[movimientoIndex];
    let tipo = movimiento.tipo;

    // Marca el movimiento como desconocido
    caja[movimientoIndex].desconocido = true;

    // Obtén la fecha y hora actual en la zona horaria de Argentina
    const fechaArgentina = DateTime.now().setZone('America/Argentina/Buenos_Aires');

    // Crea la actividad
    let actividad = {
      id: fechaArgentina.toMillis(), // ID de la actividad
      id_pago: movimiento.id, // Usar el ID del movimiento
      accion: `Eliminar ${tipo}`,
      id_usuario: req.session.user.id,
      fecha: fechaArgentina.toFormat('yyyy-MM-dd'), // Fecha en formato YYYY-MM-DD
      hora: fechaArgentina.toFormat('HH:mm:ss'), // Hora en formato HH:mm:ss
      tipo: 'movimiento'
    };

    // Guarda la actividad
    actividades.push(actividad);

    // Actualiza los archivos
    await Promise.all([
      writeFile(resources[0], JSON.stringify(caja, null, 2)), // Actualiza caja.json
      writeFile(resources[1], JSON.stringify(actividades, null, 2)), // Actualiza actividades.json
    ]);

    // Redirige a la página de caja
    res.redirect('/caja');
  } catch (error) {
    console.error("Error al eliminar el movimiento:", error);
    res.status(500).send(`Error al eliminar el movimiento: ${error.message}`);
  }
};

export const cajaPorDia = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "caja.json"),
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
  ];
  try {
    let [caja, pagos, polizas, usuarios, clientes] = await Promise.all(resources.map(async (file) => JSON.parse(await readFile(file, "utf-8"))));

    let movimientosPorDia = {};
    const fechaFiltro = req.query.fecha; // Obtiene la fecha del formulario

    const formatearFechaBuenosAires = (fecha) => {
      return DateTime.fromISO(fecha).setZone('America/Argentina/Buenos_Aires').toFormat('yyyy-MM-dd');
    };

    const buscarRelacionado = (array, id, propiedad) => {
      return array.find(item => item.id === id)?.[propiedad];
    };

    caja.forEach(movimiento => {
      const fecha = formatearFechaBuenosAires(movimiento.fecha);

      // Aplica el filtro si se proporciona una fecha
      if (fechaFiltro && fecha !== fechaFiltro) {
        return; // Salta este movimiento si no coincide con la fecha
      }

      if (!movimientosPorDia[fecha]) {
        movimientosPorDia[fecha] = {
          pagosDelDia: [],
          egresosDelDia: [],
          ingresosDelDia: []
        };
      }

      const usuario = buscarRelacionado(usuarios, movimiento.id_usuario, 'nombre');

      if (movimiento.tipo === 'ingreso') {
        movimientosPorDia[fecha].ingresosDelDia.push({
          ...movimiento,
          usuario
        });
      } else {
        movimientosPorDia[fecha].egresosDelDia.push({
          ...movimiento,
          usuario
        });
      }
    });

    pagos.forEach(pago => {
      const fecha = formatearFechaBuenosAires(pago.fecha);

      // Aplica el filtro si se proporciona una fecha
      if (fechaFiltro && fecha !== fechaFiltro) {
        return; // Salta este pago si no coincide con la fecha
      }

      if (!movimientosPorDia[fecha]) {
        movimientosPorDia[fecha] = {
          pagosDelDia: [],
          egresosDelDia: [],
          ingresosDelDia: []
        };
      }

      const poliza = polizas.find(p => p.id === pago.id_poliza);
      const cliente = clientes.find(c => c.id === poliza?.clienteId);
      const cobrador = buscarRelacionado(usuarios, pago.id_cobrador, 'nombre');

      movimientosPorDia[fecha].pagosDelDia.push({
        ...pago,
        clienteNombre: cliente?.nombre,
        marcaVehiculo: poliza?.marca,
        patenteVehiculo: poliza?.patente,
        cobrador
      });
    });

    const resultado = Object.entries(movimientosPorDia).map(([fecha, movimientos]) => ({
      fecha,
      ...movimientos
    }));

    res.status(200).render('caja/cajaPorDia', { resultado })

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
}
