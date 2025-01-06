import { Router } from "express";
import polizas from "../controllers/polizasController.js";
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/", isAuthenticated, polizas.index);
router.get('/buscarCliente', isAuthenticated,polizas.buscarCliente); // Ruta conectada
router.get('/nueva/:id', isAuthenticated, polizas.nueva); // Ruta para manejar el ID
router.post('/guardar/:id', isAuthenticated,polizas.crearPoliza);
router.get('/detalle/:id', isAuthenticated, polizas.detalle);
router.get("/eliminar/:id", isAuthenticated, polizas.confirmarEliminar);
router.post("/eliminar/:id", isAuthenticated, polizas.eliminar);
router.get('/editar/:id', isAuthenticated, polizas.editar);
router.post('/actualizar/:id', isAuthenticated, polizas.modificarPoliza);

export default router;
