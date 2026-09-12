require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password) {
    console.error(
      "Missing MONGODB_URI, ADMIN_EMAIL or ADMIN_PASSWORD in .env.local"
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  const existing = await Admin.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated password for existing admin: ${email}`);
  } else {
    await Admin.create({ email, passwordHash });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
