import { Router } from "express";
import login from "../controllers/loginController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/login", login.index);
router.post("/login", login.post);


export default router;
