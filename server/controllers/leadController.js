const Lead = require("../models/Lead");

// Valid pipeline stages — single source of truth for validation
const VALID_STAGES = ["New", "Contacted", "Proposal Sent", "Negotiation", "Won", "Lost"];

// ─────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────

/**
 * @desc    Create a new lead
 * @route   POST /api/leads
 * @access  Private (Admin, BDA)
 */
const createLead = async (req, res) => {
  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    value,
    stage,
    notes,
    assignedTo,
  } = req.body;

  if (!companyName || !contactName || !value) {
    return res.status(400).json({
      success: false,
      message: "companyName, contactName, and value are required.",
    });
  }

  try {
    // BDAs can only create leads assigned to themselves
    const assignee =
      req.user.role === "admin" && assignedTo ? assignedTo : req.user._id;

    const lead = await Lead.create({
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      value,
      stage: stage && VALID_STAGES.includes(stage) ? stage : "New",
      notes,
      assignedTo: assignee,
      createdBy: req.user._id,
    });

    const populated = await lead.populate("assignedTo", "name email");

    res.status(201).json({
      success: true,
      message: "Lead created successfully.",
      data: populated,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error creating lead." });
  }
};

// ─────────────────────────────────────────────
//  READ (all leads)
// ─────────────────────────────────────────────

/**
 * @desc    Get leads — Admins see all, BDAs see only their own
 * @route   GET /api/leads
 * @access  Private
 *
 * Query params:
 *   stage     — filter by pipeline stage  (e.g. ?stage=New)
 *   search    — fuzzy search on companyName or contactName
 *   sort      — field to sort by          (default: -createdAt)
 *   page      — page number               (default: 1)
 *   limit     — results per page          (default: 50)
 */
const getLeads = async (req, res) => {
  try {
    const { stage, search, sort = "-createdAt", page = 1, limit = 50 } = req.query;

    // --- Build Filter ---
    const filter = {};

    // BDAs are scoped to their own leads
    if (req.user.role === "bda") {
      filter.assignedTo = req.user._id;
    }

    if (stage && VALID_STAGES.includes(stage)) {
      filter.stage = stage;
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
      ];
    }

    // --- Pagination ---
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Lead.countDocuments(filter);

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: leads.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: leads,
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching leads." });
  }
};

// ─────────────────────────────────────────────
//  READ (single lead)
// ─────────────────────────────────────────────

/**
 * @desc    Get a single lead by ID
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // BDAs can only view their own leads
    if (
      req.user.role === "bda" &&
      lead.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error("Get Lead By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching lead." });
  }
};

// ─────────────────────────────────────────────
//  UPDATE (full update)
// ─────────────────────────────────────────────

/**
 * @desc    Update lead details (full PATCH)
 * @route   PATCH /api/leads/:id
 * @access  Private (Admin, or the BDA the lead is assigned to)
 */
const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    // Permission check — BDA can only edit their own leads
    if (
      req.user.role === "bda" &&
      lead.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Prevent arbitrary stage values
    if (req.body.stage && !VALID_STAGES.includes(req.body.stage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
      });
    }

    // Protect ownership fields from being changed via this route
    delete req.body.createdBy;
    if (req.user.role !== "admin") delete req.body.assignedTo;

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedTo", "name email");

    res.status(200).json({ success: true, message: "Lead updated.", data: lead });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error updating lead." });
  }
};

// ─────────────────────────────────────────────
//  UPDATE STAGE (Kanban drag-and-drop endpoint)
// ─────────────────────────────────────────────

/**
 * @desc    Update ONLY the pipeline stage of a lead (used by the Kanban board)
 * @route   PATCH /api/leads/:id/stage
 * @access  Private (Admin, or the BDA the lead is assigned to)
 *
 * Body: { stage: "Negotiation" }
 */
const updateLeadStage = async (req, res) => {
  const { stage } = req.body;

  if (!stage) {
    return res.status(400).json({ success: false, message: "Stage is required." });
  }

  if (!VALID_STAGES.includes(stage)) {
    return res.status(400).json({
      success: false,
      message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}`,
    });
  }

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    if (
      req.user.role === "bda" &&
      lead.assignedTo.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    lead.stage = stage;
    await lead.save();

    await lead.populate("assignedTo", "name email");

    res.status(200).json({
      success: true,
      message: `Lead moved to '${stage}'.`,
      data: lead,
    });
  } catch (error) {
    console.error("Update Stage Error:", error);
    res.status(500).json({ success: false, message: "Server error updating stage." });
  }
};

// ─────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────

/**
 * @desc    Delete a lead
 * @route   DELETE /api/leads/:id
 * @access  Private (Admin only)
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }

    await lead.deleteOne();

    res.status(200).json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error deleting lead." });
  }
};

// ─────────────────────────────────────────────
//  DASHBOARD AGGREGATION
// ─────────────────────────────────────────────

/**
 * @desc    Get leads aggregated per BDA — powers the Admin Performance Dashboard
 * @route   GET /api/leads/metrics/by-bda
 * @access  Private (Admin only)
 *
 * Returns per-BDA breakdown:
 *   - totalLeads, totalValue, wonLeads, lostLeads, activeLeads, conversionRate
 * Plus top-level summary totals.
 */
const getLeadMetricsByBDA = async (req, res) => {
  try {
    const pipeline = [
      // ── Stage 1: Group by assignee + stage ──────────────────────────────
      {
        $group: {
          _id: { assignedTo: "$assignedTo", stage: "$stage" },
          count: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
      // ── Stage 2: Reshape into per-user documents with stage breakdown ──
      {
        $group: {
          _id: "$_id.assignedTo",
          stages: {
            $push: {
              stage: "$_id.stage",
              count: "$count",
              totalValue: "$totalValue",
            },
          },
          totalLeads: { $sum: "$count" },
          totalValue: { $sum: "$totalValue" },
        },
      },
      // ── Stage 3: Hydrate the user reference ────────────────────────────
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "bdaInfo",
        },
      },
      { $unwind: "$bdaInfo" },
      // ── Stage 4: Shape the final output ────────────────────────────────
      {
        $project: {
          _id: 0,
          bdaId: "$_id",
          name: "$bdaInfo.name",
          email: "$bdaInfo.email",
          totalLeads: 1,
          totalValue: 1,
          stages: 1,
          // Derived metrics computed in the projection
          wonLeads: {
            $ifNull: [
              {
                $getField: {
                  field: "count",
                  input: {
                    $first: {
                      $filter: {
                        input: "$stages",
                        as: "s",
                        cond: { $eq: ["$$s.stage", "Won"] },
                      },
                    },
                  },
                },
              },
              0,
            ],
          },
          lostLeads: {
            $ifNull: [
              {
                $getField: {
                  field: "count",
                  input: {
                    $first: {
                      $filter: {
                        input: "$stages",
                        as: "s",
                        cond: { $eq: ["$$s.stage", "Lost"] },
                      },
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      // ── Stage 5: Compute conversionRate and activeLeads ────────────────
      {
        $addFields: {
          activeLeads: {
            $subtract: ["$totalLeads", { $add: ["$wonLeads", "$lostLeads"] }],
          },
          conversionRate: {
            $cond: [
              { $eq: ["$totalLeads", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$wonLeads", "$totalLeads"] },
                      100,
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      { $sort: { totalValue: -1 } },
    ];

    const bdaMetrics = await Lead.aggregate(pipeline);

    // ── Summary totals across all BDAs ──────────────────────────────────
    const summary = bdaMetrics.reduce(
      (acc, bda) => {
        acc.totalLeads += bda.totalLeads;
        acc.totalValue += bda.totalValue;
        acc.totalWon += bda.wonLeads;
        acc.totalActive += bda.activeLeads;
        return acc;
      },
      { totalLeads: 0, totalValue: 0, totalWon: 0, totalActive: 0 }
    );

    summary.overallConversionRate =
      summary.totalLeads > 0
        ? parseFloat(((summary.totalWon / summary.totalLeads) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary,
        byBDA: bdaMetrics,
      },
    });
  } catch (error) {
    console.error("BDA Metrics Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching metrics." });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStage,
  deleteLead,
  getLeadMetricsByBDA,
};
