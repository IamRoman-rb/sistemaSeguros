import { Router } from "express";
import { listado, nueva, guardar, detalle, confirmar, eliminar, editar, actualizar, renovar} from "../controllers/otrosRiesgosController.js";
import hasPermitions from "../middlewares/hasPermitions.js";

const router = Router();

router.get("/", hasPermitions, listado);
router.get("/nuevo/:id", hasPermitions, nueva);
router.post("/guardar", guardar);
router.get("/detalle/:id", detalle);
router.get("/confirmar/:id", hasPermitions, confirmar);
router.post("/eliminar", eliminar);
router.get("/editar/:id", hasPermitions, editar);
router.post("/actualizar", actualizar);
router.get("/renovar/:id", hasPermitions, renovar);

export default router;
