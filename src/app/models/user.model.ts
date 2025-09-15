import bcrypt from "bcrypt";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["sup-admin", "admin"],
      required: true,
      default: "sup-admin",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    otp: {
      type: {
        code: {
          type: Number,
        },
        coolDown: {
          type: Number,
        },
      },
      required: false,
      select: 0,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
const User = mongoose.model("User", UserSchema);

export default User;
