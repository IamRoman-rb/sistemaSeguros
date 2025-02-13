import { Router } from "express";
import { auxiliares, editar, actualizar, nuevo, guardar } from "../controllers/auxiliearesController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, auxiliares);
router.get("/nuevo", hasPermitions, nuevo);
router.get('/editar/:id', hasPermitions, editar);
router.post('/guardar', guardar);
router.post('/actualizar', actualizar);

export default router;
