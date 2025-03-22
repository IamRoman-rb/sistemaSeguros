import path, { dirname } from "node:path";

// Third-party Libraries
import express from "express";
import morgan from "morgan";
import session from 'express-session';
import cookie from 'cookie-parser';

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
import setUserMiddleware from './middlewares/setUserMiddleware.js';
import isAuthenticated from './middlewares/isAuthenticated.js';
import loadStylesheet from './middlewares/loadStylesheet.js';

// Usar import.meta.url para obtener el directorio actual
const __dirname = path.resolve(dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:"));

const app = express();
const port = process.env.PORT || 3000;

// settings
app.set("port", process.env.PORT || port);
// starting the server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.set("view engine", "ejs");

// Aquí corregimos la ruta de las vistas:
app.set("views", path.join(__dirname, "views"));

// statics files
app.use(express.static(path.join(__dirname, "../public")));

// middlewares
// app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cookie());
app.use(session({
  secret: '1234',
  resave: false,
  saveUninitialized: false
}));

// middleware para establecer el usuario en res.locals
app.use(setUserMiddleware);


// middleware para cargar el stylesheet
app.use(loadStylesheet);

// routes
app.use(auth);
app.use(isAuthenticated);
app.use("/usuarios",usuarios);
app.use("/clientes",clientes);
app.use("/polizas",polizas);
app.use("/pagos",pagos);
app.use("/caja",caja);
app.use("/empresas", empresas);
app.use("/actividades", actividades);
app.use("/auxiliares", auxiliares);
app.use("/otros-riesgos", otrosRiesgos);
app.use("/pagos-otros-riesgos", pagosOtrosRiesgos);