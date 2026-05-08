import React, { useState } from "react";

function TagInput({ label, hint, placeholder, items, onAdd, onRemove }) {
  const [val, setVal] = useState("");

  const add = () => {
    const v = val.trim();
    if (v && !items.includes(v)) onAdd(v);
    setVal("");
  };

  const onKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && val === "" && items.length > 0) {
      onRemove(items.length - 1);
    }
  };

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {hint && <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>{hint}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="field-input"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button className="btn btn-outline btn-sm" type="button" onClick={add}>Add</button>
      </div>
      {items.length > 0 && (
        <div className="tag-wrap">
          {items.map((item, idx) => (
            <span key={idx} className="tag-chip">
              {item}
              <button onClick={() => onRemove(idx)} title="Remove">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillsMore({ data, onChange }) {
  const update = (key) => (list) => onChange({ ...data, [key]: list });

  const addItem    = (key) => (val) => update(key)([...data[key], val]);
  const removeItem = (key) => (idx) => update(key)(data[key].filter((_, i) => i !== idx));

  return (
    <div>
      <h3 className="section-head">Skills, Languages &amp; More</h3>

      <TagInput
        label="Technical & Soft Skills"
        hint="Press Enter or click Add after each skill"
        placeholder="React, Node.js, Python, Communication…"
        items={data.skills}
        onAdd={addItem("skills")}
        onRemove={removeItem("skills")}
      />

      <TagInput
        label="Languages"
        placeholder="English, Hindi, Marathi, Tamil…"
        items={data.languages}
        onAdd={addItem("languages")}
        onRemove={removeItem("languages")}
      />

      <TagInput
        label="Certifications"
        hint="Include issuer if relevant, e.g. 'AWS Cloud Practitioner – Amazon'"
        placeholder="AWS Cloud Practitioner, Google Analytics…"
        items={data.certifications}
        onAdd={addItem("certifications")}
        onRemove={removeItem("certifications")}
      />

      <TagInput
        label="Achievements & Awards"
        placeholder="Smart India Hackathon Winner 2023, University Rank 1…"
        items={data.achievements}
        onAdd={addItem("achievements")}
        onRemove={removeItem("achievements")}
      />

      {data.skills.length === 0 && (
        <div className="alert alert-warning" style={{ marginTop: 8 }}>
          Add at least one skill — it's one of the most important resume sections!
        </div>
      )}
    </div>
  );
}
