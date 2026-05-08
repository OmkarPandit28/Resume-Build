const express  = require("express");
const router   = express.Router();
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const { Resume }          = require("../config/models");
const { isOTPVerified }   = require("../utils/otpService");
const { generateResumePDF } = require("../utils/pdfGenerator");
const { sendInvoiceEmail }  = require("../utils/mailer");
const { paymentLimiter } = require("../middleware/rateLimiter");
const { validateEmail } = require("../middleware/validateRequest");

const RESUME_FEE = parseInt(process.env.RESUME_FEE_PAISE || "5000"); // ₹50
const GST_RATE   = 0.18;

function razorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

function invoiceId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-RES-${ts}-${rand}`;
}

/**
 * POST /api/payment/create-order
 * Guards: OTP must be verified for this email.
 * Body: { email, resumeId }
 */
router.post("/create-order", paymentLimiter, async (req, res) => {
  try {
    const { email, resumeId } = req.body;
    if (!validateEmail(email) || !resumeId) {
      return res.status(400).json({ success: false, error: "email and resumeId are required." });
    }

    // ── Guard: OTP verified? ─────────────────────────────────────────────────
    const verified = await isOTPVerified(email.toLowerCase());
    if (!verified) {
      return res.status(403).json({
        success: false,
        error:   "OTP_NOT_VERIFIED",
        message: "Please verify your email OTP before making a payment."
      });
    }

    // ── Guard: resume exists ─────────────────────────────────────────────────
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, error: "Resume draft not found." });
    }
    if (resume.paymentStatus === "paid") {
      return res.status(400).json({ success: false, error: "This resume has already been paid for." });
    }

    // ── Create Razorpay order ────────────────────────────────────────────────
    const gst   = Math.round(RESUME_FEE * GST_RATE);
    const total = RESUME_FEE + gst;

   const order = await razorpay().orders.create({
  amount: total,
  currency: "INR",
  receipt: `res_${Date.now()}`,
  notes: {
    service: "resume_creation",
    resumeId: resumeId.toString(),
    email
  }
});

    resume.razorpayOrderId = order.id;
    await resume.save();

    res.json({
      success:    true,
      orderId:    order.id,
      amount:     total,
      baseAmount: RESUME_FEE,
      gst,
      currency:   "INR",
      keyId:      process.env.RAZORPAY_KEY_ID,
      resumeId:   resumeId.toString()
    });
  } catch (err) {
    console.error("Create order error:", JSON.stringify(err, null, 2));
    res.status(500).json({ success: false, error: "Failed to create payment order.", detail: err.message });
  }
});

/**
 * POST /api/payment/verify
 * Verifies Razorpay HMAC signature → generates PDF → sends invoice email.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, resumeId }
 */
router.post("/verify", paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      resumeId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !resumeId) {
      return res.status(400).json({ success: false, error: "Missing required payment verification fields." });
    }

    // ── HMAC-SHA256 signature verification ───────────────────────────────────
    const body        = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected    = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error:   "Invalid payment signature. Payment could not be verified."
      });
    }

    // ── Fetch resume ─────────────────────────────────────────────────────────
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, error: "Resume not found." });
    }

    // ── Generate PDF ─────────────────────────────────────────────────────────
    const { filename, pdfUrl } = await generateResumePDF(resume.toObject());

    // ── Persist payment info ─────────────────────────────────────────────────
    const invId = invoiceId();
    const gst   = Math.round(RESUME_FEE * GST_RATE);
    const total = RESUME_FEE + gst;
    const now   = new Date();

    resume.razorpayPaymentId = razorpay_payment_id;
    resume.razorpaySignature = razorpay_signature;
    resume.paymentStatus     = "paid";
    resume.paidAt            = now;
    resume.invoiceId         = invId;
    resume.pdfFilename       = filename;
    resume.pdfUrl            = pdfUrl;
    await resume.save();

    // ── Send invoice email ───────────────────────────────────────────────────
    let emailSent = false;
    try {
      await sendInvoiceEmail({
        to:        resume.email,
        name:      resume.fullName,
        invoiceId: invId,
        paymentId: razorpay_payment_id,
        amount:    RESUME_FEE,
        gst,
        total,
        pdfUrl,
        plan:      "Premium"
      });
      emailSent = true;
    } catch (mailErr) {
      console.error("Invoice email failed:", mailErr.message);
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

    res.json({
      success:   true,
      invoiceId: invId,
      paymentId: razorpay_payment_id,
      pdfUrl,
      pdfFullUrl: `${backendUrl}${pdfUrl}`,
      resumeId:  resume._id.toString(),
      emailSent,
      amount:    RESUME_FEE,
      gst,
      total,
      paidAt:    now
    });
  } catch (err) {
    console.error("Verify payment error:", err.message);
    res.status(500).json({ success: false, error: "Payment verification failed.", detail: err.message });
  }
});

/**
 * GET /api/payment/fee
 * Returns current resume fee details.
 */
router.get("/fee", (req, res) => {
  const gst   = Math.round(RESUME_FEE * GST_RATE);
  const total = RESUME_FEE + gst;
  res.json({ success: true, baseAmount: RESUME_FEE, gst, total, currency: "INR" });
});

module.exports = router;
