import { Router } from "express";
import { listado, nuevo, detalle, confirmar, editar, guardar, actualizar, eliminar } from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, listado);
router.get("/nuevo", hasPermitions, nuevo);
router.get('/detalle/:id', hasPermitions, detalle);
router.get('/confirmar/:id', hasPermitions, confirmar);
router.get('/editar/:id', hasPermitions, editar);
router.post('/guardar', guardar);
router.post('/actualizar', actualizar);
router.post('/eliminar/:id', eliminar);

export default router;
