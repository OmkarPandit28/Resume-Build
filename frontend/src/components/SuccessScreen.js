import React from "react";

function inr(paise) {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

export default function SuccessScreen({ data, onReset }) {
  const rows = [
    ["Invoice ID",    data.invoiceId],
    ["Payment ID",    data.paymentId],
    ["Service",       "Professional Resume Creation"],
    ["Plan",          "Premium"],
    ["Base Amount",   inr(data.amount)],
    ["GST (18%)",     inr(data.gst)],
    ["Total Charged", inr(data.total)],
    ["Invoice Email", data.emailSent ? "✅ Sent to your email" : "⚠ Failed (check spam)"],
    ["Date",          new Date(data.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })]
  ];

  const pdfUrl = data.pdfFullUrl || `http://localhost:5000${data.pdfUrl}`;

  return (
    <div className="success-wrap">
      <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>

        {/* Icon */}
        <div className="success-icon-wrap">✓</div>

        {/* Title */}
        <h2 style={{ marginBottom: 10 }}>Your Resume is Ready! 🎉</h2>
        <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>
          A professional PDF resume has been generated and saved to your InternHub profile.
          It will be auto-attached to your future internship applications.
        </p>

        {/* Download button */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg btn-full"
          style={{ marginBottom: 24, textDecoration: "none" }}
        >
          📄 Download Your Resume PDF
        </a>

        {/* Invoice table */}
        <div style={{
          background: "var(--surface2)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "16px 18px",
          marginBottom: 24,
          textAlign: "left"
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: 12
          }}>
            Invoice Details
          </div>
          <table className="invoice-grid">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="ig-key">{k}</td>
                  <td className="ig-val">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-outline btn-full" onClick={onReset}>
            Create Another Resume
          </button>
          <a
            href="http://localhost:3000/dashboard"
            className="btn btn-primary btn-full"
            style={{ textDecoration: "none" }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
