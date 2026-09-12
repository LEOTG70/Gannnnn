import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";
import Match from "@/models/Match";
import { getAdminFromRequest } from "@/lib/auth";
import { shuffleArray, generateRoundRobin } from "@/lib/bracketGen";

// Splits approved players into N groups and auto-generates round-robin
// fixtures within each group (stage: "group").
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
  if (tournament.format !== "group-knockout") {
    return NextResponse.json(
      { error: "This tournament isn't set up for a group stage" },
      { status: 400 }
    );
  }
  if (tournament.groupsGenerated) {
    return NextResponse.json(
      { error: "Groups have already been generated" },
      { status: 400 }
    );
  }

  const numGroups = Math.max(2, tournament.numGroups || 2);
  const approved = await Registration.find({ tournamentId, status: "approved" });

  if (approved.length < numGroups * 2) {
    return NextResponse.json(
      {
        error: `Need at least ${numGroups * 2} approved players (2 per group) — currently ${approved.length} approved`,
      },
      { status: 400 }
    );
  }

  const shuffled = shuffleArray(approved);
  const groups = Array.from({ length: numGroups }, () => []);
  shuffled.forEach((p, i) => groups[i % numGroups].push(p));
  const groupNames = groups.map((_, i) => `Group ${String.fromCharCode(65 + i)}`);

  await Match.deleteMany({ tournamentId, stage: "group" });

  for (let g = 0; g < groups.length; g++) {
    const groupName = groupNames[g];
    const teams = groups[g];

    await Promise.all(
      teams.map((t) => Registration.findByIdAndUpdate(t._id, { groupName }))
    );

    const fixtures = generateRoundRobin(teams);
    const matchDocs = fixtures.map((f, idx) => ({
      tournamentId,
      stage: "group",
      groupName,
      round: f.round,
      matchIndex: idx,
      player1RegId: f.home._id,
      player2RegId: f.away._id,
      player1Name: `${f.home.teamName} (${f.home.playerName})`,
      player2Name: `${f.away.teamName} (${f.away.playerName})`,
      status: "pending",
    }));
    if (matchDocs.length) await Match.insertMany(matchDocs);
  }

  tournament.groupsGenerated = true;
  tournament.status = "ongoing";
  await tournament.save();

  const matches = await Match.find({ tournamentId, stage: "group" }).sort({
    groupName: 1,
    round: 1,
    matchIndex: 1,
  });

  return NextResponse.json({ matches });
}
