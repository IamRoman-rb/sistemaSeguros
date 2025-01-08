import { Router } from "express";
import polizas from "../controllers/polizasController.js";
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, polizas.index);
router.get('/buscarCliente', hasPermitions, polizas.buscarPoliza); // Ruta conectada
router.get('/nuevo/:id', hasPermitions, polizas.nueva); // Ruta para manejar el ID
router.get('/detalle/:id', hasPermitions, polizas.detalle);
router.get("/confirmar/:id", hasPermitions, polizas.confirmarEliminar);
router.get('/editar/:id', hasPermitions, polizas.editar);
router.post('/guardar', polizas.crearPoliza);
router.post('/actualizar', polizas.modificarPoliza);
router.post("/eliminar", polizas.eliminar);

export default router;
