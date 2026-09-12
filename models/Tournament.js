import mongoose from "mongoose";

const TournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    format: {
      type: String,
      enum: ["single-elimination", "group-knockout"],
      default: "single-elimination",
    },
    // Only used when format === "group-knockout"
    numGroups: { type: Number, default: 2 },
    qualifiersPerGroup: { type: Number, default: 2 },
    groupsGenerated: { type: Boolean, default: false },

    maxSlots: { type: Number, default: 16 },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["upcoming", "registration-closed", "ongoing", "completed"],
      default: "upcoming",
    },
    bracketGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Tournament ||
  mongoose.model("Tournament", TournamentSchema);
