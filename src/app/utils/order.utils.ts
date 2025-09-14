import { CsvOrderRow } from "../interface/order.interface";
const joinAddressLine1 = (street?: string, num?: string, add?: string) =>
  [street, num, add]
    .filter(Boolean)
    .map((s) => s!.trim())
    .join(" ")
    .trim();
const transformOrderCsvRow = (row: CsvOrderRow) => {
  const first = row.customerFirstname?.trim() ?? "";
  const last = row.customerLastname?.trim() ?? "";
  const fullName = `${first} ${last}`.trim();

  return {
    order: {
      id: row.orderId, // additional but also bad
      shipping_address: {
        fullname: fullName,
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
const orderUtils = { transformOrderCsvRow };
export default orderUtils;
