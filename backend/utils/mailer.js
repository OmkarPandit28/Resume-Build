const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || "587"),
    secure: false,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function inr(paise) {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

async function sendInvoiceEmail({ to, name, invoiceId, paymentId, amount, gst, total, pdfUrl, plan }) {
  const transporter = createTransporter();
  const date        = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const backendUrl  = process.env.BACKEND_URL || "http://localhost:5000";
  const fullPdfUrl  = pdfUrl.startsWith("http") ? pdfUrl : `${backendUrl}${pdfUrl}`;

  const rows = [
    ["Invoice ID",    invoiceId],
    ["Payment ID",    paymentId],
    ["Service",       "Professional Resume Creation"],
    ["Plan",          plan || "Premium"],
    ["Base Amount",   inr(amount)],
    ["GST (18%)",     inr(gst)],
    ["Total Charged", inr(total)],
    ["Date",          date],
    ["Status",        "PAID ✅"]
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
        style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A3A5C 0%,#185FA5 100%);padding:32px 40px;text-align:center;">
            <div>
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1D9E75;margin-right:8px;vertical-align:middle;"></span>
              <span style="color:#FFFFFF;font-size:22px;font-weight:700;vertical-align:middle;">InternHub</span>
            </div>
            <p style="color:#B5D4F4;font-size:13px;margin:8px 0 0;">Resume Creation · Payment Invoice</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <!-- Success badge -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <div style="display:inline-block;background:#E1F5EE;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:28px;">✓</div>
                <h2 style="color:#0C447C;font-size:20px;font-weight:700;margin:12px 0 4px;">Your Resume is Ready!</h2>
                <p style="color:#6B6B66;font-size:14px;margin:0;">Hi ${name}, your professional resume has been generated and is attached to your InternHub profile.</p>
              </td></tr>
            </table>

            <!-- Invoice table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F8F7F2;border-radius:12px;overflow:hidden;margin-bottom:28px;border:1px solid #E4E3DD;">
              <tr>
                <td colspan="2" style="padding:12px 18px;background:#F0EFEA;border-bottom:1px solid #E4E3DD;">
                  <span style="font-size:11px;font-weight:700;color:#9B9B96;text-transform:uppercase;letter-spacing:1px;">Invoice Details</span>
                </td>
              </tr>
              ${rows.map(([k, v], i) => `
              <tr style="background:${i % 2 === 0 ? "#FFFFFF" : "#F8F7F2"};">
                <td style="padding:10px 18px;font-size:13px;color:#6B6B66;border-bottom:1px solid #F0EFEA;">${k}</td>
                <td style="padding:10px 18px;font-size:13px;color:#1A1A18;font-weight:600;text-align:right;border-bottom:1px solid #F0EFEA;">${v}</td>
              </tr>`).join("")}
            </table>

            <!-- Download CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="${fullPdfUrl}"
                  style="display:inline-block;background:#185FA5;color:#FFFFFF;font-size:15px;font-weight:700;
                    padding:14px 36px;border-radius:10px;text-decoration:none;">
                  📄 Download Your Resume PDF
                </a>
              </td></tr>
            </table>

            <p style="font-size:13px;color:#9B9B96;text-align:center;line-height:1.6;margin:0;">
              Your resume is saved to your profile and will be auto-attached to internship applications.<br>
              Keep this email for your records.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F7F2;border-top:1px solid #E4E3DD;padding:18px 40px;text-align:center;">
            <p style="font-size:12px;color:#AEADA8;margin:0;">
              InternHub © ${new Date().getFullYear()} &nbsp;·&nbsp; Payment secured by Razorpay &nbsp;·&nbsp; 256-bit SSL
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from:    process.env.SMTP_FROM || "InternHub <noreply@internhub.com>",
    to,
    subject: `Invoice #${invoiceId} – Your InternHub Resume is Ready! 🎉`,
    html,
    text:    `Hi ${name}, your resume has been created.\nInvoice: ${invoiceId}\nPayment: ${paymentId}\nTotal: ${inr(total)}\nDownload: ${fullPdfUrl}`
  });

  return info;
}

module.exports = { sendInvoiceEmail };
