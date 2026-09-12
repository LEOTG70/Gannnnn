import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { getAdminFromRequest } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { status } = await req.json();

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const registration = await Registration.findByIdAndUpdate(
    params.regId,
    { status },
    { new: true }
  );

  return NextResponse.json({ registration });
}
