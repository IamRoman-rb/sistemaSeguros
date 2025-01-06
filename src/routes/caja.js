import { Router } from "express";
import caja from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/", caja.index);
router.get("/ingreso", caja.ingreso);
router.get("/resumen", caja.resumen);

export default router;
