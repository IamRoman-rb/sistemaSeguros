import { Router } from "express";
import polizas from "../controllers/polizasController.js";
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/polizas", isAuthenticated, polizas.index);
router.get('/polizas/buscarCliente', isAuthenticated,polizas.buscarCliente); // Ruta conectada
router.get('/polizas/nueva/:id', isAuthenticated, polizas.nueva); // Ruta para manejar el ID
router.post('/polizas/nueva/:id', isAuthenticated,polizas.crearPoliza);
router.get('/polizas/detalle/:id', isAuthenticated, polizas.detalle);
router.get("/polizas/eliminar/:id", isAuthenticated, polizas.confirmarEliminar);
router.post("/polizas/eliminar/:id", isAuthenticated, polizas.eliminar);
router.get('/polizas/editar/:id', isAuthenticated, polizas.editar);
router.post('/polizas/editar/:id', isAuthenticated, polizas.modificarPoliza);

export default router;
