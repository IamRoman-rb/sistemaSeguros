import { Router } from "express";
import polizas from "../controllers/polizasController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/polizas", polizas.index);
router.get('/polizas/nueva', polizas.nueva);

export default router;
