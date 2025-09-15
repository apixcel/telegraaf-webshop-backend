import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import nodemailer from "nodemailer";
import config from "../config";
import AppError from "../errors/AppError";
import { IUserJWTPayload } from "../interface/auth.interface";
import User from "../models/user.model";
const generateAccessToken = (payload: IUserJWTPayload) => {
  const { EXPIRY, SECRET = "" } = config.ACCESS_TOKEN;

  const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRY } as SignOptions);
  return token;
};

const generateRefreshToken = (id: string) => {
  const { EXPIRY, SECRET = "" } = config.REFRESH_TOKEN;
  const token = jwt.sign({ _id: id }, SECRET, { expiresIn: EXPIRY } as SignOptions);
  return token;
};
const generateForgotPasswordToken = (id: string) => {
  const { EXPIRY, SECRET = "" } = config.RECOVERY_TOKEN;
  const token = jwt.sign({ userId: id }, SECRET, { expiresIn: EXPIRY } as SignOptions);
  return token;
};

const generateOTP = (length = 6) => {
  const otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
  return otp;
};

const verifyAccessToken = (token: string) => {
  const { SECRET = "" } = config.ACCESS_TOKEN;
  const payload = jwt.verify(token, SECRET);
  return payload;
};
const hashPassword = (password: string) => {
  const hash = bcrypt.hash(password, 10);
  return hash;
};
const sendMessage = async (data: { html: string; receiverMail: string; subject: string }) => {
  // under construction
  return data;
};
const sendEmail = async (data: { html: string; receiverMail: string; subject: string }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.apixcel.com",
      port: 587,
      secure: false,
      auth: {
        user: config.MAIL_ADDRESS as string,
        pass: config.MAILPASS as string,
      },
    });

    const mailOptions = {
      from: config.MAIL_ADDRESS,
      to: data.receiverMail,
      subject: data.subject,
      html: data.html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendVerificationEmail = async (email: string) => {
  const user = await User.findOne({ email }).select("+otp");
  if (!user) {
    throw new AppError(404, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(400, "User already verified");
  }
  console.log(user.otp);

  const now = Date.now();
  const isCooldownActive = user.otp?.coolDown && user.otp.coolDown > now;

  if (isCooldownActive && user.otp?.coolDown) {
    const waitTime = Math.ceil((user.otp.coolDown - now) / 1000);

    return {
      cooldownEnd: user.otp?.coolDown,
      remainingSecond: waitTime,
    };
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  const newCoolDown = now + 5 * 60 * 1000;
  const waitTime = Math.ceil((newCoolDown - now) / 1000);
  await User.findByIdAndUpdate(user._id, {
    otp: {
      code: otp,
      coolDown: newCoolDown,
    },
  });

  const template = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f6f8;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          
          <!-- Header (brand) -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;">
            <tr>
              <td align="left" style="font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:28px; line-height:1; color:#0f7c41; padding:8px 0 16px 6px;">
               Escape Creation
              </td>
            </tr>
          </table>

          <!-- Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px; background:#ffffff; border:1px solid #e6e8eb; border-radius:8px;">
            <tr>
              <td style="padding:28px 28px 16px 28px; font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827;">
                <div style="font-size:16px; line-height:24px;">
                  Your one-time verification code:
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:6px 28px 18px 28px;">
                <div style="font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:32px; line-height:40px; font-weight:700; letter-spacing:1px; color:#111827;">
                  ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 28px 28px;">
                <div style="font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:20px; color:#4b5563;">
                  This code expires after 5 minutes. If you did not request this, please
                  change your password or contact Support.
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>`;

  await sendEmail({
    html: template,
    receiverMail: email,
    subject: "Account Verification",
  });

  return {
    cooldownEnd: newCoolDown,
    remainingSecond: waitTime,
  };
};

const adminSeed = async () => {
  const admin = await User.findOne({ role: "sup-admin" });
  if (admin) {
    return;
  }
  await User.create({
    email: config.ADMIN_EMAIL,
    password: config.ADMIN_DEFAULT_PASSWORD!,
    role: "sup-admin",
    firstName: "Super",
    lastName: "Admin",
    isVerified: true,
    isAccepted: true,
  });
};
const authUtils = {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  verifyAccessToken,
  generateForgotPasswordToken,
  hashPassword,
  sendMessage,
  sendEmail,
  sendVerificationEmail,
  adminSeed,
};

export default authUtils;
