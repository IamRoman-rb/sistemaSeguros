import { Router } from "express";
import usuarios from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, usuarios.index);
router.get("/nuevo", hasPermitions, usuarios.nuevo);
router.get("/perfil", hasPermitions, usuarios.perfil);
router.get('/detalle/:id', hasPermitions, usuarios.detalleUsuario);
router.get('/editar/:id', hasPermitions, usuarios.editar);
router.post('/guardar', usuarios.crearUsuario);
router.post('/actualizar', usuarios.actualizar);
router.post('/eliminar', usuarios.eliminar);

export default router;
