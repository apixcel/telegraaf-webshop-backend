import csv from "csv-parser";
import fs from "fs";
import AppError from "../errors/AppError";
// import Order from "../models/order.model";
import axios from "axios";
import { CsvOrderRow } from "../interface/order.interface";
import catchAsyncError from "../utils/catchAsync";
import orderUtils from "../utils/order.utils";
import { getProductSkuIdMap } from "../utils/product.utils";
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
      const data = await getProductSkuIdMap({ freshData: true });

      const payload = await Promise.all(
        rows.map((row) => orderUtils.transformOrderCsvRow(row, data))
      );

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

      fs.unlinkSync(file.path);

      sendResponse(res, {
        success: true,
        statusCode: 200,
        data: responses,
        message: "CSV parsed & pushed successfully",
      });
    });
});

// If you already have catchAsyncError, keep using it; otherwise wrap with try/catch.
const OrderCsvByOrderUuid = catchAsyncError(async (req, res) => {
  const { orderUuid } = req.params;

  // 1) Fetch order
  const { data } = await axios.get(`${process.env.LYRA_API_URL}/order/${orderUuid}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
    },
  });

  const order = data?.order;
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // 2) Prepare CSV rows (one row per line item)
  const header = [
    "order_uuid",
    "order_reference",
    "status",
    "ordered_at",
    "paid_at",
    "payment_method",
    "customer_name",
    "ship_fullname",
    "ship_address_line_1",
    "ship_postal_code",
    "ship_city",
    "ship_state",
    "ship_country",
    "shipment_barcode",
    "shipment_tracking_url",
    "shipped_at",
    "line_item_uuid",
    "line_item_title",
    "line_item_foreign_id",
    "amount",
    "unit_price",
    "paid_total",
    "paid_tax",
  ];

  const escapeCSV = (v: unknown) => {
    if (v === null || v === undefined) {
      return "";
    }
    const s = String(v);
    // quote if contains comma, quote, or newline
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const shipping = order.shipping_address || {};
  const shipment =
    Array.isArray(order.shipments) && order.shipments.length ? order.shipments[0] : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (order.line_items || []).map((li: Record<string, any>) => [
    order.uuid,
    order.reference,
    order.status,
    order.ordered_at,
    order.paid_at,
    order.payment_method,
    order.customer?.name || "",
    shipping.fullname || "",
    shipping.address_line_1 || "",
    shipping.postal_code || "",
    shipping.city || "",
    shipping.state || "",
    shipping.country || "",
    shipment.barcode || "",
    // prefer top-level "tracking_url" if present, else additional_data.tracking_url
    shipment.tracking_url || shipment.additional_data?.tracking_url || "",
    shipment.shipped_at || order.shipped_at || "",
    li.uuid,
    li.additional_information?.title || "",
    li.sales_channel_foreign_id || "",
    li.amount,
    li.unit_price,
    li.paid_total,
    li.paid_tax,
  ]);

  // If no line items, still produce a single row with order-level data
  if (rows.length === 0) {
    rows.push([
      order.uuid,
      order.reference,
      order.status,
      order.ordered_at,
      order.paid_at,
      order.payment_method,
      order.customer?.name || "",
      shipping.fullname || "",
      shipping.address_line_1 || "",
      shipping.postal_code || "",
      shipping.city || "",
      shipping.state || "",
      shipping.country || "",
      shipment.barcode || "",
      shipment.tracking_url || shipment.additional_data?.tracking_url || "",
      shipment.shipped_at || order.shipped_at || "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  const csv =
    header.map(escapeCSV).join(",") +
    "\n" +
    rows.map((r: string[]) => r.map(escapeCSV).join(",")).join("\n");

  // 3) Send as file
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="order-${order.uuid}.csv"`);
  res.status(200).send(csv);
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
    message: "Orders fetched successfully",
  });
});

const orderController = { createOrder, getOrders, OrderCsvByOrderUuid };

export default orderController;
