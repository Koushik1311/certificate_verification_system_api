import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteFile,
  getAllFiles,
  uploadFile,
} from "../controllers/file.controller.js";

const router = Router();

// secured routes
router.route("/").get(verifyJWT, getAllFiles);

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

router.route("/:id").delete(verifyJWT, deleteFile);

export default router;
