import express from "express";
import { register,getAuthenticatedUser, logout, login } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/me", authenticate, getAuthenticatedUser);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
