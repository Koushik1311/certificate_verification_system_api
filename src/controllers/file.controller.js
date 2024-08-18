import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { File } from "../models/file.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadFile = asyncHandler(async (req, res) => {
  const fileLocalPath = req.files.uploadFile[0]?.path;

  if (!fileLocalPath) {
    throw new ApiError(400, "File is required");
  }

  const response = await uploadOnCloudinary(fileLocalPath);

  if (!response) {
    throw new ApiError(400, "File is required");
  }

  const file = await File.create({
    fileUrl: response.url,
    isExtracted: false,
  });

  const uploadedFile = await File.findById(file._id);

  if (!uploadedFile) {
    throw new ApiError(500, "Something went wrong while uploading file");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, uploadFile, "File uploaded Successfully"));
});

export { uploadFile };
