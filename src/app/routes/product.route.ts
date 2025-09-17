import { Router } from "express";
import authMiddleware from "../middlewares/authValidation";
import productController from "../controller/product.controller";
const router = Router();

router.use(authMiddleware.isAuthenticatedUser());
router.get("/get-products", productController.getProducts);

const productRoute = router;
export default productRoute;
