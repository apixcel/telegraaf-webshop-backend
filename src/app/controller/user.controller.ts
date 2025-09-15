import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../config";
import AppError from "../errors/AppError";
import PdfForm from "../models/pdf.model";
import User from "../models/user.model";
import authUtils from "../utils/auth.utils";
import catchAsyncError from "../utils/catchAsync";
import sendResponse from "../utils/send.response";

const login = catchAsyncError(async (req, res) => {
  const { body } = req;
  const mode = body.mode || "email";

  const query = {
    [mode]: body[mode],
  };

  const isExist = await User.findOne(query).select("+password");

  if (!isExist) {
    throw new AppError(403, `No account found with ${mode} ${body[mode]}`);
  }

  const isMatch = bcrypt.compareSync(body.password, isExist.password);
  if (!isMatch) {
    throw new AppError(403, "Unauthorized. Password is incorrect");
  }

  if (!isExist.isVerified) {
    sendResponse(res, {
      data: {
        result: {
          isVerified: false,
        },
      },
      success: false,
      statusCode: 200,
      message: "Please verify your email",
    });

    return;
  }

  const tokenPayload = {
    _id: isExist._id.toString(),
    email: isExist.email,
    role: isExist.role || "",
  };

  const accessToken = authUtils.generateAccessToken(tokenPayload);
  const refreshToken = authUtils.generateRefreshToken(isExist._id.toString());
  res
    .cookie("accessToken", accessToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 24 * 60 * 60 * 30, // 30 days
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    });
  sendResponse(res, {
    data: {
      result: {
        ...isExist.toObject(),
        password: undefined,
        otp: undefined,
        otpExpiry: undefined,
      },
      accessToken,
    },
    success: true,
    statusCode: 200,
    message: "User logged in successfully",
  });
});

const sendVerificationEmail = catchAsyncError(async (req, res) => {
  const { email } = req.body;

  const result = await authUtils.sendVerificationEmail(email);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: "Verification email sent successfully",
  });
});

const author = catchAsyncError(async (req, res) => {
  const user = req.user!;

  const result = await User.findById(user._id);

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: "Author infor retrieved successfully",
  });
});

const updateProfile = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const body = req.body;

  ["email", "password", "otp", "isVerified", "role"].forEach((key) => {
    delete body[key];
  });

  const result = await User.findByIdAndUpdate(user._id, body, { new: true });
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: "Profile updated successfully",
  });
});

const logout = catchAsyncError(async (_req, res) => {
  res.clearCookie("accessToken", {
    path: "/",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    secure: config.NODE_ENV === "production" ? true : false,
  });
  res.clearCookie("refreshToken", {
    path: "/",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    secure: config.NODE_ENV === "production" ? true : false,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: null,
    message: "User logged out successfully",
  });
});

const refreshToken = catchAsyncError(async (req, res) => {
  const { cookies } = req;
  // const user = req.user

  const { refreshToken } = cookies as {
    refreshToken: string | undefined;
    accessToken: string | undefined;
  };

  if (!refreshToken) {
    throw new AppError(40, "No refresh token provided");
  }

  let userId: null | string = null;

  try {
    const decryptedJwt = jwt.verify(refreshToken, config.REFRESH_TOKEN.SECRET as string) as {
      _id: string;
    };
    userId = decryptedJwt._id;
  } catch {
    userId = null;
  }

  if (!userId) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(401, "User not found");
  }

  const accessToken = authUtils.generateAccessToken({
    _id: user._id.toString(),
    email: user.email,
    role: user.role || "",
  });

  // Generate new Access Token
  res.cookie("accessToken", accessToken, {
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: config.NODE_ENV === "production",
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Token refreshed",
    data: { accessToken },
  });
});

const forgotPassword = catchAsyncError(async (req, res) => {
  const { body } = req;
  const email = body.email;
  const locale = body.locale || "fr";

  if (!email) {
    throw new AppError(400, "Email is required");
  }

  const user = await User.findOne({
    email: email,
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const token = authUtils.generateForgotPasswordToken(user._id.toString());

  const url = `${config.frontend_base_url}/${locale}/reset-password/${token}`;

  const subject = "Account Password Reset Requested";
  const emailContent = `
      <p style="text-align: center;">
          Hey ${user?.firstName} , please reset your account password by clicking on the link below.<br>
          This link will expire within 5 minutes.
      </p>
      <a href="${url}" style="text-align: center; display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
  `;

  try {
    await authUtils.sendEmail({
      html: emailContent,
      receiverMail: user.email,
      subject,
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      data: null,
      message: "Password reset email sent successfully",
    });
  } catch {
    throw new AppError(500, "Error sending password reset email");
  }
});
const resetPassword = catchAsyncError(async (req, res) => {
  const { password: newPassword, token } = req.body;
  let decoded: { userId: string } | undefined = undefined;
  try {
    decoded = jwt.verify(token, config.RECOVERY_TOKEN.SECRET!) as { userId: string };
  } catch (e) {
    console.log(e);

    throw new AppError(400, "Session expired");
  }
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError(404, "Account not found or invalid reset token");
  }

  const hashedPassword = await authUtils.hashPassword(newPassword);

  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
  });

  const to = user.email;
  const subject = "Account Password Reset";

  await authUtils.sendEmail({
    html: `
          <p style="text-align: center;">Hey ${user.firstName} , your account password has been reset successfully.</p>`,
    receiverMail: to,
    subject,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password reset successfully",
    data: null,
  });
});
const changePassword = catchAsyncError(async (req, res) => {
  const body = req.body;
  const userAuth = req.user;
  if (!userAuth) {
    throw new AppError(404, "User not found");
  }
  const { password: newPassword, oldPassword } = body;

  const user = await User.findById(userAuth._id).select("+password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isPasswordMatching = bcrypt.compareSync(oldPassword, user.password);
  if (!isPasswordMatching) {
    throw new AppError(403, "Unauthorized. Password is incorrect");
  }

  if (newPassword === oldPassword) {
    throw new AppError(400, "New password cannot be the same as the old password");
  }

  const hashedPassword = await authUtils.hashPassword(newPassword);

  await User.findByIdAndUpdate(userAuth._id, { password: hashedPassword });

  const to = user.email;
  const subject = "Password Changed";
  const emailContent = `
      <p style="text-align: center;">Hey ${user.firstName} , your account password has been changed successfully.</p>`;

  await authUtils.sendEmail({
    html: emailContent,
    receiverMail: to,
    subject,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password changed successfully",
    data: null,
  });
});
const verifyOtp = catchAsyncError(async (req, res) => {
  const { otp, email } = req.body;
  const user = await User.findOne({ email, "otp.code": otp }).select("otp");

  if (!user) {
    throw new AppError(404, "Invalid code provided");
  }

  const isOtpExpired = !user.otp?.coolDown || user.otp.coolDown < Date.now();

  if (isOtpExpired) {
    throw new AppError(400, "Session expired. Please request a new code");
  }

  await User.findByIdAndUpdate(user._id, {
    otp: {
      code: null,
      coolDown: null,
    },
    isVerified: true,
  });

  const tokenPayload = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role || "",
  };
  const accessToken = authUtils.generateAccessToken(tokenPayload);
  const refreshToken = authUtils.generateRefreshToken(user._id.toString());
  res
    .cookie("accessToken", accessToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 24 * 60 * 60 * 30, // 30 days
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    });
  sendResponse(res, {
    data: {
      result: {
        ...user.toObject(),
        password: undefined,
        otp: undefined,
        otpExpiry: undefined,
      },
      accessToken,
    },
    success: true,
    statusCode: 200,
    message: "User verified successfully",
  });
});

const deleteAccount = catchAsyncError(async (req, res) => {
  const user = req.user!;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(
      async () => {
        // Ensure the user still exists (and lock the doc in the txn context)
        const found = await User.findById(user._id).session(session);
        if (!found) {
          // Throwing inside withTransaction will abort the txn
          throw new AppError(404, "User not found");
        }

        await User.findByIdAndDelete(user._id, { session });
        await PdfForm.deleteMany({ user: user._id }, { session });
      } /*, { writeConcern: { w: "majority" } }*/
    );
    res.clearCookie("accessToken", {
      path: "/",
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      secure: config.NODE_ENV === "production" ? true : false,
    });
    res.clearCookie("refreshToken", {
      path: "/",
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      secure: config.NODE_ENV === "production" ? true : false,
    });
    return sendResponse(res, {
      data: null,
      success: true,
      statusCode: 200,
      message: "Account deleted successfully",
    });
  } catch {
    return sendResponse(res, {
      data: null,
      success: false,
      statusCode: 500,
      message: "Failed to delete account",
    });
  } finally {
    await session.endSession();
  }
});

const authController = {
  login,
  logout,
  author,
  verifyOtp,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  updateProfile,
  deleteAccount,
};

export default authController;
