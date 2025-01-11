import { Router } from "express";
import {detalle,recibo,pagar,acreditar} from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get('/detalle/:id', hasPermitions, detalle); 
router.get('/recibo/:id', hasPermitions, recibo);
router.get('/pagar/:id', hasPermitions, pagar);
router.post('/acreditar', acreditar);

export default router;
