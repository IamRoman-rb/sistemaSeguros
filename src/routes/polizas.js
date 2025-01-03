import { Router } from "express";
import polizas from "../controllers/polizasController.js";

const router = Router();

router.get("/polizas", polizas.index);
router.get('/polizas/buscarCliente', polizas.buscarCliente); // Ruta conectada
router.get('/polizas/nueva/:id', polizas.nueva); // Ruta para manejar el ID
router.post('/polizas/nueva/:id', polizas.crearPoliza);
router.get('/polizas/detalle/:id', polizas.detalle);

export default router;
