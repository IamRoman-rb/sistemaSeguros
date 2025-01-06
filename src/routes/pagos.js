import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'


const router = Router();

router.get("/",  pagos.index);
router.get('/nuevo',  pagos.nuevo);
router.get('/pagarPoliza/:id',  pagos.pagarPoliza);
router.post('/pagarPoliza',  pagos.realizarPago);

export default router;
