import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteCertificate,
  downloadCertificate,
  getAllCertificates,
  getCertificateByCertificateId,
  saveCertificate,
  updateCertificate,
} from "../controllers/certificate.controller.js";

const router = Router();

router.route("/").get(getAllCertificates);
router.route("/:certificateId").get(getCertificateByCertificateId);
router.get("/download/:certificateId", downloadCertificate);

// secured routes
router.route("/save").post(verifyJWT, saveCertificate);
router.route("/:id").delete(verifyJWT, deleteCertificate);
router.route("/:id").patch(verifyJWT, updateCertificate);

export default router;
