import csv from "csv-parser";
import fs from "fs";
import AppError from "../errors/AppError";
// import Order from "../models/order.model";
import axios from "axios";
import { CsvOrderRow } from "../interface/order.interface";
import catchAsyncError from "../utils/catchAsync";
import orderUtils from "../utils/order.utils";
import { generateQueryParams } from "../utils/queryParams";
import sendResponse from "../utils/send.response";

const createOrder = catchAsyncError(async (req, res) => {
  const { file } = req;
  if (!file) {
    throw new AppError(400, "No CSV file uploaded");
  }

  const rows: CsvOrderRow[] = [];

  fs.createReadStream(file.path)
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      const payload = rows.map(orderUtils.transformOrderCsvRow);

      const responses = [];
      for (const order of payload) {
        const resp = await axios.post(`${process.env.LYRA_API_URL}/order`, order, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
          },
        });
        responses.push(resp.data);
      }

      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: responses,
        message: "CSV parsed & pushed successfully",
      });
    });
});

const getOrders = catchAsyncError(async (req, res) => {
  const query = req.query || {};
  const queryString = generateQueryParams(query);
  const response = await axios.get(`${process.env.LYRA_API_URL}/orders?${queryString}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
    },
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: response.data,
    message: "CSV parsed & pushed successfully",
  });
});

const orderController = { createOrder, getOrders };

export default orderController;
