import { Router } from "express";
import pagos from "../controllers/pagosController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/pagos", pagos.index);

export default router;
