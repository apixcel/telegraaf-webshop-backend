import express from "express";
import orderRoute from "./order.route";
import productRoute from "./product.route";
import uploadRoute from "./upload.route";
import userRoute from "./user.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/order",
    route: orderRoute,
  },
  {
    path: "/product",
    route: productRoute,
  },
  {
    path: "/upload",
    route: uploadRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
