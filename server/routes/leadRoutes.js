import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStage,
  deleteLead,
  getLeadMetricsByBDA,
} from "../controllers/leadController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Aggregation — must be before /:id
router.get("/metrics/by-bda", authorize("admin"), getLeadMetricsByBDA);

// Collection
router.route("/").get(getLeads).post(authorize("admin", "bda"), createLead);

// Kanban stage update — must be before /:id
router.patch("/:id/stage", authorize("admin", "bda"), updateLeadStage);

// Single resource
router
  .route("/:id")
  .get(getLeadById)
  .patch(authorize("admin", "bda"), updateLead)
  .delete(authorize("admin"), deleteLead);

export default router;
