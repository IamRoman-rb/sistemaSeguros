import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";
const router = Router();

router.get("/", hasPermitions, clientes.index);
router.get("/nuevo", hasPermitions, clientes.nuevo);
router.get('/detalle/:id', hasPermitions, clientes.detalle);
router.get('/confirmar/:id', hasPermitions, clientes.confirmar);
router.get('/eliminar/:id', hasPermitions, clientes.eliminar);
router.get('/editar/:id', hasPermitions, clientes.editar);
router.post('/guardar', clientes.crearCliente);
router.post('/actualizar/:id', clientes.actualizarCliente);

export default router;
