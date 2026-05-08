import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { saveDraft } from "../utils/api";
import PersonalInfo  from "../components/PersonalInfo";
import Education     from "../components/Education";
import Experience    from "../components/Experience";
import SkillsMore    from "../components/SkillsMore";
import VerifyPay     from "../components/VerifyPay";
import SuccessScreen from "../components/SuccessScreen";
import "./ResumeBuilder.css";

const STEPS = [
  { label: "Personal Info", icon: "👤" },
  { label: "Education",     icon: "🎓" },
  { label: "Experience",    icon: "💼" },
  { label: "Skills & More", icon: "⚡" },
  { label: "Verify & Pay",  icon: "💳" }
];

const EMPTY_PERSONAL = {
  fullName: "", email: "", phone: "", address: "",
  linkedIn: "", github: "", website: "", objective: ""
};
const EMPTY_SKILLS = {
  skills: [], languages: [], certifications: [], achievements: []
};
const EMPTY_EDU = { institution: "", degree: "", year: "", grade: "" };
const EMPTY_EXP = { company: "", role: "", duration: "", description: "" };

// ── Replace with auth context / session in production ──────────────────────
const STUDENT_EMAIL = "test@example.com";

export default function ResumeBuilder() {
  const [step,         setStep]         = useState(0);
  const [saving,       setSaving]       = useState(false);
  const [resumeId,     setResumeId]     = useState(null);
  const [success,      setSuccess]      = useState(null);

  const [personal,     setPersonal]     = useState({ ...EMPTY_PERSONAL, email: STUDENT_EMAIL });
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [education,    setEducation]    = useState([{ ...EMPTY_EDU }]);
  const [experience,   setExperience]   = useState([{ ...EMPTY_EXP }]);
  const [skills,       setSkills]       = useState({ ...EMPTY_SKILLS });

  // ── Photo ───────────────────────────────────────────────────────────────────
  const handlePhotoChange = useCallback((file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Per-step validation ─────────────────────────────────────────────────────
  const validate = () => {
    if (step === 0) {
      if (!personal.fullName.trim())  { toast.error("Full name is required.");        return false; }
      if (!personal.email.trim())     { toast.error("Email address is required.");    return false; }
      if (!/\S+@\S+\.\S+/.test(personal.email)) { toast.error("Enter a valid email address."); return false; }
    }
    if (step === 1) {
      if (!education[0]?.institution.trim() || !education[0]?.degree.trim()) {
        toast.error("Please fill in the institution and degree for your first education entry.");
        return false;
      }
    }
    return true;
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // Build FormData — the only way to send a file + text fields together
      const fd = new FormData();

      // Required fields
      fd.append("studentEmail", STUDENT_EMAIL);
      fd.append("fullName",     personal.fullName.trim());
      fd.append("email",        personal.email.trim());

      // Optional personal fields
      fd.append("phone",     personal.phone     || "");
      fd.append("address",   personal.address   || "");
      fd.append("linkedIn",  personal.linkedIn  || "");
      fd.append("github",    personal.github    || "");
      fd.append("website",   personal.website   || "");
      fd.append("objective", personal.objective || "");

      // Photo file — only if user selected one
      if (photoFile instanceof File) {
        fd.append("photo", photoFile);
      }

      // Array fields must be sent as JSON strings in FormData
      // (FormData cannot send nested objects/arrays natively)
      fd.append("education",      JSON.stringify(education));
      fd.append("experience",     JSON.stringify(experience));
      fd.append("skills",         JSON.stringify(skills.skills));
      fd.append("languages",      JSON.stringify(skills.languages));
      fd.append("certifications", JSON.stringify(skills.certifications));
      fd.append("achievements",   JSON.stringify(skills.achievements));

      // Debug: log what we're sending
      console.log("Sending draft FormData fields:");
      for (const [k, v] of fd.entries()) {
        console.log(` ${k}:`, typeof v === "string" ? v.substring(0, 80) : v);
      }

      const { data } = await saveDraft(fd);
      setResumeId(data.resumeId);
      console.log("Draft saved, resumeId:", data.resumeId);
      return data.resumeId;

    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message || "Unknown error";
      console.error("handleSaveDraft error:", status, detail, err);
      toast.error(`Failed to save draft (${status || "network"}): ${detail}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ── Step navigation ─────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!validate()) return;

    // Save draft before entering the Verify & Pay step
    if (step === 3) {
      const id = await handleSaveDraft();
      if (!id) return; // don't advance if save failed
    }

    setStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setStep(0);
    setPersonal({ ...EMPTY_PERSONAL, email: STUDENT_EMAIL });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEducation([{ ...EMPTY_EDU }]);
    setExperience([{ ...EMPTY_EXP }]);
    setSkills({ ...EMPTY_SKILLS });
    setResumeId(null);
    setSuccess(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rb-page">
        <div className="container">
          <SuccessScreen data={success} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="rb-page">
      <div className="container">

        {/* Header */}
        <div className="rb-header">
          <div>
            <h1 className="rb-title">
              Resume Builder &nbsp;
              <span className="badge-premium">⭐ Premium</span>
            </h1>
            <p className="rb-subtitle">
              Build a professional resume in 5 easy steps. Auto-saved to your profile
              and attached to all your internship applications.
            </p>
          </div>
          <div className="rb-fee-box">
            <div className="fee-label">One-time fee</div>
            <div className="fee-amount">₹50 <span>+ GST</span></div>
            <div className="fee-total">Total ₹59</div>
          </div>
        </div>

        {/* Wizard steps */}
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`wizard-step${i < step ? " done" : i === step ? " active" : ""}`}
            >
              <div className="wizard-circle">{i < step ? "✓" : s.icon}</div>
              <div className="wizard-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card rb-card">

          {step === 0 && (
            <PersonalInfo
              data={personal}
              onChange={setPersonal}
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
            />
          )}
          {step === 1 && (
            <Education items={education} onChange={setEducation} />
          )}
          {step === 2 && (
            <Experience items={experience} onChange={setExperience} />
          )}
          {step === 3 && (
            <SkillsMore data={skills} onChange={setSkills} />
          )}
          {step === 4 && (
            <VerifyPay
              personal={personal}
              resumeId={resumeId}
              onSuccess={setSuccess}
            />
          )}

          {/* Navigation */}
          <div className="step-actions">
            {step > 0 && (
              <button className="btn btn-outline" onClick={handleBack} disabled={saving}>
                ← Back
              </button>
            )}
            {step < 4 && (
              <button className="btn btn-primary" onClick={handleNext} disabled={saving}>
                {saving
                  ? <><span className="spinner" /> Saving…</>
                  : step === 3
                    ? <>Save &amp; Continue →</>
                    : <>Next: {STEPS[step + 1].label} →</>
                }
              </button>
            )}
          </div>
        </div>

        <div className="rb-progress-hint">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </div>

      </div>
    </div>
  );
}
