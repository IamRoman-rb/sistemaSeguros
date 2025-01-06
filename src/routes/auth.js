import { Router } from "express";
import {login,access,logout} from "../controllers/loginController.js"; // Usamos 'import' en lugar de 'require'

const router = Router();

router.get("/login", login);
router.post("/access", access);
router.get("/logout", logout);


export default router;
