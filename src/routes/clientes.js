import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/clientes", clientes.index);
router.get("/clientes/nuevo", clientes.nuevo);
router.post('/clientes/nuevo', clientes.crearCliente);
router.get('/clientes/detalle/:id', clientes.detalle);
router.get('/clientes/confirmar/:id', clientes.confirmar);
router.get('/clientes/eliminar/:id', clientes.eliminar);
router.get('/clientes/editar/:id', clientes.editar);
router.post('/clientes/editar/:id', clientes.actualizarCliente);

export default router;
