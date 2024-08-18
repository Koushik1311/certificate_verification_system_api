import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { saveCertificate } from "../controllers/certificate.controller.js";

const router = Router();

// secured routes
router.route("/save").post(verifyJWT, saveCertificate);

export default router;
