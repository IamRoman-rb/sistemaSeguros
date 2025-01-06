import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/", isAuthenticated, pagos.index);
router.get('/nuevo', isAuthenticated, pagos.nuevo);
router.get('/pagarPoliza/:id', isAuthenticated, pagos.pagarPoliza);
router.post('/pagarPoliza', isAuthenticated, pagos.realizarPago);

export default router;
