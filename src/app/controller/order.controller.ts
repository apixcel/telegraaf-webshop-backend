import fs from "fs";
import csv from "csv-parser";
import AppError from "../errors/AppError";
// import Order from "../models/order.model";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";
import axios from "axios";

// -------- helpers --------


// address join
const joinAddressLine1 = (street?: string, num?: string, add?: string) =>
  [street, num, add].filter(Boolean).map(s => s!.trim()).join(" ").trim();

// -------- transformer --------
const transformRow = (row: Record<string, string>) => {
  // const first = row.customerFirstname?.trim() ?? "";
  // const last = row.customerLastname?.trim() ?? "";
  // const full = `${first} ${last}`.trim();

  return {
    order: {
      id: row.orderId, // additional but also bad
      shipping_address: {
        // fullname: full,
        fullname: "apixcel for the test",
        address_line_1: joinAddressLine1(
          row.shippingAddressStreet,
          row.shippingAddressNumber,
          row.shippingAddressNumberAddition
        ),
        postal_code: row.shippingAddressPostcode ?? "",
        city: row.shippingAddressCity ?? "",
        country: row.shippingAddressCountry?.toUpperCase() ?? "",
      },
      email: row.customerEmail ?? "",
      billingAddress: null,
      products: [
        {
          product: {
            fulfilmentclient_id: 105,
            sku: row.sku,
            expected_shipping_date: row.expectedShippingDate,
            shipped_at: row.shippingDate // additional but also bad
          },
          amount: Number(row.quantity ?? 0),
          additional_information: [
            `Qty Shipped: ${row.qtyShipped}`,
            `Shipper: ${row.shipper}`,
            `Track And Trace Code: ${row.trackAndTraceCode}`,
            `Track And Trace Url: ${row.trackAndTraceUrl}`,
            `EAN: ${row.EAN}`
          ],
          unit_price: Number(row.costPrice ?? 0),
          paid_total: Number(row.costPrice ?? 0) * Number(row.quantity ?? 0),
          // paid_tax: 0,
          product_id: 1551 // product id is required
        },
      ],
      ordered_at: row.orderDate // additional but also bad
    },
  };

};

// -------- controller --------
const createOrder = catchAsyncError(async (req, res) => {
  const { file } = req;
  if (!file) {throw new AppError(400, "No CSV file uploaded");}

  const rows: unknown[] = [];

  fs.createReadStream(file.path)
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      const payload = rows.map(transformRow);
      // console.log(rows[0]);
      // ======== external API call ========
      const response = await axios.post(
        `${process.env.LYRA_API_URL}/order`,
        payload[0], // body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
          },
        }
      );

      // insert into db
      // await Order.insertMany(payload);

      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: response.data, // external API response 
        message: "CSV parsed & pushed successfully",
      });
    });
});

const orderController = { createOrder };
export default orderController;
