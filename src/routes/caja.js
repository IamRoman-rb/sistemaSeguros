import { Router } from "express";
import { caja, resumen, ingreso, egreso, guardar, detalle, confirmar, eliminarIngresoEgreso, cajaPorDia } from "../controllers/cajaController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, caja);
router.get("/ingresos", hasPermitions, ingreso);
router.get("/egresos", hasPermitions, egreso);
router.get("/resumen", hasPermitions, resumen);
router.post("/guardar", hasPermitions, guardar);
router.get("/resumen/detalle/:id", hasPermitions, detalle);
router.get("/confirmar/:id", hasPermitions, confirmar);
router.post("/eliminar", hasPermitions, eliminarIngresoEgreso);
router.get("/cajaPorDia", hasPermitions, cajaPorDia);

export default router;
