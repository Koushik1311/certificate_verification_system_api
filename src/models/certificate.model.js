import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const certificateSchema = new Schema(
  {
    certificateId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    student: {
      type: String,
      required: true,
      trim: true,
    },
    internshipDomain: {
      type: String,
      required: true,
      trim: true,
    },
    startingDate: {
      type: String,
      required: true,
      index: true,
    },
    endingDate: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.plugin(mongooseAggregatePaginate);

export const Certificate = mongoose.model("Certificate", certificateSchema);
