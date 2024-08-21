import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { File } from "../models/file.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllFiles = asyncHandler(async (req, res) => {
  const files = await File.find({
    owner: req.user._id,
  });

  if (!files) {
    throw new ApiError(404, "No files found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, files, "Files retrieved successfully"));
});

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
    owner: req.user._id,
  });

  const uploadedFile = await File.findById(file._id);

  if (!uploadedFile) {
    throw new ApiError(500, "Something went wrong while uploading file");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, uploadFile, "File uploaded Successfully"));
});

const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await File.deleteOne({
    _id: id,
  });

  if (result.deletedCount === 0) {
    return res.status(404).json(new ApiResponse(404, {}, "File not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "File deleted successfully"));
});

export { getAllFiles, uploadFile, deleteFile };
