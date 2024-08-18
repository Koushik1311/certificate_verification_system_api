import { asyncHandler } from "../utils/asyncHandler.js";
import { File } from "../models/file.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import axios from "axios";
import * as XLSX from "xlsx";
import { Certificate } from "../models/certificate.model.js";

function excelDateToJsDate(serial) {
  const epoch = new Date(1900, 0, 1);
  const date = new Date(epoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000);
  const correctedDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  return correctedDate;
}

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

  return res
    .status(200)
    .json(
      new ApiResponse(200, savedCertificates, "Certificates saved successfully")
    );
});

export { saveCertificate };
