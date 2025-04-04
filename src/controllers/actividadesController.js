import { readFile } from "node:fs/promises";
import path from "path";
import { DateTime } from "luxon";

export const actividades = async (req, res) => {
  try {
    const { fecha, actividad, tipoPoliza } = req.query; // Agregamos filtro por tipo de póliza

    // Definir recursos con nombres más descriptivos
    const filePaths = {
      clientes: path.resolve(process.cwd(), "src/data", "clientes.json"),
      polizas: path.resolve(process.cwd(), "src/data", "polizas.json"),
      otrosRiesgos: path.resolve(
        process.cwd(),
        "src/data",
        "otros_riesgos.json"
      ),
      pagos: path.resolve(process.cwd(), "src/data", "pagos.json"),
      usuarios: path.resolve(process.cwd(), "src/data", "usuarios.json"),
      actividades: path.resolve(process.cwd(), "src/data", "actividades.json"),
    };

    // Leer archivos con manejo de errores individual
    const [clientes, polizas, otrosRiesgos, pagos, usuarios, actividades] =
      await Promise.all([
        readFile(filePaths.clientes, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
        readFile(filePaths.polizas, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
        readFile(filePaths.otrosRiesgos, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
        readFile(filePaths.pagos, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
        readFile(filePaths.usuarios, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
        readFile(filePaths.actividades, "utf-8")
          .then(JSON.parse)
          .catch(() => []),
      ]);

    // Función mejorada para enriquecer actividades
    const enrichActivity = (actividad) => {
      const enriched = { ...actividad };

      // Agregar información de usuario
      enriched.usuario =
        usuarios.find((u) => u.id === Number(actividad.id_usuario)) || null;

      switch (actividad.tipo) {
        case "cliente":
          enriched.cliente =
            clientes.find((c) => c.id === Number(actividad.id_cliente)) || null;
          break;

        case "poliza":
          // Buscar primero en polizas regulares
          enriched.poliza =
            polizas.find((p) => p.id === Number(actividad.id_poliza)) ||
            otrosRiesgos.find((p) => p.id === Number(actividad.id_poliza)) ||
            null;

          if (enriched.poliza) {
            enriched.poliza.tipo = enriched.poliza.tipo_poliza
              ? "otros_riesgos"
              : "poliza";
            enriched.poliza.cliente =
              clientes.find((c) => c.id === enriched.poliza.clienteId) || null;
          }
          break;

        case "pago":
          enriched.pago =
            pagos.find((p) => p.id == Number(actividad.id_pago)) || null;
          if (enriched.pago) {
            enriched.pago.cliente =
              clientes.find((c) => c.id === enriched.pago.id_cliente) || null;
            // Determinar si el pago es de poliza u otros riesgos
            enriched.pago.tipoPoliza = polizas.some(
              (p) => p.id === enriched.pago.id_poliza
            )
              ? "poliza"
              : otrosRiesgos.some((p) => p.id === enriched.pago.id_poliza)
              ? "otros_riesgos"
              : "desconocido";
          }
          break;
      }

      return enriched;
    };

    // Procesar actividades con mejor manejo de fechas
    let actividadesFiltradas = actividades
      .map((actividad) => {
        try {
          const fechaHoraOriginal = DateTime.fromFormat(
            `${actividad.fecha} ${actividad.hora}`,
            "yyyy-MM-dd HH:mm:ss",
            { zone: "America/Argentina/Buenos_Aires" }
          );
          return {
            ...enrichActivity(actividad),
            fecha: fechaHoraOriginal.toFormat("yyyy-MM-dd"),
            hora: fechaHoraOriginal.toFormat("HH:mm:ss"),
            fechaObj: fechaHoraOriginal, // Mantener objeto para ordenamiento
          };
        } catch (error) {
          console.error(
            `Error procesando actividad ID ${actividad.id}:`,
            error
          );
          return null;
        }
      })
      .filter(Boolean); // Eliminar nulos por errores de formato

    // Ordenar por fecha y hora (más eficiente con fechaObj)
    actividadesFiltradas.sort((a, b) => b.fechaObj - a.fechaObj);

    // Aplicar filtros
    if (fecha) {
      actividadesFiltradas = actividadesFiltradas.filter(
        (a) => a.fecha === fecha
      );
    }

    if (actividad && actividad !== ".") {
      actividadesFiltradas = actividadesFiltradas.filter(
        (a) => a.tipo === actividad
      );
    }

    // Nuevo filtro por tipo de póliza
    if (tipoPoliza) {
      actividadesFiltradas = actividadesFiltradas.filter((a) => {
        if (a.tipo === "poliza") {
          return a.poliza?.tipo === tipoPoliza;
        }
        if (a.tipo === "pago") {
          return a.pago?.tipoPoliza === tipoPoliza;
        }
        return true;
      });
    }

    res.render("actividades/actividades", {
      actividades: actividadesFiltradas.map((a) => {
        const { fechaObj, ...rest } = a;
        return rest;
      }),
    });
  } catch (error) {
    console.error("Error en actividades:", error);
    res.status(500).render("error", {
      message: "Error al procesar actividades",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

export const datos = async (req, res) => {
  try {
    // Definir rutas con nombres descriptivos
    const filePaths = {
      clientes: path.resolve(process.cwd(), "src/data", "clientes.json"),
      polizas: path.resolve(process.cwd(), "src/data", "polizas.json"),
      otrosRiesgos: path.resolve(
        process.cwd(),
        "src/data",
        "otros_riesgos.json"
      ),
      pagos: path.resolve(process.cwd(), "src/data", "pagos.json"),
      sucursales: path.resolve(process.cwd(), "src/data", "sucursales.json"),
      empresas: path.resolve(process.cwd(), "src/data", "empresas.json"),
      usuarios: path.resolve(process.cwd(), "src/data", "usuarios.json"),
      actividades: path.resolve(process.cwd(), "src/data", "actividades.json"),
    };

    // Leer todos los archivos con manejo de errores individual
    const [
      clientes,
      polizas,
      otrosRiesgos,
      pagos,
      sucursales,
      empresas,
      usuarios,
      actividades,
    ] = await Promise.all([
      readFile(filePaths.clientes, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.polizas, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.otrosRiesgos, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.pagos, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.sucursales, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.empresas, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.usuarios, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
      readFile(filePaths.actividades, "utf-8")
        .then(JSON.parse)
        .catch(() => []),
    ]);

    const now = DateTime.local();
    const startOfCurrentMonth = now.startOf("month");
    const endOfCurrentMonth = now.endOf("month");

    // Preparar datos de sucursales y empresas
    const datosSucursales = sucursales.map((sucursal) => ({
      id: sucursal.id,
      nombre: sucursal.nombre,
      polizasCreadasTotal: 0,
      polizasCreadasMes: 0,
      otrosRiesgosCreadosTotal: 0,
      otrosRiesgosCreadosMes: 0,
    }));

    const datosEmpresas = empresas.map((empresa) => ({
      id: empresa.id,
      nombre: empresa.nombre,
      polizasCreadasTotal: 0,
      polizasCreadasMes: 0,
      otrosRiesgosCreadosTotal: 0,
      otrosRiesgosCreadosMes: 0,
    }));

    // Preparar datos de usuarios
    const datosUsuarios = usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      sucursal:
        sucursales.find((s) => s.id === usuario.sucursal)?.nombre ||
        "Desconocido",
      polizasCreadasTotal: 0,
      polizasCreadasMes: 0,
      otrosRiesgosCreadosTotal: 0,
      otrosRiesgosCreadosMes: 0,
      pagosCobradosTotal: 0,
      pagosCobradosMes: 0,
      pagosEliminadosTotal: 0,
      pagosEliminadosMes: 0,
      clientesCreadosTotal: 0,
      clientesCreadosMes: 0,
      clientesEliminadosTotal: 0,
      clientesEliminadosMes: 0,
      polizasEliminadasTotal: 0,
      polizasEliminadasMes: 0,
      otrosRiesgosEliminadosTotal: 0,
      otrosRiesgosEliminadosMes: 0,
    }));

    // Procesar actividades
    actividades.forEach((actividad) => {
      const usuario = datosUsuarios.find((u) => u.id == actividad.id_usuario);
      if (!usuario) return;

      const fechaActividad = DateTime.fromISO(actividad.fecha);
      const esEsteMes =
        fechaActividad >= startOfCurrentMonth &&
        fechaActividad <= endOfCurrentMonth;

      switch (actividad.accion) {
        case "Crear cliente":
          usuario.clientesCreadosTotal++;
          if (esEsteMes) usuario.clientesCreadosMes++;
          break;

        case "Eliminar cliente":
          usuario.clientesEliminadosTotal++;
          if (esEsteMes) usuario.clientesEliminadosMes++;
          break;

        case "Eliminar pago":
          usuario.pagosEliminadosTotal++;
          if (esEsteMes) usuario.pagosEliminadosMes++;
          break;

        case "Eliminar poliza":
          // Determinar si es poliza u otros riesgos
          const esOtrosRiesgos = otrosRiesgos.some(
            (p) => p.id == actividad.id_poliza
          );
          if (esOtrosRiesgos) {
            usuario.otrosRiesgosEliminadosTotal++;
            if (esEsteMes) usuario.otrosRiesgosEliminadosMes++;
          } else {
            usuario.polizasEliminadasTotal++;
            if (esEsteMes) usuario.polizasEliminadasMes++;
          }
          break;
      }
    });

    // Procesar pólizas y otros riesgos
    [...polizas, ...otrosRiesgos].forEach((poliza) => {
      const usuario = datosUsuarios.find((u) => u.id == poliza.usuario);
      if (!usuario) return;

      const esOtrosRiesgos = poliza.tipo_poliza !== undefined;
      const fechaEmision = DateTime.fromISO(poliza.f_emision);
      const esEsteMes =
        fechaEmision >= startOfCurrentMonth &&
        fechaEmision <= endOfCurrentMonth;

      if (esOtrosRiesgos) {
        usuario.otrosRiesgosCreadosTotal++;
        if (esEsteMes) usuario.otrosRiesgosCreadosMes++;
      } else {
        usuario.polizasCreadasTotal++;
        if (esEsteMes) usuario.polizasCreadasMes++;
      }

      // Estadísticas por sucursal
      const sucursal = datosSucursales.find((s) => s.id == poliza.sucursal);
      if (sucursal) {
        if (esOtrosRiesgos) {
          sucursal.otrosRiesgosCreadosTotal++;
          if (esEsteMes) sucursal.otrosRiesgosCreadosMes++;
        } else {
          sucursal.polizasCreadasTotal++;
          if (esEsteMes) sucursal.polizasCreadasMes++;
        }
      }

      // Estadísticas por empresa
      const empresa = datosEmpresas.find((e) => e.id == poliza.empresa);
      if (empresa) {
        if (esOtrosRiesgos) {
          empresa.otrosRiesgosCreadosTotal++;
          if (esEsteMes) empresa.otrosRiesgosCreadosMes++;
        } else {
          empresa.polizasCreadasTotal++;
          if (esEsteMes) empresa.polizasCreadasMes++;
        }
      }
    });

    // Procesar pagos
    pagos.forEach((pago) => {
      const cobrador = datosUsuarios.find((u) => u.id == pago.id_cobrador);
      if (!cobrador) return;

      const fechaPago = DateTime.fromISO(pago.fecha);
      const esEsteMes =
        fechaPago >= startOfCurrentMonth && fechaPago <= endOfCurrentMonth;

      cobrador.pagosCobradosTotal++;
      if (esEsteMes) cobrador.pagosCobradosMes++;
    });

    res.status(200).render("actividades/datos", {
      datos: datosUsuarios,
      datosSucursales,
      datosEmpresas,
      periodo: {
        inicio: startOfCurrentMonth.toFormat("dd/MM/yyyy"),
        fin: endOfCurrentMonth.toFormat("dd/MM/yyyy"),
      },
    });
  } catch (error) {
    console.error("Error en datos:", error);
    res.status(500).render("error", {
      message: "Error al procesar datos estadísticos",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};
