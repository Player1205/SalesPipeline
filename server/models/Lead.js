import mongoose from "mongoose";

// Pipeline stages in the exact order a manufacturing lead travels through
export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
];

// Industry verticals relevant to manufacturing sales
export const INDUSTRIES = [
  "Automotive",
  "Aerospace",
  "Electronics",
  "Heavy Machinery",
  "Chemicals",
  "Food & Beverage",
  "Textiles",
  "Construction Materials",
  "Medical Devices",
  "Other",
];

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Note text is required."],
      trim: true,
      maxlength: [2000, "A note cannot exceed 2000 characters."],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters."],
    },

    contactPerson: {
      type: String,
      required: [true, "Contact person name is required."],
      trim: true,
      maxlength: [100, "Contact person name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Contact email is required."],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid contact email.",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Contract / deal value in USD (or local currency, documented in .env)
    value: {
      type: Number,
      required: [true, "Lead value is required."],
      min: [0, "Lead value cannot be negative."],
    },

    status: {
      type: String,
      enum: {
        values: LEAD_STATUSES,
        message: `Status must be one of: ${LEAD_STATUSES.join(", ")}.`,
      },
      default: "New",
    },

    industry: {
      type: String,
      enum: {
        values: INDUSTRIES,
        message: `Industry must be one of the predefined categories.`,
      },
      default: "Other",
    },

    // The BDA responsible for this lead
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A lead must be assigned to a BDA."],
    },

    // Tracks the date when status last changed — useful for stale-lead reporting
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },

    // Embedded notes array so conversation history is stored on the lead document
    notes: [noteSchema],

    // Optional: expected close date for the deal
    expectedCloseDate: {
      type: Date,
      default: null,
    },

    source: {
      type: String,
      enum: ["Referral", "Cold Outreach", "Inbound", "Exhibition", "Online", "Other"],
      default: "Other",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ─── Index for fast querying by status and assignee (Kanban & filters) ────────

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });

// ─── Pre-save hook: update statusChangedAt whenever status changes ────────────

leadSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusChangedAt = new Date();
  }
  next();
});

// ─── Virtual: days since the lead's status last changed (staleness indicator) ─

leadSchema.virtual("daysInCurrentStage").get(function () {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((Date.now() - this.statusChangedAt) / msPerDay);
});

leadSchema.set("toJSON", { virtuals: true });
leadSchema.set("toObject", { virtuals: true });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
