import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/", clientes.index);
router.get("/nuevo", clientes.nuevo);
router.post('/guardar', clientes.crearCliente);
router.get('/detalle/:id', clientes.detalle);
router.get('/confirmar/:id', clientes.confirmar);
router.get('/eliminar/:id', clientes.eliminar);
router.get('/editar/:id', clientes.editar);
router.post('/actualizar/:id', clientes.actualizarCliente);

export default router;
