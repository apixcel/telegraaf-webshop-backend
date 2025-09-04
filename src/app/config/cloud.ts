import { v2 as cloudinary } from "cloudinary";
import config from "./";

import fs from "fs";

cloudinary.config({
  cloud_name: config.CD_CLOUD_NAME,
  api_key: config.CD_API_KEY,
  api_secret: config.CD_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string, folder?: string) => {
  const result = await cloudinary.uploader.upload(filePath, { folder, resource_type: "auto" });
  fs.unlinkSync(filePath);
  return result.secure_url;
};

export default cloudinary;
