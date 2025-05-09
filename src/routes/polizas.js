import { Router } from "express";
import { listado, nueva, detalle, confirmar, editar, guardar, actualizar, eliminar,renovar, propuesta, ficha} from "../controllers/polizasController.js";
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, listado);
router.get('/nuevo/:id', hasPermitions, nueva); // Ruta para manejar el ID
router.get('/detalle/:id', hasPermitions, detalle);
router.get("/confirmar/:id", hasPermitions, confirmar);
router.get('/editar/:id', hasPermitions, editar);
router.post('/guardar', guardar);
router.post('/actualizar', actualizar);
router.post("/eliminar", eliminar);
router.get('/renovar/:id', hasPermitions, renovar);
router.get('/propuesta/:id', hasPermitions, propuesta);
router.get('/ficha/:id', ficha);

export default router;
