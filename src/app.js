import express from "express";
import path, { dirname } from "node:path";
import morgan from "morgan";
import session from 'express-session';

import main from "./routes/main.js";
import polizas from "./routes/polizas.js";
import caja from "./routes/caja.js";
import clientes from "./routes/clientes.js";
import login from "./routes/login.js";
import pagos from "./routes/pagos.js";
import usuarios from "./routes/usuarios.js";

import setUserMiddleware from './middlewares/setUserMiddleware.js';

// Usar import.meta.url para obtener el directorio actual
const __dirname = path.resolve(dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:"));

const app = express();
const port = 3000;

// middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.use(session({resave:false, saveUninitialized:true, secret:'1234'}))

app.use(setUserMiddleware());



// settings
app.set("port", process.env.PORT || port);
app.set("view engine", "ejs");

// Aquí corregimos la ruta de las vistas:
app.set("views", path.join(__dirname, "views")); // Usamos path.join() para evitar errores de rutas


// routes
app.use(main);
app.use(polizas);
app.use(caja);
app.use(clientes);
app.use(login);
app.use(pagos);
app.use(usuarios);

// statics files
app.use(express.static(path.join(__dirname, "../public")));

// starting the server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));


// Revisar error al intentar iniciar sesion

// Hola Mundo