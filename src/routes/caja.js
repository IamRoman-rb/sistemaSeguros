import { Router } from "express";
import caja from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/caja", isAuthenticated, caja.index);
router.get("/caja/ingreso", isAuthenticated, caja.ingreso);
router.get("/caja/resumen", isAuthenticated, caja.resumen);

export default router;
