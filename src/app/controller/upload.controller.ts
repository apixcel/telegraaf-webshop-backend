import { uploadToCloudinary } from "../config/cloud";
import AppError from "../errors/AppError";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";

const uploadSingle = catchAsyncError(async (req, res) => {
  const { file } = req;
  if (!file) {
    throw new AppError(400, "No file uploaded");
  }
  const imageUrl = await uploadToCloudinary(file.path);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: imageUrl,
    message: "file uploaded successfully",
  });
});
const uploadMultiple = catchAsyncError(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any[];
  if (!files || files.length === 0) {
    throw new AppError(400, "No files uploaded");
  }
  const urls = [];
  for (const file of files) {
    const imageUrl = await uploadToCloudinary(file.path);
    urls.push(imageUrl);
  }
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: urls,
    message: "Images uploaded successfully",
  });
});

const uploadController = {
  uploadSingle,
  uploadMultiple,
};

export default uploadController;
