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

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader(
    "Content-disposition",
    `attachment; filename=${certificateId}.pdf`
  );
  res.setHeader("Content-type", "application/pdf");

  doc.pipe(res);

  // Colors and fonts
  const primary = "#0D3B66";
  const accent = "#F4D35E";
  const dark = "#222222";

  // Page dims
  const { width, height } = doc.page;

  // Border
  doc
    .lineWidth(3)
    .strokeColor(primary)
    .rect(20, 20, width - 40, height - 40)
    .stroke();

  // Inner border
  doc
    .lineWidth(1)
    .strokeColor(accent)
    .rect(30, 30, width - 60, height - 60)
    .stroke();

  // Title
  doc
    .fillColor(primary)
    .font("Times-Bold")
    .fontSize(28)
    .text("CERTIFICATE OF ACHIEVEMENT", 0, 90, { align: "center" });

  // Subtitle
  doc
    .moveDown(0.5)
    .font("Times-Roman")
    .fontSize(14)
    .fillColor(dark)
    .text("This is to certify that", { align: "center" });

  // Recipient
  doc
    .moveDown(0.5)
    .font("Times-Bold")
    .fontSize(24)
    .fillColor(dark)
    .text(certificate.studentName, { align: "center" });

  // Body
  const startDate = new Date(certificate.startingDate).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const endDate = new Date(certificate.endingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc
    .moveDown(1)
    .font("Times-Roman")
    .fontSize(14)
    .fillColor(dark)
    .text(
      `has successfully completed an internship in ${certificate.internshipDomain}.`,
      { align: "center" }
    )
    .moveDown(0.5)
    .text(`Internship Period: ${startDate} — ${endDate}`, { align: "center" });

  // Decorative rule
  doc
    .moveDown(1.2)
    .strokeColor(primary)
    .lineWidth(1)
    .moveTo(100, doc.y)
    .lineTo(width - 100, doc.y)
    .stroke();

  // Footer details
  const footerY = height - 160;

  // Signature images (exact file paths from public/image)
  const path = (await import("path")).default;
  const authorizedSigPath = path.join(
    process.cwd(),
    "public",
    "image",
    "Anika Sharma.png"
  );
  const directorSigPath = path.join(
    process.cwd(),
    "public",
    "image",
    "Raj Mehta.png"
  );

  // Signature images (placed a bit lower and larger)
  const sigY = footerY - 40; // was -55
  const sigWidth = 180; // a bit wider

  doc.image(authorizedSigPath, 85, sigY, { width: sigWidth });
  doc.image(directorSigPath, width - 265, sigY, { width: sigWidth });

  // Signature lines
  doc
    .strokeColor(dark)
    .lineWidth(1)
    .moveTo(80, footerY)
    .lineTo(260, footerY)
    .stroke()
    .moveTo(width - 260, footerY)
    .lineTo(width - 80, footerY)
    .stroke();

  // Labels
  doc
    .font("Times-Roman")
    .fontSize(12)
    .fillColor(dark)
    .text("Authorized Signature", 80, footerY + 6, {
      width: 180,
      align: "center",
    })
    .text("Program Director", width - 260, footerY + 6, {
      width: 180,
      align: "center",
    });

  // Metadata row
  const issuedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc
    .fontSize(10)
    .fillColor("#555555")
    .text(`Certificate ID: ${certificate.certificateId}`, 80, height - 80)
    .text(`Issued on: ${issuedOn}`, width - 260, height - 80, {
      width: 180,
      align: "right",
    });

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
