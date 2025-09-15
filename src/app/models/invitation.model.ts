import mongoose from "mongoose";

const InvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["sup-admin", "admin"],
      required: true,
      default: "admin",
    },

    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },

    shouldAutoAccept: {
      type: Boolean,
      default: false,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model("Invitation", InvitationSchema);

export default Invitation;
