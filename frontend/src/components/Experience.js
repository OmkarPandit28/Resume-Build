import React from "react";

const EMPTY = { company: "", role: "", duration: "", description: "" };

export default function Experience({ items, onChange }) {
  const add    = () => onChange([...items, { ...EMPTY }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(items.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  return (
    <div>
      <h3 className="section-head">Work &amp; Project Experience</h3>

      <div className="alert alert-info" style={{ marginBottom: 18 }}>
        Include internships, part-time jobs, freelance work, open-source contributions, or significant academic projects.
      </div>

      {items.map((exp, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-card-num">Experience #{i + 1}</span>
            {items.length > 1 && (
              <button className="btn btn-danger btn-sm" onClick={() => remove(i)}>✕ Remove</button>
            )}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Company / Organisation</label>
              <input className="field-input" value={exp.company} onChange={e => update(i, "company", e.target.value)} placeholder="Razorpay / Startup / Personal Project" />
            </div>
            <div className="field-group">
              <label className="field-label">Role / Position</label>
              <input className="field-input" value={exp.role} onChange={e => update(i, "role", e.target.value)} placeholder="Frontend Development Intern" />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Duration</label>
            <input className="field-input" value={exp.duration} onChange={e => update(i, "duration", e.target.value)} placeholder="June 2024 – August 2024  (3 months)" />
          </div>

          <div className="field-group">
            <label className="field-label">Key Responsibilities &amp; Achievements</label>
            <textarea
              className="field-input field-textarea"
              value={exp.description}
              onChange={e => update(i, "description", e.target.value)}
              placeholder={"Built real-time dashboard using React and Chart.js\nReduced API response time by 35% through caching\nCollaborated with cross-functional team of 8 engineers"}
              rows={4}
            />
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
              One point per line — each line becomes a bullet on the resume
            </p>
          </div>
        </div>
      ))}

      <button className="btn btn-outline btn-sm" onClick={add}>
        + Add Another Experience
      </button>
    </div>
  );
}
