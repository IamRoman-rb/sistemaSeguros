import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, pagos.index);
router.get('/nuevo', hasPermitions, pagos.nuevo);
// router.get('/detalle/:id', hasPermitions, pagos.detalle); // TODO: HACER
router.get('/pagar/:id', hasPermitions, pagos.pagarPoliza);
router.post('/acreditar', pagos.realizarPago);
// router.post('/guardar', pagos.crearPago); // TODO: HACER
// router.post('/actualizar', pagos.actualizarPago); // TODO: HACER

export default router;
