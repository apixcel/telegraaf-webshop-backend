import mongoose from "mongoose";

const PdfFormSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    helpers: {
      type: [String],
      required: false,
    },
    birthYear: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PdfForm = mongoose.model("PdfForm", PdfFormSchema);

export default PdfForm;
