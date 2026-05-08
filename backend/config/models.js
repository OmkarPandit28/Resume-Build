const mongoose = require("mongoose");

// ─── OTP Model ────────────────────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true },
  otp:       { type: String, required: true },
  purpose:   { type: String, default: "resume_payment" },
  verified:  { type: Boolean, default: false },
  attempts:  { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-delete expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const OTP = mongoose.model("OTP", otpSchema);

// ─── Resume Model ─────────────────────────────────────────────────────────────
const educationSchema = new mongoose.Schema({
  institution: { type: String },
  degree:      { type: String },
  year:        { type: String },
  grade:       { type: String }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company:     { type: String },
  role:        { type: String },
  duration:    { type: String },
  description: { type: String }
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  // Owner
  studentEmail: { type: String, required: true, lowercase: true, trim: true },

  // Personal Info
  fullName:   { type: String, required: true },
  email:      { type: String, required: true },
  phone:      { type: String, default: "" },
  address:    { type: String, default: "" },
  linkedIn:   { type: String, default: "" },
  github:     { type: String, default: "" },
  website:    { type: String, default: "" },
  objective:  { type: String, default: "" },

  // Photo: stored as base64 data URI or filename
  photoData:  { type: String, default: "" },  // base64 data URI
  photoFile:  { type: String, default: "" },  // saved filename

  // Resume sections
  education:      [educationSchema],
  experience:     [experienceSchema],
  skills:         [String],
  languages:      [String],
  certifications: [String],
  achievements:   [String],

  // Payment
  paymentStatus:      { type: String, enum: ["pending", "paid"], default: "pending" },
  razorpayOrderId:    { type: String, default: "" },
  razorpayPaymentId:  { type: String, default: "" },
  razorpaySignature:  { type: String, default: "" },
  paidAt:            { type: Date },
  invoiceId:         { type: String, default: "" },

  // Generated PDF
  pdfFilename: { type: String, default: "" },
  pdfUrl:      { type: String, default: "" },

  // OTP
  otpVerified:   { type: Boolean, default: false },
  otpVerifiedAt: { type: Date }
}, { timestamps: true });

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = { OTP, Resume };
