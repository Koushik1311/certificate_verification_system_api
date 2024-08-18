import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../controllers/file.controller.js";

const router = Router();

// secured routes
router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "uploadFile",
      maxCount: 1,
    },
  ]),
  uploadFile
);

export default router;
