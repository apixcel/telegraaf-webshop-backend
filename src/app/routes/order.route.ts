import { Router } from "express";
import orderController from "../controller/order.controller";
import { upload } from "../middlewares/multer";
const router = Router();
// @ts-expect-error: Unreachable code error
router.post("/create-order", upload.single("file"), orderController.createOrder);

const orderRoute = router;
export default orderRoute;
