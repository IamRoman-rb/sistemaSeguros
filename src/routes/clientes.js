import { Router } from "express";
import clientes from "../controllers/clientesController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/clientes", clientes.index);
router.get("/clientes/nuevo", clientes.nuevo);

export default router;
