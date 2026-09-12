import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { getAdminFromRequest } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const body = await req.json();
  const allowed = ["status", "name", "description", "maxSlots", "startDate"];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  const tournament = await Tournament.findByIdAndUpdate(params.id, update, {
    new: true,
  });
  return NextResponse.json({ tournament });
}
