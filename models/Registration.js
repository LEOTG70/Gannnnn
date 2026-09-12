import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    teamName: { type: String, required: true },
    playerName: { type: String, required: true },
    efootballId: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    seed: { type: Number, default: null },
    groupName: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
