import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";
import { getAdminFromRequest } from "@/lib/auth";
import { createKnockoutBracket } from "@/lib/bracketGen";

// Generates a knockout bracket directly from approved registrations.
// Used for "single-elimination" format tournaments (no group stage).
export async function POST(req, { params }) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { tournamentId } = params;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (tournament.bracketGenerated) {
    return NextResponse.json(
      { error: "Bracket already generated for this tournament" },
      { status: 400 }
    );
  }

  const approved = await Registration.find({
    tournamentId,
    status: "approved",
  });
  if (approved.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 approved players to generate a bracket" },
      { status: 400 }
    );
  }

  const matches = await createKnockoutBracket({
    tournamentId,
    players: approved,
    shuffleFirst: true,
  });

  tournament.bracketGenerated = true;
  tournament.status = "ongoing";
  await tournament.save();

  return NextResponse.json({ matches });
}
