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
  // first delimiter detect
  const fileContent = fs.readFileSync(file.path, "utf8");
  const delimiter = fileContent.includes(";") ? ";" : ",";

  fs.createReadStream(file.path)
    .pipe(csv({ separator: delimiter }))
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

const isString = (v: unknown): v is string => typeof v === "string";

function toDayStartUtc(d: string): string {
  const day = d.length === 10 ? `${d}T00:00:00.000Z` : d;
  const ms = Date.parse(day);
  if (Number.isNaN(ms)) {
    return d;
  }
  return new Date(ms).toISOString();
}

function toDayEndUtc(d: string): string {
  const day = d.length === 10 ? `${d}T23:59:59.999Z` : d;
  const ms = Date.parse(day);
  if (Number.isNaN(ms)) {
    return d;
  }
  return new Date(ms).toISOString();
}

function parseDateToMs(v: string | null): number | null {
  if (!v) {
    return null;
  }
  const ms = Date.parse(v.length === 10 ? `${v}T00:00:00.000Z` : v);
  return Number.isNaN(ms) ? null : ms;
}

const escapeCSV = (v: unknown) => {
  if (v === null || v === undefined) {
    return "";
  }
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rowToCsv = (row: unknown[]) => row.map(escapeCSV).join(",") + "\n";

export const exportCompletedOrdersCsv = catchAsyncError(async (req, res) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LYRA_API_TOKEN as string}`,
    };

    const q = req.query;

    const orderedAtFromRaw = isString(q.ordered_at_from) ? q.ordered_at_from : undefined;
    const orderedAtToRaw = isString(q.ordered_at_to) ? q.ordered_at_to : undefined;

    const ordered_at_from =
      orderedAtFromRaw && /^\d{4}-\d{2}-\d{2}$/.test(orderedAtFromRaw)
        ? toDayStartUtc(orderedAtFromRaw)
        : orderedAtFromRaw || undefined;

    const ordered_at_to =
      orderedAtToRaw && /^\d{4}-\d{2}-\d{2}$/.test(orderedAtToRaw)
        ? toDayEndUtc(orderedAtToRaw)
        : orderedAtToRaw || undefined;

    const PER_PAGE = Math.max(1, Math.min(Number(q.per_page) || 200, 1000));
    const HARD_MAX_REQUESTS = 2000;

    const lyraQuery: Record<string, unknown> = {
      ...q,
      status: "completed",
      ...(ordered_at_from ? { ordered_at_from } : {}),
      ...(ordered_at_to ? { ordered_at_to } : {}),
      per_page: PER_PAGE,
    };

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
      "track_and_trace_url",
      "shipped_at",
      "line_item_uuid",
      "line_item_title",
      "line_item_foreign_id",
      "amount",
      "unit_price",
      "paid_total",
      "paid_tax",
    ] as const;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderToRows = (order: any): unknown[][] => {
      const shipping = order?.shipping_address || {};
      const shipment =
        Array.isArray(order?.shipments) && order.shipments.length ? order.shipments[0] : {};
      const lineItems = Array.isArray(order?.line_items) ? order.line_items : [];

      if (lineItems.length === 0) {
        return [
          [
            order.uuid,
            order.reference,
            order.status,
            order.ordered_at,
            order.paid_at,
            order.payment_method,
            order.customer?.name ?? "",
            shipping.fullname ?? "",
            shipping.address_line_1 ?? "",
            shipping.postal_code ?? "",
            shipping.city ?? "",
            shipping.state ?? "",
            shipping.country ?? "",
            shipment.barcode ?? "",
            shipment.tracking_url ?? shipment.additional_data?.tracking_url ?? "",
            shipment.shipped_at ?? order.shipped_at ?? "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return lineItems.map((li: any) => [
        order.uuid,
        order.reference,
        order.status,
        order.ordered_at,
        order.paid_at,
        order.payment_method,
        order.customer?.name ?? "",
        shipping.fullname ?? "",
        shipping.address_line_1 ?? "",
        shipping.postal_code ?? "",
        shipping.city ?? "",
        shipping.state ?? "",
        shipping.country ?? "",
        shipment.barcode ?? "",
        shipment.tracking_url ?? shipment.additional_data?.tracking_url ?? "",
        shipment.shipped_at ?? order.shipped_at ?? "",
        li.uuid,
        li.additional_information?.title ?? "",
        li.sales_channel_foreign_id ?? "",
        li.amount ?? "",
        li.unit_price ?? "",
        li.paid_total ?? "",
        li.paid_tax ?? "",
      ]);
    };

    // Build querystring
    const qs = (obj: Record<string, unknown>) =>
      Object.entries(obj)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");

    // ---- async generator over all pages (supports cursor OR page/limit) ----
    async function* fetchOrdersPages() {
      let page = 1;
      let cursor: string | undefined;

      for (let i = 0; i < HARD_MAX_REQUESTS; i++) {
        const qObj = cursor
          ? { ...lyraQuery, cursor, limit: PER_PAGE }
          : { ...lyraQuery, page, per_page: PER_PAGE };

        const url = `${process.env.LYRA_API_URL as string}/orders?${qs(qObj)}`;
        const { data } = await axios.get(url, { headers });

        const chunk = data?.orders?.data ?? data?.orders ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yield { data: chunk as any[], raw: data };

        // Cursor style?
        const nextCursor =
          data?.orders?.meta?.next_cursor ??
          data?.meta?.next_cursor ??
          data?.orders?.links?.next_cursor;

        if (nextCursor) {
          cursor = nextCursor as string;
          continue;
        }

        // Link next?
        const hasNextLink = Boolean(data?.orders?.links?.next || data?.links?.next);
        if (hasNextLink) {
          page += 1;
          continue;
        }

        // Paged meta?
        const pageNum = (data?.orders?.meta?.page ?? data?.meta?.page ?? page) as number;
        const totalPages = (data?.orders?.meta?.total_pages ?? data?.meta?.total_pages) as
          | number
          | undefined;
        if (totalPages && pageNum < totalPages) {
          page = pageNum + 1;
          continue;
        }

        // Fallback: stop if fewer than requested
        if (Array.isArray(chunk) && chunk.length < PER_PAGE) {
          break;
        }

        page += 1;
      }
    }

    // ---- Server-side date filter (safety net) ----
    const fromMs = parseDateToMs(ordered_at_from ?? null);
    const toMs = parseDateToMs(ordered_at_to ?? null);

    const inRange = (orderedAtVal: unknown) => {
      if (!fromMs && !toMs) {
        return true;
      }
      if (!isString(orderedAtVal)) {
        return false;
      }
      const ms = parseDateToMs(orderedAtVal);
      if (ms === null) {
        return false;
      }
      if (fromMs && ms < fromMs) {
        return false;
      }
      if (toMs && ms > toMs) {
        return false;
      }
      return true;
    };

    // ---- stream response headers ----
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    {
      const yyyyMmDd = new Date().toISOString().split("T")[0];
      const fname = `orders-completed-${yyyyMmDd}.csv`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fname}"; filename*=UTF-8''${encodeURIComponent(fname)}`
      );
    }
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Optional (e.g., with Nginx) to stream progressively:
    // res.setHeader("X-Accel-Buffering", "no");

    // BOM so Excel opens UTF-8
    res.write("\uFEFF");
    // header row
    res.write(rowToCsv(header as unknown as string[]));

    // Stream each page out with server-side filtering
    for await (const page of fetchOrdersPages()) {
      const orders = page.data;
      if (!orders || orders.length === 0) {
        continue;
      }

      for (const order of orders) {
        if (!inRange(order?.ordered_at)) {
          continue;
        }

        const rows = orderToRows(order);
        for (const r of rows) {
          res.write(rowToCsv(r as string[]));
        }
      }
    }

    res.end();
  } catch {
    res.end();
  }
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

const orderController = { createOrder, getOrders, exportCompletedOrdersCsv };

export default orderController;
