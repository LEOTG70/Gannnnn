import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import Registration from "@/models/Registration";

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { tournamentId, teamName, playerName, efootballId, email, phone } =
    body;

  if (
    !tournamentId ||
    !teamName ||
    !playerName ||
    !efootballId ||
    !email ||
    !phone
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }

  if (tournament.status !== "upcoming") {
    return NextResponse.json(
      { error: "Registration is closed for this tournament" },
      { status: 400 }
    );
  }

  const count = await Registration.countDocuments({
    tournamentId,
    status: { $ne: "rejected" },
  });
  if (count >= tournament.maxSlots) {
    return NextResponse.json(
      { error: "Tournament is full" },
      { status: 400 }
    );
  }

  const existing = await Registration.findOne({
    tournamentId,
    efootballId,
    status: { $ne: "rejected" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This eFootball ID is already registered for this tournament" },
      { status: 400 }
    );
  }

  const registration = await Registration.create({
    tournamentId,
    teamName,
    playerName,
    efootballId,
    email,
    phone,
  });

  return NextResponse.json({ registration }, { status: 201 });
}
