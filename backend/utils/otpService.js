const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { OTP } = require("../config/models");

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,              // port 587
    requireTLS: true,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    tls: {
      rejectUnauthorized: false,
    },
  });
}

async function sendOTPEmail(email, otp, name, expiryMin) {
  const transporter = createTransporter();

  // verify SMTP connection first
  await transporter.verify();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <tr>
            <td style="background:linear-gradient(135deg,#1A3A5C 0%,#185FA5 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:10px;height:10px;border-radius:50%;background:#1D9E75;display:inline-block;"></div>
                <span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.5px;">InternHub</span>
              </div>
              <p style="color:#B5D4F4;font-size:13px;margin:8px 0 0;font-weight:400;">
                Resume Builder · Email Verification
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="font-size:16px;color:#1A1A18;margin:0 0 8px;font-weight:600;">
                Hi ${name} 👋
              </p>

              <p style="font-size:14px;color:#6B6B66;line-height:1.7;margin:0 0 32px;">
                You requested to create a professional resume on InternHub.
                Please verify your email with the OTP below before completing your ₹50 payment.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#F0F6FF;border:2px dashed #185FA5;border-radius:16px;padding:24px 48px;text-align:center;">
                      <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;font-weight:600;">
                        Your One-Time Password
                      </p>

                      <p style="font-size:44px;font-weight:800;color:#0C447C;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">
                        ${otp}
                      </p>

                      <p style="font-size:12px;color:#999;margin:12px 0 0;">
                        ⏱ Valid for <strong>${expiryMin} minutes</strong>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background:#FFFBF0;border:1px solid #FAC765;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                <p style="font-size:13px;color:#7B4F0A;margin:0;">
                  🔒 <strong>Do not share this OTP with anyone.</strong>
                  InternHub will never ask for your OTP.
                </p>
              </div>

              <p style="font-size:13px;color:#9B9B96;line-height:1.6;margin:0;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#F8F7F2;border-top:1px solid #E8E7E2;padding:20px 40px;text-align:center;">
              <p style="font-size:12px;color:#AEADA8;margin:0;">
                InternHub © ${new Date().getFullYear()} · Payments secured by Razorpay
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `InternHub <${process.env.SMTP_USER}>`,
    to: email,
    subject: `${otp} is your InternHub OTP — valid for ${expiryMin} min`,
    html,
    text: `Your InternHub Resume OTP is: ${otp}
Valid for ${expiryMin} minutes.
Do not share this with anyone.`,
  });

  return info;
}

async function createAndSendOTP(email, name = "Student") {
  const otp = generateOTP();
  const expiryMin = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");
  const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);

  await OTP.deleteMany({
    email: email.toLowerCase(),
    purpose: "resume_payment",
  });

  await OTP.create({
    email: email.toLowerCase(),
    otp,
    purpose: "resume_payment",
    expiresAt,
  });

  await sendOTPEmail(email, otp, name, expiryMin);

  return { expiryMin, expiresAt };
}

async function verifyOTP(email, otpInput) {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    purpose: "resume_payment",
    verified: false,
  });

  if (!record) {
    return {
      valid: false,
      reason: "No OTP found. Please request a new OTP.",
    };
  }

  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    return {
      valid: false,
      reason: "OTP has expired. Please request a new one.",
    };
  }

  record.attempts += 1;

  if (record.attempts > 5) {
    await record.deleteOne();
    return {
      valid: false,
      reason: "Too many failed attempts. Please request a new OTP.",
    };
  }

  if (record.otp !== otpInput.toString().trim()) {
    await record.save();

    const left = 5 - record.attempts;

    return {
      valid: false,
      reason: `Incorrect OTP. ${left} attempt(s) remaining.`,
    };
  }

  record.verified = true;
  await record.save();

  return { valid: true };
}

async function isOTPVerified(email) {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    purpose: "resume_payment",
    verified: true,
  });

  return !!record;
}

module.exports = {
  createAndSendOTP,
  verifyOTP,
  isOTPVerified,
};