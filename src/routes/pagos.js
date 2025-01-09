import { Router } from "express";
import {listar, nuevo,pagar,acreditar} from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, listar);
router.get('/nuevo', hasPermitions, nuevo);
// router.get('/detalle/:id', hasPermitions, pagos.detalle); // TODO: HACER
router.get('/pagar/:id', hasPermitions, pagar);
router.post('/acreditar', acreditar);
// router.post('/guardar', pagos.crearPago); // TODO: HACER
// router.post('/actualizar', pagos.actualizarPago); // TODO: HACER

export default router;
