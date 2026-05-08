import React from "react";

const EMPTY = { institution: "", degree: "", year: "", grade: "" };

export default function Education({ items, onChange }) {
  const add    = () => onChange([...items, { ...EMPTY }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(items.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  return (
    <div>
      <h3 className="section-head">Education</h3>

      {items.map((edu, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-card-num">Education #{i + 1}</span>
            {items.length > 1 && (
              <button className="btn btn-danger btn-sm" onClick={() => remove(i)}>✕ Remove</button>
            )}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Institution / University <span style={{color:"var(--red)"}}>*</span></label>
              <input className="field-input" value={edu.institution} onChange={e => update(i, "institution", e.target.value)} placeholder="Savitribai Phule Pune University" />
            </div>
            <div className="field-group">
              <label className="field-label">Degree / Course <span style={{color:"var(--red)"}}>*</span></label>
              <input className="field-input" value={edu.degree} onChange={e => update(i, "degree", e.target.value)} placeholder="B.Tech – Computer Science & Engineering" />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Year / Duration</label>
              <input className="field-input" value={edu.year} onChange={e => update(i, "year", e.target.value)} placeholder="2021 – 2025" />
            </div>
            <div className="field-group">
              <label className="field-label">Grade / CGPA / Percentage</label>
              <input className="field-input" value={edu.grade} onChange={e => update(i, "grade", e.target.value)} placeholder="8.7 / 10  or  85%" />
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-outline btn-sm" onClick={add}>
        + Add Another Education
      </button>

      {items.length === 0 && (
        <div className="alert alert-warning" style={{ marginTop: 12 }}>
          Please add at least one education entry.
        </div>
      )}
    </div>
  );
}
