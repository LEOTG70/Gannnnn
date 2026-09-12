import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    stage: {
      type: String,
      enum: ["group", "knockout"],
      default: "knockout",
    },
    groupName: { type: String, default: null }, // e.g. "Group A" — only for stage: "group"
    round: { type: Number, required: true },
    matchIndex: { type: Number, required: true },
    player1RegId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },
    player2RegId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },
    player1Name: { type: String, default: "BYE" },
    player2Name: { type: String, default: "BYE" },
    score1: { type: Number, default: null },
    score2: { type: Number, default: null },
    winnerRegId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },
    winnerName: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "completed", "bye"],
      default: "pending",
    },
    // Base64 data URL of a screenshot uploaded as proof of the result.
    screenshot: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
