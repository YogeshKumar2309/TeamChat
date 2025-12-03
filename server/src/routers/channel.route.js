import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { createChannel, listChannels } from "../controllers/channel.controller.js";



const router = express.Router();

router.post("/create",authenticate, createChannel);
router.get("/list", authenticate, listChannels);



export default router;
