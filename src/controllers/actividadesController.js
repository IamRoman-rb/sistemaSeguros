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
    const filePaths = {
      clientes: path.resolve("src/data", "clientes.json"),
      polizas: path.resolve("src/data", "polizas.json"),
      otrosRiesgos: path.resolve("src/data", "otros_riesgos.json"),
      pagos: path.resolve("src/data", "pagos.json"),
      sucursales: path.resolve("src/data", "sucursales.json"),
      empresas: path.resolve("src/data", "empresas.json"),
      usuarios: path.resolve("src/data", "usuarios.json"),
      actividades: path.resolve("src/data", "actividades.json"),
    };

    const [clientes, polizas, otrosRiesgos, pagos, sucursales, empresas, usuarios, actividades] =
      await Promise.all(Object.values(filePaths).map(path =>
        readFile(path, "utf-8").then(JSON.parse)
      ));

    const todasLasPolizas = [...polizas, ...otrosRiesgos];
    const stats = {
      actividadesPorUsuario: usuarios
      .filter(usuario => usuario.permisos !== 1 && usuario.permisos !== 3)
      .map(usuario => {
        const actividadesUsuario = actividades.filter(a => a.id_usuario == usuario.id);
        return {
          nombre: usuario.nombre,
          recibos: actividadesUsuario.filter(a => a.accion == 'Crear cliente').length,
          polizas: actividadesUsuario.filter(a => a.accion == 'Creacion de poliza').length
        };
      }),

      polizasPorCompania: empresas.map(empresa => ({
        compania: empresa.nombre,
        cantidad: todasLasPolizas.filter(p => p.empresa == empresa.id).length
      })),
      
      polizasPorSucursal: sucursales.map(sucursal => ({
        sucursal: sucursal.nombre,
        cantidad: todasLasPolizas.filter(p => p.sucursal == sucursal.id).length
      })),
      

      pagosPorMes: Array.from({ length: 12 }, (_, i) => {
        const pagosDelMes = pagos.filter(p => {
          const fecha = new Date(p.fecha);
          return fecha.getMonth() == i;
        });
        return {
          mes: i,
          cantidad: pagosDelMes.length,
          total: pagosDelMes.reduce((suma, pago) => suma + pago.monto, 0)
        };
      })
    };

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    res.render("actividades/datos", {
      title: "Estadísticas del Sistema",
      stats,
      meses
    });

  } catch (error) {
    console.error("Error en datos:", error);
    res.status(500).render("error", {
      message: "Error al procesar datos estadísticos",
      error: process.env.NODE_ENV === "development" ? error : null,
    });
  }
};

