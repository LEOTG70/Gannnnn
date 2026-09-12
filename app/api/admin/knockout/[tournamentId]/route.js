import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";
import Match from "@/models/Match";
import { getAdminFromRequest } from "@/lib/auth";
import { createKnockoutBracket } from "@/lib/bracketGen";
import { computeStandings } from "@/lib/standings";

// Reads current group standings, takes the top N (qualifiersPerGroup) from
// each group, and seeds them into a knockout bracket. Qualifiers are
// interleaved by rank across groups (all group winners first, then all
// runners-up, etc.) so teams from the same group are spread apart.
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
  if (!tournament.groupsGenerated) {
    return NextResponse.json(
      { error: "Generate the group stage first" },
      { status: 400 }
    );
  }
  if (tournament.bracketGenerated) {
    return NextResponse.json(
      { error: "Knockout bracket already generated" },
      { status: 400 }
    );
  }

  const qualifiersPerGroup = Math.max(1, tournament.qualifiersPerGroup || 2);
  const groupMatches = await Match.find({ tournamentId, stage: "group" }).lean();
  const groupNames = [...new Set(groupMatches.map((m) => m.groupName))].sort();

  const tiers = [];
  for (const gName of groupNames) {
    const matchesInGroup = groupMatches.filter((m) => m.groupName === gName);
    const standings = computeStandings(matchesInGroup);
    const qualifiers = standings.slice(0, qualifiersPerGroup);
    qualifiers.forEach((q, rankIdx) => {
      tiers[rankIdx] = tiers[rankIdx] || [];
      tiers[rankIdx].push(q);
    });
  }
  const flatQualifiers = tiers.flat();

  if (flatQualifiers.length < 2) {
    return NextResponse.json(
      { error: "Not enough completed group matches to determine qualifiers yet" },
      { status: 400 }
    );
  }

  const regIds = flatQualifiers.map((q) => q.regId);
  const regs = await Registration.find({ _id: { $in: regIds } });
  const regMap = {};
  regs.forEach((r) => (regMap[r._id.toString()] = r));
  const players = flatQualifiers.map((q) => regMap[q.regId]).filter(Boolean);

  const matches = await createKnockoutBracket({
    tournamentId,
    players,
    shuffleFirst: false,
  });

  tournament.bracketGenerated = true;
  await tournament.save();

  return NextResponse.json({ matches });
}
