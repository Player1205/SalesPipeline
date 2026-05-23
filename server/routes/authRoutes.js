const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────
//  Public Routes
// ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user account.
 * Note: In production, protect this route with authorize('admin')
 * so only admins can create new BDA accounts.
 */
router.post("/register", registerUser);

/**
 * POST /api/auth/login
 * Authenticate a user and receive a JWT.
 * Body: { email, password }
 */
router.post("/login", loginUser);

// ─────────────────────────────────────────────
//  Protected Routes
// ─────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 */
router.get("/me", protect, getMe);

module.exports = router;
