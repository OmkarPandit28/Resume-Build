const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");
const upload  = require("../middleware/upload");
const { Resume } = require("../config/models");
const { validateEmail } = require("../middleware/validateRequest");

/**
 * POST /api/resume/draft
 * Accepts multipart/form-data (handled by multer).
 * All array fields (education, experience, skills, etc.) are sent as
 * JSON-stringified strings from the frontend FormData.
 */
router.post("/draft", upload.single("photo"), async (req, res) => {
  try {
    const body = req.body;

    // Debug log to see what arrived
    console.log("Draft POST body keys:", Object.keys(body));
    console.log("studentEmail:", body.studentEmail);
    console.log("fullName:", body.fullName);
    console.log("email:", body.email);
    console.log("file:", req.file ? req.file.filename : "none");

    const { studentEmail, fullName, email } = body;

    if (!studentEmail || !fullName || !email) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields. Got: studentEmail=${studentEmail}, fullName=${fullName}, email=${email}`
      });
    }

    if (!validateEmail(studentEmail) || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format provided."
      });
    }

    // Safely parse JSON array strings from FormData
    const parseArr = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    const data = {
      studentEmail:   studentEmail.toLowerCase().trim(),
      fullName:       fullName.trim(),
      email:          email.trim(),
      phone:          body.phone     || "",
      address:        body.address   || "",
      linkedIn:       body.linkedIn  || "",
      github:         body.github    || "",
      website:        body.website   || "",
      objective:      body.objective || "",
      education:      parseArr(body.education),
      experience:     parseArr(body.experience),
      skills:         parseArr(body.skills),
      languages:      parseArr(body.languages),
      certifications: parseArr(body.certifications),
      achievements:   parseArr(body.achievements),
      photoData:      "",
      photoFile:      ""
    };

    // Handle uploaded photo file
    if (req.file) {
      // Remove old photo if student already had a draft
      const existing = await Resume.findOne({
        studentEmail: data.studentEmail,
        paymentStatus: "pending"
      });
      if (existing && existing.photoFile) {
        const oldPath = path.join(__dirname, "../uploads/photos", existing.photoFile);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (_) {}
      }
      // Store filename only — PDF generator reads from disk at generation time
      data.photoFile = req.file.filename;
      // Don't store base64 in MongoDB — it can exceed the 16MB document limit
    }

    // Upsert: one pending draft per student
    let resume = await Resume.findOne({
      studentEmail: data.studentEmail,
      paymentStatus: "pending"
    });

    if (resume) {
      Object.assign(resume, data);
      await resume.save();
      console.log("Draft updated:", resume._id.toString());
    } else {
      resume = await Resume.create(data);
      console.log("Draft created:", resume._id.toString());
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const photoUrl   = resume.photoFile
      ? `${backendUrl}/photos/${resume.photoFile}`
      : null;

    res.json({
      success:  true,
      resumeId: resume._id.toString(),
      photoUrl,
      message:  "Draft saved successfully."
    });

  } catch (err) {
    console.error("Draft save error:", err);
    res.status(500).json({
      success: false,
      error:   "Failed to save draft.",
      detail:  err.message
    });
  }
});

// GET /api/resume/draft/:email
router.get("/draft/:email", async (req, res) => {
  try {
    const draft = await Resume.findOne({
      studentEmail:  req.params.email.toLowerCase(),
      paymentStatus: "pending"
    });
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const photoUrl   = draft?.photoFile
      ? `${backendUrl}/photos/${draft.photoFile}`
      : null;
    res.json({ success: true, draft, photoUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/resume/paid/:email
router.get("/paid/:email", async (req, res) => {
  try {
    const resumes = await Resume.find({
      studentEmail:  req.params.email.toLowerCase(),
      paymentStatus: "paid"
    }).sort({ paidAt: -1 });

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const result = resumes.map(r => ({
      ...r.toObject(),
      photoUrl:   r.photoFile ? `${backendUrl}/photos/${r.photoFile}` : null,
      pdfFullUrl: r.pdfUrl    ? `${backendUrl}${r.pdfUrl}` : null
    }));
    res.json({ success: true, resumes: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
