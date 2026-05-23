/**
 * Nexus BDA — Seed Script
 * Creates an admin user and a BDA user directly in MongoDB.
 *
 * Usage (from inside the server/ directory):
 *   node seed.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ── Inline schema so the script is fully self-contained ──────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["admin", "bda"], default: "bda" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// ── Seed data ────────────────────────────────────────────────────────────────
const users = [
  {
    name: "Vansh Admin",
    email: "admin@nexus.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Demo BDA",
    email: "bda@nexus.com",
    password: "password123",
    role: "bda",
  },
];

// ── Run ──────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected.");

    // Wipe existing users so the script is safe to re-run
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users.");

    for (const u of users) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(u.password, salt);
      await User.create({ ...u, password: hashed });
      console.log(`👤 Created [${u.role}] → ${u.email} / ${u.password}`);
    }

    console.log("\n🎉 Seed complete. You can now log in with:");
    console.log("   Admin → admin@nexus.com  / password123");
    console.log("   BDA   → bda@nexus.com    / password123\n");

  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
