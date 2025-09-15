import { z } from "zod";

const emailSchema = z
  .string({ message: "Email is required" })
  .email({ message: "Invalid email address" });

const signup = z.object({
  firstName: z.string({ message: "firstName is required" }),
  lastName: z.string({ message: "lastName is required" }),
  role: z.enum(["sup-admin", "admin"]).default("admin"),
  email: z.string({ message: "email is required" }).email({ message: "Email is invalid" }),
  password: z.string({ message: "Password is required" }),
});

const login = z
  .object({
    email: z
      .string({ message: "Email is required String" })
      .email({ message: "Email is invalid" })
      .optional(),
    phoneNumber: z.string({ message: "Phone number is required string" }).optional(),
    password: z.string({ message: "Password is required" }),
    mode: z.enum(["email", "phoneNumber"]).optional(),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: "Either 'email' or 'phoneNumber' must be provided.",
    path: ["email"],
  });
const resetPassword = z.object({
  token: z.string({ message: "Token is required" }),
  password: z.string({ message: "A new 'Password' is required" }),
});
const changePassword = z.object({
  oldPassword: z.string({ message: "oldpassword is required" }),
  password: z.string({ message: "A new 'Password' is required" }),
});

const sendVerificationEmail = z.object({
  email: emailSchema,
});

const forgotPassword = z.object({
  email: emailSchema,
});

export const userValidation = {
  login,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  signup,
  forgotPassword,
};
