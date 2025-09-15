import { Router } from "express";
import authController from "../controller/user.controller";
import authMiddleware from "../middlewares/authValidation";
import { validSchema } from "../middlewares/validator";
import { userValidation } from "../zodValidation/auth.zod";

const router = Router();
const userRoute = router;

router.post("/login", validSchema(userValidation.login), authController.login);
router.post("/logout", authMiddleware.isAuthenticatedUser(), authController.logout);
router.get("/author", authMiddleware.isAuthenticatedUser(), authController.author);
router.post("/refresh-token", authController.refreshToken);
router.patch("/update-profile", authMiddleware.isAuthenticatedUser(), authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/send-verification-email",
  validSchema(userValidation.sendVerificationEmail),
  authController.sendVerificationEmail
);
router.post("/verify-otp", authController.verifyOtp);
router.post(
  "/reset-password",
  validSchema(userValidation.resetPassword),
  authController.resetPassword
);
router.put("/change-password", authMiddleware.isAuthenticatedUser(), authController.changePassword);

router.delete(
  "/delete-account",
  authMiddleware.isAuthenticatedUser(),
  authController.deleteAccount
);

export default userRoute;
