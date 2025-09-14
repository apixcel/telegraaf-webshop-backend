import fs from "fs";
import csv from "csv-parser";
import AppError from "../errors/AppError";
// import Order from "../models/order.model";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";
import axios from "axios";

// -------- types --------
interface CsvOrderRow {
  orderId: string;
  orderDate: string;
  shippingDate: string;
  qtyShipped: string;
  shipper: string;
  trackAndTraceCode: string;
  trackAndTraceUrl: string;
  customerFirstname: string;
  customerLastname: string;
  shippingAddressStreet: string;
  shippingAddressNumber: string;
  shippingAddressNumberAddition: string;
  shippingAddressPostcode: string;
  shippingAddressCity: string;
  shippingAddressCountry: string;
  customerEmail: string;
  telephone: string;
  sku: string;
  quantity: string;
  EAN: string;
  costPrice: string;
  name: string;
  expectedShippingDate: string;
}

// -------- helpers --------

// address join
const joinAddressLine1 = (street?: string, num?: string, add?: string) =>
  [street, num, add]
    .filter(Boolean)
    .map((s) => s!.trim())
    .join(" ")
    .trim();

// -------- transformer --------
const transformRow = (row: CsvOrderRow) => {
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
            shipped_at: row.shippingDate, // additional but also bad
          },
          amount: Number(row.quantity ?? 0),
          additional_information: [
            `Qty Shipped: ${row.qtyShipped}`,
            `Shipper: ${row.shipper}`,
            `Track And Trace Code: ${row.trackAndTraceCode}`,
            `Track And Trace Url: ${row.trackAndTraceUrl}`,
            `EAN: ${row.EAN}`,
          ],
          unit_price: Number(row.costPrice ?? 0),
          paid_total: Number(row.costPrice ?? 0) * Number(row.quantity ?? 0),
          // paid_tax: 0,
          product_id: 1551, // product id is required
        },
      ],
      ordered_at: row.orderDate, // additional but also bad
    },
  };
};

// -------- controller --------
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
      const payload = rows.map(transformRow);

      // ======== external API call for the single order ========
      // const response = await axios.post(`${process.env.LYRA_API_URL}/order`,
      //   payload[0],
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
      //     },
      //   }
      // );

      // ======== external API call for the multiple order ========
      /* const responses = [];
      for (const order of payload.slice(0, 10)) {
        const resp = await axios.post(`${process.env.LYRA_API_URL}/order`,
          order,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
            },
          }
        );
        responses.push(resp.data);
      } */

      // insert into db
      // await Order.insertMany(payload);

      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: payload, // external API response for single response.data
        message: "CSV parsed & pushed successfully",
      });
    });
});

const getOrders = catchAsyncError(async (req, res) => {
  // ======== external API call for the single order ========
  const response = await axios.get(`${process.env.LYRA_API_URL}/orders`, {
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
