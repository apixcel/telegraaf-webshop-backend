import { Router } from "express";
import pdfController from "../controller/pdf.controller";
import authMiddleware from "../middlewares/authValidation";
const router = Router();
router.use(authMiddleware.isAuthenticatedUser());
router.post("/fill-form", pdfController.fillPdf);
router.get("/my-pdfs", pdfController.getMyPdfs);
router.get("/stream/:id", pdfController.getPdfStreamByPdfId);
router.get("/statistics", pdfController.pdfStatistics);

const pdfRoute = router;
export default pdfRoute;
