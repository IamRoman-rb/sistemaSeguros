import path from "path";
import { readFile, writeFile } from "node:fs/promises";
import { DateTime } from "luxon";
DateTime.defaultLocale = "es";

export const listar = async (req, res) => {
  const resources = [
    path.resolve(process.cwd(), "src/data", "pagos.json"),
    path.resolve(process.cwd(), "src/data", "clientes.json"),
    path.resolve(process.cwd(), "src/data", "polizas.json"),
    path.resolve(process.cwd(), "src/data", "usuarios.json"),
  ];

  try {
    let [pagos, clientes, polizas, usuarios] = await Promise.all(
      resources.map(async (file) => JSON.parse(await readFile(file, "utf-8")))
    );

    pagos = pagos.map((pago) => ({
      ...pago,
      cliente: clientes.find((c) => c.id === pago.id_cliente) || {
        nombre: "Cliente no encontrado",
      },
      poliza: polizas.find((p) => p.id === pago.id_poliza) || {
        n_poliza: "Póliza no encontrada",
      },
      cobrador: usuarios.find((u) => u.id === parseInt(pago.id_cobrador)) || {
        nombre: "Cobrador no encontrado",
      },
    }));

    if (["Empleado"].includes(req.session.user.rol)) {
      pagos = pagos.filter((pago) => pago.cobrador.id === req.session.user.id);
    }

    res.render("pagos/pagos", { pagos });
  } catch (error) {
    console.error("Error al procesar los datos:", error);
    res.status(500).send("Error interno del servidor"); // Handle unexpected errors gracefully
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
    let [
      pagos,
      clientes,
      polizas,
      usuarios,
      provincias,
      ciudades,
      coberturas,
      automarcas,
      sucursales,
      empresas,
    ] = await Promise.all(
      resources.map(async (file) => JSON.parse(await readFile(file, "utf-8")))
    );

    pagos = pagos.map((pago) => ({
      ...pago,
      cliente: clientes.find((c) => c.id === pago.id_cliente) || {
        nombre: "Cliente no encontrado",
      },
      poliza: polizas.find((p) => p.id === pago.id_poliza) || {
        n_poliza: "Póliza no encontrada",
      },
      cobrador: usuarios.find((u) => u.id === Number(pago.id_cobrador)) || {
        nombre: "Cobrador no encontrado",
      },
    }));

    const pago = pagos.find((p) => p.id === Number(id));

    if (!pago) {
      return res.status(404).send("Pago no encontrado");
    }

    pago.cliente.provincia = provincias.find(
      (p) => p.id == Number(pago.cliente.provincia)
    );
    pago.cliente.localidad = ciudades.find(
      (c) => c.id == Number(pago.cliente.localidad)
    );
    pago.poliza.cobertura = coberturas.find(
      (c) => c.id == Number(pago.poliza.cobertura)
    );
    pago.poliza.marca = automarcas.find(
      (a) => a.id == Number(pago.poliza.marca)
    );
    pago.poliza.empresa = empresas.find(
      (e) => e.id == Number(pago.poliza.empresa)
    );
    pago.cobrador.sucursal = sucursales.find(
      (s) => s.id == Number(pago.cobrador.sucursal)
    );

    res.render("pagos/pago", { pago });
  } catch (error) {
    console.error("Error al procesar los datos:", error);
    res.status(500).send("Error interno del servidor"); // Handle unexpected errors gracefully
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
    let [
      pagos,
      clientes,
      polizas,
      usuarios,
      provincias,
      ciudades,
      coberturas,
      automarcas,
      sucursales,
      empresas,
    ] = await Promise.all(
      resources.map(async (file) => JSON.parse(await readFile(file, "utf-8")))
    );

    pagos = pagos.map((pago) => ({
      ...pago,
      cliente: clientes.find((c) => c.id === pago.id_cliente) || {
        nombre: "Cliente no encontrado",
      },
      poliza: polizas.find((p) => p.id === pago.id_poliza) || {
        n_poliza: "Póliza no encontrada",
      },
      cobrador: usuarios.find((u) => u.id === Number(pago.id_cobrador)) || {
        nombre: "Cobrador no encontrado",
      },
    }));

    const pago = pagos.find((p) => p.id === Number(id));

    if (!pago) {
      return res.status(404).send("Pago no encontrado");
    }
    // Obtener la póliza asociada al pago
    const poliza = polizas.find((p) => p.id === pago.id_poliza);

    if (!poliza) {
      return res.status(404).send("Póliza no encontrada");
    }

    // Obtener todos los pagos para esta póliza
    const pagosPoliza = pagos.filter((p) => p.id_poliza === poliza.id);

    // Ordenar los pagos por fecha
    pagosPoliza.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Calcular la próxima fecha de pago
    let fechaUltimoPago = DateTime.fromISO(
      pagosPoliza[pagosPoliza.length - 1].fecha
    ).setZone("America/Argentina/Buenos_Aires");
    let proximoPago = fechaUltimoPago.plus({ months: 1 });

    // Ajustar al último día del mes si es necesario
    proximoPago =
      proximoPago.day > proximoPago.daysInMonth
        ? proximoPago.endOf("month")
        : proximoPago;

    // **CORRECCIÓN:** Ajustar la fecha de pago según la vigencia de la póliza y la cantidad de cuotas
    const fechaFinVigencia = DateTime.fromISO(poliza.f_fin_vigencia).setZone(
      "America/Argentina/Buenos_Aires"
    );
    const mesesVigencia = poliza.periodo; // Asumiendo que "periodo" indica la duración en meses
    const cuotas = poliza.cuotas;

    // Calcular la fecha de pago teórica para cada cuota
    const fechasPagoTeoricas = [];
    let fechaPagoTeorica = DateTime.fromISO(poliza.f_ini_vigencia).setZone(
      "America/Argentina/Buenos_Aires"
    );
    for (let i = 0; i < cuotas; i++) {
      fechasPagoTeoricas.push(fechaPagoTeorica);
      fechaPagoTeorica = fechaPagoTeorica.plus({
        months: mesesVigencia / cuotas,
      });
    }

    // Encontrar la próxima fecha de pago que no haya sido pagada
    for (const fechaPagoTeorica of fechasPagoTeoricas) {
      const pagoRealizado = pagosPoliza.find((p) =>
        DateTime.fromISO(p.fecha)
          .setZone("America/Argentina/Buenos_Aires")
          .equals(fechaPagoTeorica)
      );
      if (!pagoRealizado) {
        proximoPago = fechaPagoTeorica;
        break;
      }
    }

    // Ajustar al último día del mes si es necesario
    proximoPago =
      proximoPago.day > proximoPago.daysInMonth
        ? proximoPago.endOf("month")
        : proximoPago;

    pago.proximoPago = proximoPago.toFormat("dd/MM/yyyy");

    Object.defineProperty(String.prototype, "capitalizar", {
      value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
      },
      writable: true, // Asi, puede sobreescribirse más tarde
      configurable: true, // Asi, puede borrarse más tarde
    });

    pago.cliente.provincia = provincias.find(
      (p) => p.id == Number(pago.cliente.provincia)
    );
    pago.cliente.localidad = ciudades.find(
      (c) => c.id == Number(pago.cliente.localidad)
    );
    pago.poliza.cobertura = coberturas.find(
      (c) => c.id == Number(pago.poliza.cobertura)
    );
    pago.poliza.marca = automarcas.find(
      (a) => a.id == Number(pago.poliza.marca)
    );
    pago.poliza.empresa = empresas.find(
      (e) => e.id == Number(pago.poliza.empresa)
    );
    pago.cobrador.sucursal = sucursales.find(
      (s) => s.id == Number(pago.cobrador.sucursal)
    );

    // Usar Luxon para formatear la fecha
    pago.fechaEnLetras = DateTime.fromISO(pago.fecha).toLocaleString(); // Obtener el mes en inglés

    // convertir el monto a moneda argentina en formato de texto
    var numeroALetras = (function () {
      function Unidades(num) {
        switch (num) {
          case 1:
            return "UN";
          case 2:
            return "DOS";
          case 3:
            return "TRES";
          case 4:
            return "CUATRO";
          case 5:
            return "CINCO";
          case 6:
            return "SEIS";
          case 7:
            return "SIETE";
          case 8:
            return "OCHO";
          case 9:
            return "NUEVE";
        }

        return "";
      } //Unidades()

      function Decenas(num) {
        let decena = Math.floor(num / 10);
        let unidad = num - decena * 10;

        switch (decena) {
          case 1:
            switch (unidad) {
              case 0:
                return "DIEZ";
              case 1:
                return "ONCE";
              case 2:
                return "DOCE";
              case 3:
                return "TRECE";
              case 4:
                return "CATORCE";
              case 5:
                return "QUINCE";
              default:
                return "DIECI" + Unidades(unidad);
            }
          case 2:
            switch (unidad) {
              case 0:
                return "VEINTE";
              default:
                return "VEINTI" + Unidades(unidad);
            }
          case 3:
            return DecenasY("TREINTA", unidad);
          case 4:
            return DecenasY("CUARENTA", unidad);
          case 5:
            return DecenasY("CINCUENTA", unidad);
          case 6:
            return DecenasY("SESENTA", unidad);
          case 7:
            return DecenasY("SETENTA", unidad);
          case 8:
            return DecenasY("OCHENTA", unidad);
          case 9:
            return DecenasY("NOVENTA", unidad);
          case 0:
            return Unidades(unidad);
        }
      } //Unidades()

      function DecenasY(strSin, numUnidades) {
        if (numUnidades > 0) return strSin + " Y " + Unidades(numUnidades);

        return strSin;
      } //DecenasY()

      function Centenas(num) {
        let centenas = Math.floor(num / 100);
        let decenas = num - centenas * 100;

        switch (centenas) {
          case 1:
            if (decenas > 0) return "CIENTO " + Decenas(decenas);
            return "CIEN";
          case 2:
            return "DOSCIENTOS " + Decenas(decenas);
          case 3:
            return "TRESCIENTOS " + Decenas(decenas);
          case 4:
            return "CUATROCIENTOS " + Decenas(decenas);
          case 5:
            return "QUINIENTOS " + Decenas(decenas);
          case 6:
            return "SEISCIENTOS " + Decenas(decenas);
          case 7:
            return "SETECIENTOS " + Decenas(decenas);
          case 8:
            return "OCHOCIENTOS " + Decenas(decenas);
          case 9:
            return "NOVECIENTOS " + Decenas(decenas);
        }

        return Decenas(decenas);
      } //Centenas()

      function Seccion(num, divisor, strSingular, strPlural) {
        let cientos = Math.floor(num / divisor);
        let resto = num - cientos * divisor;

        let letras = "";

        if (cientos > 0)
          if (cientos > 1) letras = Centenas(cientos) + " " + strPlural;
          else letras = strSingular;

        if (resto > 0) letras += "";

        return letras;
      } //Seccion()

      function Miles(num) {
        let divisor = 1000;
        let cientos = Math.floor(num / divisor);
        let resto = num - cientos * divisor;

        let strMiles = Seccion(num, divisor, "UN MIL", "MIL");
        let strCentenas = Centenas(resto);

        if (strMiles == "") return strCentenas;

        return strMiles + strCentenas;
      } //Miles()

      function Millones(num) {
        let divisor = 1000000;
        let cientos = Math.floor(num / divisor);
        let resto = num - cientos * divisor;

        let strMillones = Seccion(num, divisor, "UN MILLON DE", "MILLONES DE");
        let strMiles = Miles(resto);

        if (strMillones == "") return strMiles;

        return strMillones + strMiles;
      } //Millones()

      return function NumeroALetras(num, currency) {
        currency = currency || {};
        let data = {
          numero: num,
          enteros: Math.floor(num),
          centavos: Math.round(num * 100) - Math.floor(num) * 100,
          letrasCentavos: "",
          letrasMonedaPlural: currency.plural || "PESOS CHILENOS", //'PESOS', 'Dólares', 'Bolívares', 'etcs'
          letrasMonedaSingular: currency.singular || "PESO CHILENO", //'PESO', 'Dólar', 'Bolivar', 'etc'
          letrasMonedaCentavoPlural:
            currency.centPlural || "CHIQUI PESOS CHILENOS",
          letrasMonedaCentavoSingular:
            currency.centSingular || "CHIQUI PESO CHILENO",
        };

        if (data.centavos > 0) {
          data.letrasCentavos =
            "CON " +
            (function () {
              if (data.centavos == 1)
                return (
                  Millones(data.centavos) +
                  " " +
                  data.letrasMonedaCentavoSingular
                );
              else
                return (
                  Millones(data.centavos) + " " + data.letrasMonedaCentavoPlural
                );
            })();
        }

        if (data.enteros == 0)
          return "CERO " + data.letrasMonedaPlural + " " + data.letrasCentavos;
        if (data.enteros == 1)
          return (
            Millones(data.enteros) +
            " " +
            data.letrasMonedaSingular +
            " " +
            data.letrasCentavos
          );
        else
          return (
            Millones(data.enteros) +
            " " +
            data.letrasMonedaPlural +
            " " +
            data.letrasCentavos
          );
      };
    })();

    pago.valorEnLetras = numeroALetras(pago.valor, {
      plural: "PESOS",
      singular: "PESO",
      centPlural: "PESOS",
      centSingular: "PESO",
    }).trim();
    // return res.status(200).json({ pago });
    res.render("pagos/recibo", { pago, DateTime });
  } catch (error) {
    console.error("Error al procesar los datos:", error);
    res.status(500).send("Error interno del servidor"); // Handle unexpected errors gracefully
  }
};

export const pagar = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Cargar archivos necesarios individualmente
    const polizas = await readFile(path.resolve(process.cwd(), "src/data", "polizas.json"), "utf-8")
      .then(JSON.parse)
      .catch(() => []);

    const clientes = await readFile(path.resolve(process.cwd(), "src/data", "clientes.json"), "utf-8")
      .then(JSON.parse)
      .catch(() => []);

    // 2. Buscar la póliza y el cliente
    const poliza = polizas.find(p => p.id === parseInt(id));
    if (!poliza) return res.status(404).send("Póliza no encontrada");

    const cliente = clientes.find(c => c.id === parseInt(poliza.clienteId));
    if (!cliente) return res.status(404).send("Cliente no encontrado");

    // 3. Cargar datos adicionales solo si son necesarios
    const [provincias, ciudades, coberturas, automarcas, empresas, pagos] = await Promise.all([
      readFile(path.resolve(process.cwd(), "src/data", "provincias.json"), "utf-8").then(JSON.parse).catch(() => []),
      readFile(path.resolve(process.cwd(), "src/data", "ciudades.json"), "utf-8").then(JSON.parse).catch(() => []),
      readFile(path.resolve(process.cwd(), "src/data", "coberturas.json"), "utf-8").then(JSON.parse).catch(() => []),
      readFile(path.resolve(process.cwd(), "src/data", "automarcas.json"), "utf-8").then(JSON.parse).catch(() => []),
      readFile(path.resolve(process.cwd(), "src/data", "empresas.json"), "utf-8").then(JSON.parse).catch(() => []),
      readFile(path.resolve(process.cwd(), "src/data", "pagos.json"), "utf-8").then(JSON.parse).catch(() => [])
    ]);

    // 4. Enriquecer datos
    cliente.provincia = provincias.find(p => p.id == Number(cliente.provincia));
    cliente.localidad = ciudades.find(c => c.id == Number(cliente.localidad));
    poliza.cobertura = coberturas.find(c => c.id == Number(poliza.cobertura));
    poliza.marca = automarcas.find(a => a.id == Number(poliza.marca));
    poliza.empresa = empresas.find(e => e.id == Number(poliza.empresa));
    poliza.pagos = pagos.filter(p => p.id_poliza === poliza.id && !p.desconocido);

    // 5. Renderizar vista
    res.render("pagos/pagar", { 
      poliza, 
      cliente,
      title: "Registrar Pago"
    });

  } catch (error) {
    console.error("Error en el proceso de pago:", error);
    res.status(500).render('error', {
      title: "Error del servidor",
      message: "Ocurrió un error al procesar su solicitud"
    });
  }
};

export const acreditar = async (req, res) => {
  try {
    const { polizaId, observaciones } = req.body;
    const userId = req.session.user.id;

    // 1. Validación de entrada
    if (!polizaId || isNaN(Number(polizaId))) {
      return res.status(400).render('error', {
        title: 'ID inválido',
        message: 'El ID de póliza proporcionado no es válido'
      });
    }

    // 2. Cargar archivos necesarios
    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const pagosPath = path.resolve(process.cwd(), "src/data", "pagos.json");

    const [polizasData, pagosData] = await Promise.all([
      readFile(polizasPath, "utf-8").then(JSON.parse).catch(() => []),
      readFile(pagosPath, "utf-8").then(JSON.parse).catch(() => [])
    ]);

    // 3. Buscar la póliza
    const polizaIndex = polizasData.findIndex(p => p.id === Number(polizaId));
    if (polizaIndex === -1) {
      return res.status(404).render('error', {
        title: 'Póliza no encontrada',
        message: 'La póliza especificada no existe'
      });
    }

    const poliza = polizasData[polizaIndex];

    // 4. Crear nuevo pago
    const fecha = DateTime.now().setZone("America/Argentina/Buenos_Aires");
    const nuevoPago = {
      id: fecha.toMillis(),
      id_cliente: Number(poliza.clienteId),
      id_poliza: Number(poliza.id),
      n_poliza: Number(poliza.n_poliza),
      fecha: fecha.toFormat("yyyy-MM-dd"),
      hora: fecha.toFormat("HH:mm:ss"),
      valor: Number(poliza.precio) / poliza.cuotas,
      forma_pago: "efectivo",
      observaciones: observaciones || '',
      n_cuota: (poliza.pagos?.length || 0) + 1,
      desconocido: false,
      id_cobrador: Number(userId)
    };

    // 5. Actualizar datos
    const pagosActualizados = [...pagosData, nuevoPago];
    const polizasActualizadas = [...polizasData];
    polizasActualizadas[polizaIndex].pagos = [...(poliza.pagos || []), nuevoPago.id];

    // 6. Guardar cambios
    await Promise.all([
      writeFile(pagosPath, JSON.stringify(pagosActualizados, null, 2)),
      writeFile(polizasPath, JSON.stringify(polizasActualizadas, null, 2))
    ]);

    // 7. Redirigir con mensaje de éxito
    req.session.flash = { type: 'success', message: 'Pago registrado correctamente' };
    res.redirect(`/polizas/detalle/${polizaId}`);

  } catch (error) {
    console.error("Error al acreditar pago:", error);
    res.status(500).render('error', {
      title: "Error en el pago",
      message: "Ocurrió un error al procesar el pago",
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};

export const eliminar = async (req, res) => {
  try {
    const { pagoId, polizaId } = req.body;
    const userId = req.session.user.id;

    // 1. Validación de entrada
    if (!pagoId || !polizaId || isNaN(Number(pagoId)) || isNaN(Number(polizaId))) {
      return res.status(400).render('error', {
        title: 'Datos inválidos',
        message: 'Los IDs proporcionados no son válidos'
      });
    }

    // 2. Definir paths de archivos
    const pagosPath = path.resolve(process.cwd(), "src/data", "pagos.json");
    const polizasPath = path.resolve(process.cwd(), "src/data", "polizas.json");
    const actividadesPath = path.resolve(process.cwd(), "src/data", "actividades.json");

    // 3. Cargar datos
    const [pagos, polizas, actividades] = await Promise.all([
      readFile(pagosPath, "utf-8").then(JSON.parse).catch(() => []),
      readFile(polizasPath, "utf-8").then(JSON.parse).catch(() => []),
      readFile(actividadesPath, "utf-8").then(JSON.parse).catch(() => [])
    ]);

    // 4. Buscar pago y póliza
    const pagoIndex = pagos.findIndex(p => p.id === Number(pagoId));
    if (pagoIndex === -1) {
      return res.status(404).render('error', {
        title: 'Pago no encontrado',
        message: 'El pago especificado no existe'
      });
    }

    const polizaIndex = polizas.findIndex(p => p.id === Number(polizaId));
    if (polizaIndex === -1) {
      return res.status(404).render('error', {
        title: 'Póliza no encontrada',
        message: 'La póliza asociada no existe'
      });
    }

    // 5. Actualizar datos (usando inmutabilidad)
    const pagosActualizados = [...pagos];
    const polizasActualizadas = [...polizas];
    const actividadesActualizadas = [...actividades];

    // Marcar pago como desconocido
    pagosActualizados[pagoIndex] = { 
      ...pagosActualizados[pagoIndex], 
      desconocido: true 
    };

    // Actualizar póliza (filtrar el pago eliminado)
    polizasActualizadas[polizaIndex] = {
      ...polizasActualizadas[polizaIndex],
      pagos: polizasActualizadas[polizaIndex].pagos.filter(id => id !== Number(pagoId))
    };

    // Registrar actividad
    const fechaArgentina = DateTime.now().setZone("America/Argentina/Buenos_Aires");
    const nuevaActividad = {
      id: fechaArgentina.toMillis(),
      id_pago: Number(pagoId),
      accion: "Eliminar pago",
      id_usuario: userId,
      fecha: fechaArgentina.toFormat("yyyy-MM-dd"),
      hora: fechaArgentina.toFormat("HH:mm:ss"),
      tipo: "pago"
    };
    actividadesActualizadas.push(nuevaActividad);

    // 6. Guardar cambios
    await Promise.all([
      writeFile(pagosPath, JSON.stringify(pagosActualizados, null, 2)),
      writeFile(polizasPath, JSON.stringify(polizasActualizadas, null, 2)),
      writeFile(actividadesPath, JSON.stringify(actividadesActualizadas, null, 2))
    ]);

    // 7. Redirigir con mensaje de éxito
    req.session.flash = { type: 'success', message: 'Pago eliminado correctamente' };
    res.redirect("/polizas");

  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).render('error', {
      title: "Error al eliminar",
      message: "Ocurrió un error al intentar eliminar el pago",
      error: process.env.NODE_ENV === 'development' ? error : null
    });
  }
};