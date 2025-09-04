import fs from "fs";
import path from "path";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QueryBuilder from "../builder/QueryBuilder";
import AppError from "../errors/AppError";
import PdfForm from "../models/pdf.model";
import catchAsyncError from "../utils/catchAsync";
import { generatePdfFileName, pdfPosition } from "../utils/pd.utils";
import sendResponse from "../utils/send.response";

const fillPdf = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const pdfPath = path.join(__dirname, "../templates/form.pdf");
  const { body } = req;

  const fileBuffer = fs.readFileSync(pdfPath);
  if (!fileBuffer) {
    throw new AppError(404, "Something went wrong. pdf file not found");
  }

  const pdfDoc = await PDFDocument.load(new Uint8Array(fileBuffer));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // Render loop
  for (const [field, positions] of Object.entries(pdfPosition)) {
    for (let i = 0; i < positions.length; i++) {
      const { page, x, y, type, width, height, rotate } = positions[i];

      // Guard pages array access
      if (!pages[page]) {
        continue;
      }

      const yPosition = pages[page].getHeight() - y;
      const value = body[field] ? String(body[field]) : "";

      if (type === "image") {
        if (!value || typeof value !== "string") {
          continue;
        }

        const lc = value.toLowerCase();
        const isPng = lc.includes(".png");
        const isJpg = lc.includes(".jpg") || lc.includes(".jpeg");

        if (!isPng && !isJpg) {
          throw new AppError(400, "Invalid image format only png and jpg are allowed");
        }

        const imageBytes = await fetch(value).then((r) => r.arrayBuffer());
        const image = await (isPng ? pdfDoc.embedPng(imageBytes) : pdfDoc.embedJpg(imageBytes));

        pages[page].drawImage(image, {
          x,
          y: yPosition,
          width: width || 100,
          height: height || 100,
          rotate: rotate ? degrees(rotate) : undefined,
        });
      } else {
        // text (default)
        if (value == null) {
          continue;
        }
        pages[page].drawText(String(value), {
          x,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
          rotate: rotate ? degrees(rotate) : undefined,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();

  const outputDir = path.join(process.cwd(), "storage", "pdfs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `filled_${Date.now()}.pdf`;
  const outputFilePath = path.join(outputDir, fileName);
  fs.writeFileSync(outputFilePath, pdfBytes);

  const softFileName = generatePdfFileName({ firstName: body.firstName, lastName: body.lastName });
  const result = await PdfForm.create({
    fileName: softFileName,
    filePath: `storage/pdfs/${fileName}`,
    user: user._id,
    fileSizeBytes: pdfBytes.byteLength,
    ...body,
  });

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: "PDF filled successfully",
  });
});

const getMyPdfs = catchAsyncError(async (req, res) => {
  const model = PdfForm.find({ user: req.user!._id }).select("-filePath");
  const queryModel = new QueryBuilder(model, req.query)
    .paginate()
    .filter()
    .sort()
    .search(["firstName", "lastName", "fileName"]);
  await queryModel.count();
  const result = await queryModel.modelQuery;
  const meta = queryModel.getMeta();
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: "PDFs retrieved successfully",
    meta,
  });
});

const getPdfStreamByPdfId = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const user = req.user!;
  const pdf = await PdfForm.findById(id);
  if (!pdf) {
    throw new AppError(404, "PDF not found");
  }

  if (pdf.user.toString() !== user._id) {
    throw new AppError(403, "Unauthorized");
  }

  const filePath = path.join(process.cwd(), pdf.filePath);
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, "PDF file not found");
  }
  const fileStream = fs.createReadStream(filePath);
  res.set("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${pdf.fileName || path.basename(filePath)}"`
  );
  fileStream.pipe(res);
});

const pdfStatistics = catchAsyncError(async (req, res) => {
  const user = req.user!;

  const now = new Date();

  // Current month range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Current year range
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  // Total count
  const totalCount = await PdfForm.countDocuments({ user: user._id });

  // Current month count
  const currentMonthCount = await PdfForm.countDocuments({
    user: user._id,
    createdAt: { $gte: monthStart, $lt: monthEnd },
  });

  // Current year count
  const currentYearCount = await PdfForm.countDocuments({
    user: user._id,
    createdAt: { $gte: yearStart, $lt: yearEnd },
  });

  sendResponse(res, {
    data: {
      totalCount,
      currentMonthCount,
      currentYearCount,
    },
    success: true,
    statusCode: 200,
    message: "PDF statistics retrieved successfully",
  });
});

const pdfController = {
  fillPdf,
  getMyPdfs,
  getPdfStreamByPdfId,
  pdfStatistics,
};

export default pdfController;
