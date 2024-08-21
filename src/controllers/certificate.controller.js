import { asyncHandler } from "../utils/asyncHandler.js";
import { File } from "../models/file.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import axios from "axios";
import * as XLSX from "xlsx";
import { Certificate } from "../models/certificate.model.js";
import PDFDocument from "pdfkit";

function excelDateToJsDate(serial) {
  const epoch = new Date(1900, 0, 1);
  const date = new Date(epoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000);
  const correctedDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  return correctedDate;
}

const getAllCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find();

  return res
    .status(200)
    .json(
      new ApiResponse(200, certificates, "Certificate retrieved successfully")
    );
});

const getCertificateByCertificateId = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findOne({
    certificateId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, certificate, "Certificate found"));
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  const certificate = await Certificate.findOne({ certificateId });

  if (!certificate) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Certificate not found"));
  }

  const doc = new PDFDocument();

  res.setHeader(
    "Content-disposition",
    `attachment; filename=${certificateId}.pdf`
  );
  res.setHeader("Content-type", "application/pdf");

  doc.pipe(res);

  doc.fontSize(16).text("Certificate of Achievement", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Student Name: ${certificate.studentName}`);
  doc.text(`Internship Domain: ${certificate.internshipDomain}`);
  doc.text(`Starting Date: ${certificate.startingDate}`);
  doc.text(`Ending Date: ${certificate.endingDate}`);
  doc.text(`Certificate ID: ${certificate.certificateId}`);

  doc.end();
});

const saveCertificate = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "id field is required");
  }

  const file = await File.findById(id);

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  const response = await axios.get(file.fileUrl, {
    responseType: "arraybuffer",
  });
  const data = response.data;

  const workbook = XLSX.read(data, { type: "buffer" });
  const sheetNames = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  const savePromises = jsonData.map(async (entry) => {
    if (entry["Starting Date"] && typeof entry["Starting Date"] === "number") {
      entry["Starting Date"] = excelDateToJsDate(
        entry["Starting Date"]
      ).toISOString();
    }
    if (entry["Ending Date"] && typeof entry["Ending Date"] === "number") {
      entry["Ending Date"] = excelDateToJsDate(
        entry["Ending Date"]
      ).toISOString();
    }

    const certificate = new Certificate({
      certificateId: entry["Certificate ID"],
      studentName: entry["Student Name"],
      internshipDomain: entry["Internship Domain"],
      startingDate: entry["Starting Date"],
      endingDate: entry["Ending Date"],
    });

    return certificate.save();
  });

  const savedCertificates = await Promise.all(savePromises);
  await File.updateOne({ _id: id }, { $set: { isExtracted: true } });

  return res
    .status(200)
    .json(
      new ApiResponse(200, savedCertificates, "Certificates saved successfully")
    );
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Certificate.deleteOne({
    _id: id,
  });

  if (result.deletedCount === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Certificate not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate deleted successfully"));
});

const updateCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentName, internshipDomain, startingDate, endingDate } = req.body;

  const updateData = {};
  if (studentName) updateData.studentName = studentName;
  if (internshipDomain) updateData.internshipDomain = internshipDomain;
  if (startingDate) updateData.startingDate = startingDate;
  if (endingDate) updateData.endingDate = endingDate;

  const updatedCertificate = await Certificate.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedCertificate) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Certificate not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate updated successfully"));
});

export {
  getAllCertificates,
  getCertificateByCertificateId,
  saveCertificate,
  downloadCertificate,
  deleteCertificate,
  updateCertificate,
};
