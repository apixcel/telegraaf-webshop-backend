import { Router } from "express";
import orderController from "../controller/order.controller";
import { upload } from "../middlewares/multer";
import authMiddleware from "../middlewares/authValidation";
const router = Router();

router.use(authMiddleware.isAuthenticatedUser());
// @ts-expect-error: Unreachable code error
router.post("/create-order", upload.single("file"), orderController.createOrder);
router.get("/get-orders", orderController.getOrders);

const orderRoute = router;
export default orderRoute;
