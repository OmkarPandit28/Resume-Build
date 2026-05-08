require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const path     = require("path");
const fs       = require("fs");

const app = express();

// ── Ensure upload directories exist ──────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
const photosDir  = path.join(__dirname, "uploads", "photos");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(photosDir))  fs.mkdirSync(photosDir,  { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// ── Body parsers ──────────────────────────────────────────────────────────────
// IMPORTANT: express body parsers must NOT run for multipart/form-data.
// Multer handles multipart — running both causes the body to be consumed/corrupted.
app.use((req, res, next) => {
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("multipart/form-data")) {
    return next(); // skip — multer will handle this
  }
  express.json({ limit: "10mb" })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
  });
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use("/resumes", express.static(uploadsDir));
app.use("/photos",  express.static(photosDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/otp",     require("./routes/otp"));
app.use("/api/resume",  require("./routes/resume"));
app.use("/api/payment", require("./routes/payment"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Global error:", err.message);
  res.status(500).json({ success: false, error: err.message });
});

// ── MongoDB + listen ──────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/internhub_resume")
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB failed:", err.message);
    process.exit(1);
  });

module.exports = app;
