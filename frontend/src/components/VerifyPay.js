import React, { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { otpSend, otpVerify, createOrder, verifyPayment } from "../utils/api";

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;
const EXPIRY_SEC   = 10 * 60; // 10 minutes

export default function VerifyPay({ personal, resumeId, onSuccess }) {
  // OTP state
  const [digits,      setDigits]      = useState(["", "", "", "", "", ""]);
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sending,     setSending]     = useState(false);
  const [verifying,   setVerifying]   = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  // Payment state
  const [paying,  setPaying]  = useState(false);

  const inputRefs = useRef([]);
  const timerRef  = useRef(null);

  // Countdown timer
  const startTimer = useCallback(() => {
    setCountdown(EXPIRY_SEC);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── OTP digit input handlers ────────────────────────────────────────────────
  const handleDigitChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpString = digits.join("");

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!personal.email) { toast.error("Email is missing."); return; }
    setSending(true);
    try {
      await otpSend(personal.email, personal.fullName);
      setOtpSent(true);
      setDigits(["", "", "", "", "", ""]);
      startTimer();
      toast.success(`✅ OTP sent to ${personal.email}`);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP. Check email config.");
    } finally {
      setSending(false);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otpString.length < 6) { toast.warn("Enter all 6 digits."); return; }
    setVerifying(true);
    try {
      await otpVerify(personal.email, otpString);
      setOtpVerified(true);
      clearInterval(timerRef.current);
      toast.success("🎉 Email verified! You can now complete payment.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP. Try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ── Razorpay payment ────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!otpVerified) { toast.warn("Please verify your OTP first."); return; }
    if (!resumeId)    { toast.error("Resume draft not saved. Please go back."); return; }

    setPaying(true);
    try {
      const { data: order } = await createOrder({ email: personal.email, resumeId });

      const options = {
        key:         RAZORPAY_KEY,
        amount:      order.amount,
        currency:    "INR",
        name:        "InternHub",
        description: "Professional Resume Creation – ₹50",
        order_id:    order.orderId,
        prefill: {
          name:    personal.fullName,
          email:   personal.email,
          contact: personal.phone || ""
        },
        theme: { color: "#185FA5" },
        handler: async (response) => {
          try {
            const { data: result } = await verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              resumeId
            });
            toast.success("🎉 Payment successful! Your resume is ready.");
            onSuccess(result);
          } catch (e) {
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to initiate payment.";
      toast.error(msg);
      setPaying(false);
    }
  };

  return (
    <div>
      <h3 className="section-head">Email Verification &amp; Payment</h3>

      {/* ── Step 1: OTP ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          background: "var(--surface2)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 24
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: otpVerified ? "var(--green)" : "var(--blue)",
              color: "#fff", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {otpVerified ? "✓" : "1"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Email OTP Verification</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                Verify <strong>{personal.email}</strong> before payment
              </div>
            </div>
          </div>

          {otpVerified ? (
            <div className="alert alert-success">
              ✅ Email verified successfully! You can now complete your payment below.
            </div>
          ) : (
            <>
              {/* Send OTP button */}
              {!otpSent ? (
                <button
                  className="btn btn-primary"
                  onClick={handleSendOTP}
                  disabled={sending}
                >
                  {sending ? <><span className="spinner" />Sending OTP…</> : "📧 Send OTP to my Email"}
                </button>
              ) : (
                <>
                  {/* OTP digit boxes */}
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>
                    Enter the 6-digit OTP sent to <strong>{personal.email}</strong>
                  </p>
                  <div className="otp-digits-wrap" onPaste={handlePaste}>
                    {digits.map((d, idx) => (
                      <input
                        key={idx}
                        ref={el => inputRefs.current[idx] = el}
                        className={`otp-digit${d ? " filled" : ""}${otpVerified ? " verified" : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleDigitKeyDown(idx, e)}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  {countdown > 0 && (
                    <p style={{ fontSize: 12, color: "var(--amber)", textAlign: "center", marginBottom: 12 }}>
                      ⏱ OTP expires in <strong>{fmtTime(countdown)}</strong>
                    </p>
                  )}
                  {countdown === 0 && (
                    <p style={{ fontSize: 12, color: "var(--red)", textAlign: "center", marginBottom: 12 }}>
                      OTP expired.
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-success"
                      onClick={handleVerifyOTP}
                      disabled={verifying || otpString.length < 6}
                    >
                      {verifying ? <><span className="spinner" />Verifying…</> : "✓ Verify OTP"}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleSendOTP}
                      disabled={sending || countdown > 540}
                    >
                      {sending ? "Sending…" : countdown > 0 ? `Resend in ${fmtTime(countdown)}` : "Resend OTP"}
                    </button>
                  </div>

                  <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>
                    💡 Tip: You can paste the OTP directly into the boxes
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Step 2: Payment ─────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--surface2)",
        border: `1.5px solid ${otpVerified ? "var(--green)" : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        padding: 24,
        opacity: otpVerified ? 1 : 0.55,
        transition: "opacity 0.3s, border-color 0.3s"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: otpVerified ? "var(--blue)" : "var(--text3)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            2
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Complete Payment</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              {otpVerified ? "Pay securely via Razorpay" : "Complete OTP verification first"}
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div style={{
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "16px 18px",
          marginBottom: 18
        }}>
          <table className="pay-table">
            <tbody>
              <tr>
                <td className="pay-label">Service</td>
                <td className="pay-value">Professional Resume Creation</td>
              </tr>
              <tr>
                <td className="pay-label">Feature tier</td>
                <td className="pay-value">
                  <span className="badge-premium" style={{ fontSize: 11 }}>⭐ Premium</span>
                </td>
              </tr>
              <tr>
                <td className="pay-label">Base fee</td>
                <td className="pay-value">₹50.00</td>
              </tr>
              <tr>
                <td className="pay-label">GST (18%)</td>
                <td className="pay-value">₹9.00</td>
              </tr>
              <tr className="pay-total">
                <td className="pay-label">Total</td>
                <td className="pay-value">₹59.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* What you get */}
        <div style={{ marginBottom: 18 }}>
          {[
            "✦ Professional 2-column PDF resume",
            "✦ Saved to your InternHub profile",
            "✦ Auto-attached to internship applications",
            "✦ Invoice emailed to " + personal.email
          ].map((item, i) => (
            <div key={i} style={{ fontSize: 13, color: "var(--text2)", padding: "3px 0" }}>{item}</div>
          ))}
        </div>

        {/* Pay button */}
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handlePayment}
          disabled={!otpVerified || paying}
        >
          {paying
            ? <><span className="spinner" />Processing Payment…</>
            : <>💳 Pay ₹59 via Razorpay</>
          }
        </button>

        <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>
          🔒 Secured by Razorpay · 256-bit SSL · No card data stored
        </p>

        {/* Test card hint */}
        <div style={{
          background: "var(--amber-lt)",
          border: "1px solid #FAC765",
          borderRadius: "var(--r)",
          padding: "10px 14px",
          marginTop: 12,
          fontSize: 12,
          color: "#5C380A"
        }}>
          🧪 <strong>Test mode:</strong> Use card <code style={{ fontFamily: "DM Mono, monospace" }}>4111 1111 1111 1111</code>, any future expiry, any CVV, OTP: <code>1234</code>
        </div>
      </div>
    </div>
  );
}
