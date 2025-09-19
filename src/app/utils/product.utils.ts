import axios from "axios";

let productSkuIdMap: Record<string, number> | null = null;

export const getProductSkuIdMap = async ({ freshData = false }: { freshData?: boolean } = {}) => {
  if (productSkuIdMap && !freshData) {
    return productSkuIdMap;
  }

  const response = await axios.get(`${process.env.LYRA_API_URL}/products?per_page=${99999999}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
    },
  });

  const data: Record<string, number> = {};

  for (const product of response.data?.data || []) {
    data[product.sku] = product.id;
  }

  productSkuIdMap = data;

  return productSkuIdMap;
};

export const getProductIdBySKU = async (sku: string) => {
  let data = await getProductSkuIdMap();
  let productId = data[sku];

  if (!productId) {
    data = await getProductSkuIdMap({ freshData: true });
    productId = data[sku];
  }
  return productId || null;
};
