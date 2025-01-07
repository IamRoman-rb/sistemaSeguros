import { Router } from "express";
import polizas from "../controllers/polizasController.js";
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, polizas.index);
router.get('/buscarCliente', hasPermitions, polizas.buscarCliente); // Ruta conectada
router.get('/nuevo/:id', hasPermitions, polizas.nueva); // Ruta para manejar el ID
router.get('/detalle/:id', hasPermitions, polizas.detalle);
router.get("/eliminar/:id", hasPermitions, polizas.confirmarEliminar);
router.post("/eliminar/:id", hasPermitions, polizas.eliminar);
router.get('/editar/:id', hasPermitions, polizas.editar);
router.post('/guardar/:id', polizas.crearPoliza);
router.post('/actualizar/:id', polizas.modificarPoliza);

export default router;
