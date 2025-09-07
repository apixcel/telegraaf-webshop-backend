import fs from "fs";
import csv from "csv-parser";
import AppError from "../errors/AppError";
import Order from "../models/order.model";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";
import axios from "axios";

// -------- helpers --------

// তারিখ -> "YYYY-MM-DD HH:mm:ss"
const formatDateTime = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// DD/MM/YYYY -> YYYY-MM-DD
const formatExpectedDate = (dmy?: string) => {
  if (!dmy) return undefined;
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

// অ্যাড্রেস join
const joinAddressLine1 = (street?: string, num?: string, add?: string) =>
  [street, num, add].filter(Boolean).map(s => s!.trim()).join(" ").trim();

// -------- transformer --------
const transformRow = (row: Record<string, string>) => {
  const first = row.customerFirstname?.trim() ?? "";
  const last = row.customerLastname?.trim() ?? "";
  const full = `${first} ${last}`.trim();

  return {
    ordered_at: formatDateTime(row.orderDate),
    expected_shipping_date: formatExpectedDate(row.expectedShippingDate),
    shipping_address: {
      full_name: full,
      address_line_1: joinAddressLine1(
        row.shippingAddressStreet,
        row.shippingAddressNumber,
        row.shippingAddressNumberAddition
      ),
      postal_code: row.shippingAddressPostcode ?? "",
      city: row.shippingAddressCity ?? "",
      country: row.shippingAddressCountry?.toUpperCase() ?? "",
    },
    billing_address: {
      full_name: full,
      address_line_1: joinAddressLine1(
        row.shippingAddressStreet,
        row.shippingAddressNumber,
        row.shippingAddressNumberAddition
      ),
      postal_code: row.shippingAddressPostcode ?? "",
      city: row.shippingAddressCity ?? "",
      country: row.shippingAddressCountry?.toUpperCase() ?? "",
    },
    customer: {
      first_name: first,
      last_name: last,
      email: row.customerEmail ?? "",
      telephone: row.telephone ?? "",
    },
    products: [
      {
        sku: row.sku ?? "",
        sku_type: "sku",
        ean: row.EAN ?? "",
        name: row.name ?? "",
        pivot: {
          amount: Number(row.quantity ?? 0),
          cost_price: Number(row.costPrice ?? 0),
        },
      },
    ],
  };
};

// -------- controller --------
const createOrder = catchAsyncError(async (req, res) => {
  const { file } = req;
  if (!file) throw new AppError(400, "No CSV file uploaded");

  const rows: any[] = [];

  fs.createReadStream(file.path)
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      const payload = rows.map(transformRow);
console.log(payload[0]);
      // ======== external API call ========
      // const response = await axios.post(
      //   `${process.env.LYRA_API_URL}/order` as string,
      //   { data: payload[0] }, // body
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
      //     },
      //   }
      // );

      // চাইলে DB তেও ইনসার্ট করতে পারেন
      // await Order.insertMany(payload);

      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: payload[0], // external API response ফেরত দিবে
        message: "CSV parsed & pushed successfully",
      });
    });
});

const orderController = { createOrder };
export default orderController;
