import Lead from "../models/Lead.js";

const VALID_STAGES = ["New", "Contacted", "Proposal Sent", "Negotiation", "Won", "Lost"];

// ─────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────

const createLead = async (req, res) => {
  const {
    companyName, contactName, contactEmail, contactPhone,
    value, stage, notes, assignedTo,
  } = req.body;

  if (!companyName || !contactName || !value) {
    return res.status(400).json({
      success: false,
      message: "companyName, contactName, and value are required.",
    });
  }

  try {
    const assignee = req.user.role === "admin" && assignedTo ? assignedTo : req.user._id;

    // Build notes array only if a note string was provided
    const notesArray = notes
      ? [{ text: notes, createdBy: req.user._id }]
      : [];

    const lead = await Lead.create({
      companyName,
      contactPerson: contactName,       // model field: contactPerson
      email: contactEmail,              // model field: email
      phone: contactPhone || null,      // model field: phone
      value,
      status: stage && VALID_STAGES.includes(stage) ? stage : "New",  // model field: status
      notes: notesArray,
      assignedTo: assignee,
    });

    const populated = await lead.populate("assignedTo", "name email");

    res.status(201).json({ success: true, message: "Lead created successfully.", data: populated });
  } catch (error) {
    console.error("Create Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error creating lead." });
  }
};

// ─────────────────────────────────────────────
//  READ (all)
// ─────────────────────────────────────────────

const getLeads = async (req, res) => {
  try {
    const { stage, search, sort = "-createdAt", page = 1, limit = 50 } = req.query;

    const filter = {};

    if (req.user.role === "bda") filter.assignedTo = req.user._id;

    if (stage && VALID_STAGES.includes(stage)) filter.status = stage; // model: status

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } }, // model: contactPerson
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Lead.countDocuments(filter);

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
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
//  READ (single)
// ─────────────────────────────────────────────

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate("assignedTo", "name email");

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });

    if (req.user.role === "bda" && lead.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error("Get Lead By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching lead." });
  }
};

// ─────────────────────────────────────────────
//  UPDATE (full)
// ─────────────────────────────────────────────

const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });

    if (req.user.role === "bda" && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Map incoming field names to model field names
    const update = { ...req.body };
    if (update.contactName)  { update.contactPerson = update.contactName;  delete update.contactName; }
    if (update.contactEmail) { update.email         = update.contactEmail; delete update.contactEmail; }
    if (update.contactPhone) { update.phone         = update.contactPhone; delete update.contactPhone; }
    if (update.stage)        { update.status        = update.stage;        delete update.stage; }

    if (update.status && !VALID_STAGES.includes(update.status)) {
      return res.status(400).json({ success: false, message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}` });
    }

    delete update.notes;   // notes have their own endpoint
    delete update.createdBy;
    if (req.user.role !== "admin") delete update.assignedTo;

    lead = await Lead.findByIdAndUpdate(req.params.id, update, {
      new: true, runValidators: true,
    }).populate("assignedTo", "name email");

    res.status(200).json({ success: true, message: "Lead updated.", data: lead });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Server error updating lead." });
  }
};

// ─────────────────────────────────────────────
//  UPDATE STAGE (Kanban drag-and-drop)
// ─────────────────────────────────────────────

const updateLeadStage = async (req, res) => {
  const { stage } = req.body;

  if (!stage) return res.status(400).json({ success: false, message: "Stage is required." });
  if (!VALID_STAGES.includes(stage)) {
    return res.status(400).json({ success: false, message: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}` });
  }

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });

    if (req.user.role === "bda" && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    lead.status = stage;  // model field: status
    await lead.save();
    await lead.populate("assignedTo", "name email");

    res.status(200).json({ success: true, message: `Lead moved to '${stage}'.`, data: lead });
  } catch (error) {
    console.error("Update Stage Error:", error);
    res.status(500).json({ success: false, message: "Server error updating stage." });
  }
};

// ─────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────

const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found." });
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

const getLeadMetricsByBDA = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { assignedTo: "$assignedTo", status: "$status" }, // model: status
          count: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
      {
        $group: {
          _id: "$_id.assignedTo",
          stages: { $push: { stage: "$_id.status", count: "$count", totalValue: "$totalValue" } },
          totalLeads: { $sum: "$count" },
          totalValue: { $sum: "$totalValue" },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "bdaInfo" } },
      { $unwind: "$bdaInfo" },
      {
        $project: {
          _id: 0, bdaId: "$_id", name: "$bdaInfo.name", email: "$bdaInfo.email",
          totalLeads: 1, totalValue: 1, stages: 1,
          wonLeads: {
            $ifNull: [{ $getField: { field: "count", input: { $first: { $filter: { input: "$stages", as: "s", cond: { $eq: ["$$s.stage", "Won"] } } } } } }, 0],
          },
          lostLeads: {
            $ifNull: [{ $getField: { field: "count", input: { $first: { $filter: { input: "$stages", as: "s", cond: { $eq: ["$$s.stage", "Lost"] } } } } } }, 0],
          },
        },
      },
      {
        $addFields: {
          activeLeads: { $subtract: ["$totalLeads", { $add: ["$wonLeads", "$lostLeads"] }] },
          conversionRate: {
            $cond: [{ $eq: ["$totalLeads", 0] }, 0,
              { $round: [{ $multiply: [{ $divide: ["$wonLeads", "$totalLeads"] }, 100] }, 1] }],
          },
        },
      },
      { $sort: { totalValue: -1 } },
    ];

    const bdaMetrics = await Lead.aggregate(pipeline);

    const summary = bdaMetrics.reduce(
      (acc, bda) => {
        acc.totalLeads += bda.totalLeads;
        acc.totalValue += bda.totalValue;
        acc.totalWon   += bda.wonLeads;
        acc.totalActive += bda.activeLeads;
        return acc;
      },
      { totalLeads: 0, totalValue: 0, totalWon: 0, totalActive: 0 }
    );

    summary.overallConversionRate = summary.totalLeads > 0
      ? parseFloat(((summary.totalWon / summary.totalLeads) * 100).toFixed(1)) : 0;

    res.status(200).json({ success: true, data: { summary, byBDA: bdaMetrics } });
  } catch (error) {
    console.error("BDA Metrics Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching metrics." });
  }
};

export { createLead, getLeads, getLeadById, updateLead, updateLeadStage, deleteLead, getLeadMetricsByBDA };
