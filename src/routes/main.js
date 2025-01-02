import { Router } from "express";
import main from "../controllers/main.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/", main.index);

export default router;
