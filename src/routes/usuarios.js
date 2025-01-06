import { Router } from "express";
import usuarios from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'


const router = Router();

router.get("/", usuarios.index);
router.get("/nuevo", usuarios.nuevo);
router.post('/guardar', usuarios.crearUsuario);
router.get("/perfil", usuarios.perfil);
router.get('/detalle/:id', usuarios.detalleUsuario);
router.get('/editar/:id', usuarios.editar);
router.post('/actualizar/:id', usuarios.actualizar);

export default router;
