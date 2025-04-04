import { Router } from "express";
import { actividades, datos } from "../controllers/actividadesController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, actividades);
router.get("/datos", hasPermitions, datos);

export default router;