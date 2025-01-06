import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, pagos.index);
router.get('/nuevo', hasPermitions, pagos.nuevo);
router.get('/pagarPoliza/:id', hasPermitions, pagos.pagarPoliza);
router.post('/pagarPoliza', pagos.realizarPago);

export default router;
