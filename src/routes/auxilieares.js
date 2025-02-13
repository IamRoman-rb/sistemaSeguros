import { Router } from "express";
import { auxiliares, editar, actualizar } from "../controllers/auxiliearesController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, auxiliares);
// router.get("/nuevo", hasPermitions, nuevo);
// router.get('/confirmar/:id', hasPermitions, confirmar);
router.get('/editar/:id', hasPermitions, editar);
// router.post('/guardar', guardar);
router.post('/actualizar', actualizar);
// router.post('/eliminar', eliminar);

export default router;
