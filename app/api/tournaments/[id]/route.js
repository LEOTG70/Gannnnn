import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";
import Match from "@/models/Match";

export async function GET(req, { params }) {
  await connectDB();
  const tournament = await Tournament.findById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const registeredCount = await Registration.countDocuments({
    tournamentId: params.id,
    status: { $ne: "rejected" },
  });
  const matches = await Match.find({ tournamentId: params.id }).sort({
    groupName: 1,
    round: 1,
    matchIndex: 1,
  });
  return NextResponse.json({ tournament, registeredCount, matches });
}
