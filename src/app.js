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