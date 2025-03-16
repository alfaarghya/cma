import { Router } from "express";
import { logout, signin, signup } from "../controller/authController";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);

export default router;
