import { Router } from "express";
import {listar, nuevo, perfil, detalle, editar, guardar, actualizar, eliminar} from "../controllers/usuariosController.js"; // Usamos 'import' en lugar de 'require'
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, listar);
router.get("/nuevo", hasPermitions, nuevo);
router.get("/perfil", perfil);
router.get('/detalle/:id', hasPermitions, detalle);
router.get('/editar/:id', hasPermitions, editar);
router.post('/guardar', guardar);
router.post('/actualizar', actualizar);
router.post('/eliminar', eliminar);

export default router;
