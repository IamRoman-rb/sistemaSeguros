import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/clientes", isAuthenticated, clientes.index);
router.get("/clientes/nuevo", isAuthenticated, clientes.nuevo);
router.post('/clientes/nuevo', isAuthenticated, clientes.crearCliente);
router.get('/clientes/detalle/:id', isAuthenticated, clientes.detalle);
router.get('/clientes/confirmar/:id', isAuthenticated, clientes.confirmar);
router.get('/clientes/eliminar/:id', isAuthenticated, clientes.eliminar);
router.get('/clientes/editar/:id', isAuthenticated, clientes.editar);
router.post('/clientes/editar/:id', isAuthenticated, clientes.actualizarCliente);

export default router;
