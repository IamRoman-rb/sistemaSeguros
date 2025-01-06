import { Router } from "express";
import usuarios from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'
import isAuthenticated from '../middlewares/usuarioAutenticado.js';

const router = Router();

router.get("/", isAuthenticated, usuarios.index);
router.get("/nuevo", isAuthenticated, usuarios.nuevo);
router.post('/guardar', isAuthenticated, usuarios.crearUsuario);
router.get("/perfil", isAuthenticated ,usuarios.perfil);
router.get('/detalle/:id', isAuthenticated, usuarios.detalleUsuario);
router.get('/editar/:id', isAuthenticated, usuarios.editar);
router.post('/actualizar/:id', isAuthenticated, usuarios.actualizar);

export default router;
