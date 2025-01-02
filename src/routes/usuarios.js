import { Router } from "express";
import usuarios from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/usuarios", usuarios.index);
router.get("/usuarios/nuevo", usuarios.nuevo);
router.get("/usuarios/perfil", usuarios.perfil);

export default router;
