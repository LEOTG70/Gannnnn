import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");
  if (!tournamentId) {
    return NextResponse.json(
      { error: "tournamentId is required" },
      { status: 400 }
    );
  }
  const registrations = await Registration.find({ tournamentId }).sort({
    createdAt: 1,
  });
  return NextResponse.json({ registrations });
}
