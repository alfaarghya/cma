import express from "express";
import authenticate from "../middleware/authenticate.middleware";
import { searchUser } from "../controller/search.controller";

const router = express.Router();

//search for the user
router.get("/user", authenticate, searchUser);

export default router;
