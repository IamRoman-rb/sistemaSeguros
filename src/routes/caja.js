import { Router } from "express";
import caja from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, caja.index);
router.get("/ingreso", hasPermitions, caja.ingreso);
router.get("/resumen", hasPermitions, caja.resumen);

export default router;
