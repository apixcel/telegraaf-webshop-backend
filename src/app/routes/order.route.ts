import { Router } from "express";
import authMiddleware from "../middlewares/authValidation";
import orderController from "../controller/order.controller";
import { upload } from "../middlewares/multer";
const router = Router();
router.use(authMiddleware.isAuthenticatedUser());
router.post("/create-order", upload.single("file"), orderController.createOrder);
router.get("/get-orders", orderController.getOrders);

const orderRoute = router;
export default orderRoute;
