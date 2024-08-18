import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
  {
    fileUrl: {
      type: String,
      required: true,
    },
    isExtracted: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export const File = mongoose.model("File", fileSchema);
