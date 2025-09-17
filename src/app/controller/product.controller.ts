import axios from "axios";
import catchAsyncError from "../utils/catchAsync";
import { generateQueryParams } from "../utils/queryParams";
import sendResponse from "../utils/send.response";

const getProducts = catchAsyncError(async (req, res) => {
  const query = req.query || {};
  const queryString = generateQueryParams(query);
  const response = await axios.get(`${process.env.LYRA_API_URL}/products?${queryString}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LYRA_API_TOKEN}`,
    },
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: response.data,
    message: "Products fetched successfully",
  });
});

const productController = { getProducts };

export default productController;
