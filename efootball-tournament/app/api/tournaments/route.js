import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const tournaments = await Tournament.find().sort({ startDate: 1 });
  return NextResponse.json({ tournaments });
}

export async function POST(req) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const body = await req.json();

  if (!body.name || !body.startDate) {
    return NextResponse.json(
      { error: "Name and start date are required" },
      { status: 400 }
    );
  }

  const isGroupKnockout = body.format === "group-knockout";

  const tournament = await Tournament.create({
    name: body.name,
    description: body.description || "",
    maxSlots: body.maxSlots || 16,
    startDate: body.startDate,
    format: isGroupKnockout ? "group-knockout" : "single-elimination",
    numGroups: isGroupKnockout ? body.numGroups || 2 : 2,
    qualifiersPerGroup: isGroupKnockout ? body.qualifiersPerGroup || 2 : 2,
  });

  return NextResponse.json({ tournament }, { status: 201 });
}
