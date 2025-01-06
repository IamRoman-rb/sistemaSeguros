import { Router } from "express";
import polizas from "../controllers/polizasController.js";


const router = Router();

router.get("/", polizas.index);
router.get('/buscarCliente', polizas.buscarCliente); // Ruta conectada
router.get('/nueva/:id', polizas.nueva); // Ruta para manejar el ID
router.post('/guardar/:id', polizas.crearPoliza);
router.get('/detalle/:id', polizas.detalle);
router.get("/eliminar/:id", polizas.confirmarEliminar);
router.post("/eliminar/:id", polizas.eliminar);
router.get('/editar/:id', polizas.editar);
router.post('/actualizar/:id', polizas.modificarPoliza);

export default router;
