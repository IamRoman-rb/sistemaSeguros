import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/", isAuthenticated, clientes.index);
router.get("/nuevo", isAuthenticated, clientes.nuevo);
router.post('/guardar', isAuthenticated, clientes.crearCliente);
router.get('/detalle/:id', isAuthenticated, clientes.detalle);
router.get('/confirmar/:id', isAuthenticated, clientes.confirmar);
router.get('/eliminar/:id', isAuthenticated, clientes.eliminar);
router.get('/editar/:id', isAuthenticated, clientes.editar);
router.post('/actualizar/:id', isAuthenticated, clientes.actualizarCliente);

export default router;
