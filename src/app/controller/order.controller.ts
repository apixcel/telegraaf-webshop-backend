import fs from "fs";
import csv from "csv-parser";
import QueryBuilder from "../builder/QueryBuilder";
import AppError from "../errors/AppError";
import Order from "../models/order.model";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";

const createOrder = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const { file } = req;

  /* 
  1) amader j original csv file ase sei file ta read korbe then j value gulo ase oigulo capture korte hobe
  2) Lyra wms er j csv file ta ase eta field gulor name capture korte hobe
  3) ekhon json object ta hobe lyra wms er field er name diye value gulo hobe amader csv file theke
  4) 
   */

  if (!file) {
    throw new AppError(400, "No CSV file uploaded");
  }

  const results: any[] = [];

  // CSV parse করার জন্য stream
  fs.createReadStream(file.path)
    .pipe(csv({ separator: ",", quote: '"' }))
    .on("data", (data) => {
      results.push({ ...data });
    })
    .on("end", () => {
      console.log("CSV Parsed JSON:", results);

      // আপাতত শুধু JSON response
      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: results,
        message: "CSV parsed successfully",
      });

      // চাইলে পরে এখানে DB তে insert করতে পারবে:
      // await Order.insertMany(results);
    });
});

const orderController = {
  createOrder,
};

export default orderController;
