import { Router } from "express";
import usuarios from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/usuarios", isAuthenticated, usuarios.index);
router.get("/usuarios/nuevo", isAuthenticated, usuarios.nuevo);
router.post('/usuarios/nuevo', isAuthenticated, usuarios.crearUsuario);
router.get("/usuarios/perfil", isAuthenticated ,usuarios.perfil);
router.get('/usuarios/detalle/:id', isAuthenticated, usuarios.detalleUsuario);
router.get('/usuarios/editar/:id', isAuthenticated, usuarios.editar);
router.post('/usuarios/editar/:id', isAuthenticated, usuarios.actualizar);

export default router;
