import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./app/config";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import { getProductSkuIdMap } from "./app/utils/product.utils";
import sendResponse from "./app/utils/send.response";

const app: Application = express();

// parsers
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [config.FRONTEND_BASE_URL!],
    credentials: true,
    // exposedHeaders: ["Content-Disposition"],
  })
);

// application routes
app.use("/api/v1", router);

// test route
app.get("/", async (_req: Request, res: Response) => {
  const data = await getProductSkuIdMap();
  sendResponse(res, {
    data: data,
    success: true,
    statusCode: 200,
    message: "server running ⚡⚡⚡ ",
  });
});

app.use(notFound);
// global error handler
app.use(globalErrorHandler);

// not found route

export default app;
