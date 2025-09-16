import { Router } from "express";
import orderController from "../controller/order.controller";
import authMiddleware from "../middlewares/authValidation";
import { upload } from "../middlewares/multer";
const router = Router();

router.use(authMiddleware.isAuthenticatedUser());
// @ts-expect-error: Unreachable code error
router.post("/create-order", upload.single("file"), orderController.createOrder);
router.get("/get-orders", orderController.getOrders);

const orderRoute = router;
export default orderRoute;
