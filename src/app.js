import { readFile, writeFile } from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import morgan from "morgan";
import session from "express-session";
import cookie from "cookie-parser";

// Import Routes
import auth from "./routes/auth.js";
import usuarios from "./routes/usuarios.js";
import clientes from "./routes/clientes.js";
import polizas from "./routes/polizas.js";
import otrosRiesgos from "./routes/otrosRiesgos.js";
import caja from "./routes/caja.js";
import pagos from "./routes/pagos.js";
import pagosOtrosRiesgos from "./routes/pagosOtrosRiesgos.js";
import empresas from "./routes/empresas.js";
import actividades from "./routes/actividades.js";
import auxiliares from "./routes/auxilieares.js";

// Import Middlewares
import setUserMiddleware from "./middlewares/setUserMiddleware.js";
import isAuthenticated from "./middlewares/isAuthenticated.js";
import loadStylesheet from "./middlewares/loadStylesheet.js";

// Configuración de __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

/**
 * Función para limpiar datos incorrectos de los archivos JSON
 */
const cleanIncorrectData = async () => {
  try {
    const filesToClean = [
      {
        path: path.resolve(__dirname, "../src/data/otros_riesgos.json"),
        name: "otros_riesgos.json",
        validKeys: [
          "id",
          "n_poliza",
          "f_emision",
          "f_ini_vigencia",
          "f_fin_vigencia",
          "tipo_poliza",
          "periodo",
          "cuotas",
          "empresa",
          "precio",
          "clienteId",
          "sucursal",
          "pagos",
          "usuario",
          "inhabilitado",
        ],
      },
      {
        path: path.resolve(__dirname, "../src/data/pagos.json"),
        name: "pagos.json",
        validKeys: [
          "id",
          "id_cliente",
          "id_poliza",
          "n_poliza",
          "fecha",
          "hora",
          "valor",
          "forma_pago",
          "observaciones",
          "n_cuota",
          "desconocido",
          "id_cobrador",
        ],
      },
    ];

    const actividadesPath = path.resolve(
      __dirname,
      "../src/data/actividades.json"
    );

    console.log("🔍 Iniciando limpieza de datos incorrectos...");

    const actividadesData = await readFile(actividadesPath, "utf-8")
      .then(JSON.parse)
      .catch(() => []);

    for (const file of filesToClean) {
      console.log(`📂 Procesando archivo: ${file.name}`);

      const currentData = await readFile(file.path, "utf-8")
        .then(JSON.parse)
        .catch(() => []);

      // Filtrar objetos que no son actividades y tienen estructura válida
      const cleanedData = currentData.filter((item) => {
        // Eliminar si tiene estructura de actividad
        if (item.accion && item.id_usuario && item.fecha && item.hora) {
          return false;
        }

        // Verificar que tenga al menos una propiedad válida para este archivo
        return file.validKeys.some((key) => key in item);
      });

      // Eliminar duplicados que ya están en actividades.json
      const finalData = cleanedData.filter((item) => {
        if (!item.id) return true;
        return !actividadesData.some((act) => act.id === item.id);
      });

      if (finalData.length !== currentData.length) {
        await writeFile(file.path, JSON.stringify(finalData, null, 2));
        console.log(
          `✔️  Eliminados ${
            currentData.length - finalData.length
          } registros incorrectos de ${file.name}`
        );
      } else {
        console.log(
          `➖ No se encontraron registros incorrectos en ${file.name}`
        );
      }
    }

    console.log("✅ Limpieza completada exitosamente");
    return true;
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    return false;
  }
};

// Configuración de Express
app.set("port", port);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.static(path.join(__dirname, "../public")));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookie());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key-123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    },
  })
);

// Middlewares personalizados
app.use(setUserMiddleware);
app.use(loadStylesheet);

// Ejecutar limpieza solo en desarrollo
if (process.env.NODE_ENV !== "production") {
  cleanIncorrectData().then((success) => {
    if (success) {
      console.log("🚀 La aplicación puede iniciar con datos limpios");
    } else {
      console.error("⚠️  Hubo problemas limpiando los datos");
    }
  });
}

// Rutas
app.use(auth);
app.use(isAuthenticated);
app.use("/usuarios", usuarios);
app.use("/clientes", clientes);
app.use("/polizas", polizas);
app.use("/pagos", pagos);
app.use("/caja", caja);
app.use("/empresas", empresas);
app.use("/actividades", actividades);
app.use("/auxiliares", auxiliares);
app.use("/otros-riesgos", otrosRiesgos);
app.use("/pagos-otros-riesgos", pagosOtrosRiesgos);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Página no encontrada",
    message: "La página que buscas no existe",
    error: null,
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res.status(500).render("error", {
    title: "Error del servidor",
    message: "Algo salió mal en el servidor",
    error: process.env.NODE_ENV === "development" ? err : null,
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${port}`);
});
