import { Router } from "express";
import authenticate from "../middleware/authenticate.middleware";
import { getUserChats } from "../controller/chat.controller";

const router = Router();

//get the list of rooms and inboxes
router.get("/lists", authenticate, getUserChats);


export default router;
