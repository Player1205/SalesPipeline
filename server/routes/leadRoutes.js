const express = require("express");
const router = express.Router();

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStage,
  deleteLead,
  getLeadMetricsByBDA,
} = require("../controllers/leadController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All routes below this line require a valid JWT
router.use(protect);

// ─────────────────────────────────────────────
//  Aggregation / Metrics  (must be defined BEFORE /:id routes)
// ─────────────────────────────────────────────

/**
 * GET /api/leads/metrics/by-bda
 * Returns per-BDA performance aggregation for the Admin dashboard.
 * Admin only.
 */
router.get("/metrics/by-bda", authorize("admin"), getLeadMetricsByBDA);

// ─────────────────────────────────────────────
//  Collection Routes
// ─────────────────────────────────────────────

/**
 * GET  /api/leads        — List leads (Admin: all | BDA: own only)
 * POST /api/leads        — Create a new lead
 *
 * Supported query params for GET:
 *   ?stage=New           — filter by pipeline stage
 *   ?search=Acme         — search by company or contact name
 *   ?sort=-createdAt     — sort field (prefix - for descending)
 *   ?page=1&limit=20     — pagination
 */
router
  .route("/")
  .get(getLeads)
  .post(authorize("admin", "bda"), createLead);

// ─────────────────────────────────────────────
//  Kanban Stage Update  (defined before /:id to avoid route conflict)
// ─────────────────────────────────────────────

/**
 * PATCH /api/leads/:id/stage
 * Updates only the pipeline stage of a lead.
 * Intended to be called on Kanban card drag-and-drop.
 * Body: { stage: "Negotiation" }
 */
router.patch("/:id/stage", authorize("admin", "bda"), updateLeadStage);

// ─────────────────────────────────────────────
//  Single Resource Routes
// ─────────────────────────────────────────────

/**
 * GET    /api/leads/:id  — Get a single lead by ID
 * PATCH  /api/leads/:id  — Update lead details (Admin or assigned BDA)
 * DELETE /api/leads/:id  — Delete a lead (Admin only)
 */
router
  .route("/:id")
  .get(getLeadById)
  .patch(authorize("admin", "bda"), updateLead)
  .delete(authorize("admin"), deleteLead);

module.exports = router;
