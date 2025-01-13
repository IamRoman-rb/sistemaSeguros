import { Router } from "express";
import {caja,resumen,ingreso,egreso,guardar} from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, caja);
router.get("/ingresos", hasPermitions, ingreso);
router.get("/egresos", hasPermitions, egreso);
router.get("/resumen", hasPermitions, resumen);
router.post("/guardar", hasPermitions, guardar);

export default router;
