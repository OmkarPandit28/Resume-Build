import React, { useRef, useState } from "react";

export default function PersonalInfo({ data, onChange, onPhotoChange, photoPreview }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const set = (k) => (e) => onChange({ ...data, [k]: e.target.value });

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/i)) {
      alert("Please upload a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB.");
      return;
    }
    onPhotoChange(file);
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);
  const onDrop        = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  return (
    <div>
      <h3 className="section-head">Personal Information</h3>

      {/* Photo upload */}
      <div className="field-group">
        <label className="field-label">Profile Photo</label>
        <div
          className={`photo-zone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onInputChange}
            style={{ display: "none" }}
          />
          {photoPreview ? (
            <>
              <img src={photoPreview} alt="Preview" className="photo-preview" />
              <p style={{ fontSize: 13, color: "var(--text2)", margin: 0 }}>
                Click or drag to change photo
              </p>
            </>
          ) : (
            <>
              <div className="photo-placeholder">📷</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", margin: "0 0 4px" }}>
                Upload your photo
              </p>
              <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>
                JPEG, PNG or WebP · max 5 MB · Click or drag &amp; drop
              </p>
            </>
          )}
        </div>
      </div>

      {/* Name + Email */}
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Full Name <span style={{ color: "var(--red)" }}>*</span></label>
          <input className="field-input" value={data.fullName} onChange={set("fullName")} placeholder="Rahul Sharma" />
        </div>
        <div className="field-group">
          <label className="field-label">Email Address <span style={{ color: "var(--red)" }}>*</span></label>
          <input className="field-input" type="email" value={data.email} onChange={set("email")} placeholder="rahul@example.com" />
        </div>
      </div>

      {/* Phone + Address */}
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Phone Number</label>
          <input className="field-input" value={data.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
        </div>
        <div className="field-group">
          <label className="field-label">Address / Location</label>
          <input className="field-input" value={data.address} onChange={set("address")} placeholder="Pune, Maharashtra, India" />
        </div>
      </div>

      {/* LinkedIn + GitHub */}
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">LinkedIn URL</label>
          <input className="field-input" value={data.linkedIn} onChange={set("linkedIn")} placeholder="linkedin.com/in/rahulsharma" />
        </div>
        <div className="field-group">
          <label className="field-label">GitHub URL</label>
          <input className="field-input" value={data.github} onChange={set("github")} placeholder="github.com/rahulsharma" />
        </div>
      </div>

      {/* Website */}
      <div className="field-group">
        <label className="field-label">Personal Website / Portfolio</label>
        <input className="field-input" value={data.website} onChange={set("website")} placeholder="https://rahulsharma.dev" />
      </div>

      {/* Objective */}
      <div className="field-group">
        <label className="field-label">Professional Objective / Summary</label>
        <textarea
          className="field-input field-textarea"
          value={data.objective}
          onChange={set("objective")}
          placeholder="A motivated Computer Science student seeking a software development internship to apply skills in React, Node.js, and system design. Passionate about building user-centric products..."
          rows={5}
        />
        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
          {data.objective.length}/500 characters
        </p>
      </div>
    </div>
  );
}
