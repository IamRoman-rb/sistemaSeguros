import { Router } from "express";
import caja from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/caja", caja.index);
router.get("/caja/ingreso", caja.ingreso);
router.get("/caja/resumen", caja.resumen);

export default router;
