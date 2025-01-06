import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/pagos", isAuthenticated, pagos.index);
router.get('/pagos/nuevo', isAuthenticated, pagos.nuevo);
router.get('/pagos/pagarPoliza/:id', isAuthenticated, pagos.pagarPoliza);
router.post('/pagos/pagarPoliza', isAuthenticated, pagos.realizarPago);

export default router;
