const express = require("express");
const router  = express.Router();
const { createAndSendOTP, verifyOTP } = require("../utils/otpService");
const { otpLimiter } = require("../middleware/rateLimiter");
const { validateEmail } = require("../middleware/validateRequest");

/**
 * POST /api/otp/send
 * Body: { email, name }
 * Generates + emails a 6-digit OTP for resume payment verification.
 */
router.post("/send", otpLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: "Valid email is required." });
    }

    const { expiryMin, expiresAt } = await createAndSendOTP(
      email.toLowerCase().trim(),
      (name || "Student").trim()
    );

    res.json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${expiryMin} minutes.`,
      expiresAt,
      expiryMin
    });
  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP. Check your email configuration.",
      detail: err.message
    });
  }
});

/**
 * POST /api/otp/verify
 * Body: { email, otp }
 * Returns verified:true on success, allowing frontend to unlock payment.
 */
router.post("/verify", otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!validateEmail(email) || !otp) {
      return res.status(400).json({ success: false, error: "Email and OTP are required." });
    }

    const result = await verifyOTP(email.toLowerCase().trim(), otp.toString().trim());

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.reason });
    }

    res.json({ success: true, verified: true, message: "OTP verified. Proceed to payment." });
  } catch (err) {
    console.error("OTP verify error:", err.message);
    res.status(500).json({ success: false, error: "Verification failed.", detail: err.message });
  }
});

module.exports = router;
