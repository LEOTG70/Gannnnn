import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";
import { getAdminFromRequest } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { score1, score2, screenshot } = await req.json();

  if (typeof score1 !== "number" || typeof score2 !== "number") {
    return NextResponse.json(
      { error: "Provide numeric scores for both players" },
      { status: 400 }
    );
  }

  const match = await Match.findById(params.matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (!match.player1RegId || !match.player2RegId) {
    return NextResponse.json(
      { error: "Both players must be set before entering a score" },
      { status: 400 }
    );
  }

  // Knockout matches need a winner; group-stage matches can be a draw.
  if (match.stage === "knockout" && score1 === score2) {
    return NextResponse.json(
      { error: "Knockout matches can't end in a draw — enter a winning score" },
      { status: 400 }
    );
  }

  match.score1 = score1;
  match.score2 = score2;
  if (screenshot) match.screenshot = screenshot;
  match.status = "completed";

  if (score1 === score2) {
    match.winnerRegId = null;
    match.winnerName = null;
  } else {
    const winnerIsP1 = score1 > score2;
    match.winnerRegId = winnerIsP1 ? match.player1RegId : match.player2RegId;
    match.winnerName = winnerIsP1 ? match.player1Name : match.player2Name;
  }
  await match.save();

  // Only knockout matches feed a winner into a "next match" slot.
  if (match.stage === "knockout" && match.winnerRegId) {
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.matchIndex / 2);
    const nextMatch = await Match.findOne({
      tournamentId: match.tournamentId,
      stage: "knockout",
      round: nextRound,
      matchIndex: nextIndex,
    });

    if (nextMatch) {
      const isFirstSlot = match.matchIndex % 2 === 0;
      if (isFirstSlot) {
        nextMatch.player1RegId = match.winnerRegId;
        nextMatch.player1Name = match.winnerName;
      } else {
        nextMatch.player2RegId = match.winnerRegId;
        nextMatch.player2Name = match.winnerName;
      }
      await nextMatch.save();
    } else {
      // This was the final match — mark tournament completed
      await Tournament.findByIdAndUpdate(match.tournamentId, {
        status: "completed",
      });
    }
  }

  return NextResponse.json({ match });
}
