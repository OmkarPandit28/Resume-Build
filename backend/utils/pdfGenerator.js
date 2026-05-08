const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// DOCUMENT LAYOUT CONSTANTS
// ─────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─────────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────────
const PRIMARY = "#111111";
const SECONDARY = "#555555";
const ACCENT = "#000000";
const RULE = "#D1D5DB";
const LIGHT = "#6B7280";

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
// Create uploads directory if missing
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Draw section heading + divider line
function drawSection(doc, title, y) {
  doc
    .fillColor(ACCENT)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(title.toUpperCase(), MARGIN, y, { width: CONTENT_W });

  y = doc.y + 4;

  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_W, y)
    .strokeColor(RULE)
    .lineWidth(1)
    .stroke();

  return y + 10;
}

// Load photo from uploaded file or base64 fallback
function getPhotoBuffer(data) {
  if (data.photoFile) {
    const photoPath = path.join(__dirname, "../uploads/photos", data.photoFile);
    if (fs.existsSync(photoPath)) {
      return fs.readFileSync(photoPath);
    }
  }

  if (data.photoData && data.photoData.startsWith("data:image")) {
    const matches = data.photoData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      return Buffer.from(matches[2], "base64");
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// MAIN PDF GENERATOR
// ─────────────────────────────────────────────
async function generateResumePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      // FILE SETUP
      const uploadsDir = path.join(__dirname, "../uploads");
      ensureDir(uploadsDir);

      const safeEmail = (data.studentEmail || "student").replace(/[@.]/g, "_");
      const filename = `resume_${safeEmail}_${Date.now()}.pdf`;
      const outputPath = path.join(uploadsDir, filename);
      const stream = fs.createWriteStream(outputPath);

      // PDF DOCUMENT INITIALIZATION
      const doc = new PDFDocument({
        size: [PAGE_W, PAGE_H],
        margin: 0,
        info: {
          Title: `${data.fullName || "Resume"} - Resume`,
          Author: data.fullName || "InternHub User",
          Subject: "Professional Resume",
          Creator: "InternHub Resume Builder"
        }
      });

      doc.pipe(stream);

      // HEADER + PERSONAL INFORMATION
      let y = MARGIN;
      // PHOTO SECTION
      const photoBuffer = getPhotoBuffer(data);
      const PHOTO_SIZE = 72;
      const PHOTO_X = PAGE_W - MARGIN - PHOTO_SIZE;
      const PHOTO_Y = MARGIN + 4;

      if (photoBuffer) {
        try {
          doc.save();
          doc.roundedRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, 10).clip();
          doc.image(photoBuffer, PHOTO_X, PHOTO_Y, {
            width: PHOTO_SIZE,
            height: PHOTO_SIZE
          });
          doc.restore();

          doc
            .roundedRect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE, 10)
            .lineWidth(1)
            .strokeColor(RULE)
            .stroke();
        } catch (_) {}
      }

      doc
        .fillColor(PRIMARY)
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(data.fullName || "Your Name", MARGIN, y, {
          width: CONTENT_W - 150
        });

      y = doc.y + 8;

      // CONTACT INFORMATION
      const contactInfo = [
        data.email,
        data.phone,
        data.linkedIn,
        data.github,
        data.website
      ].filter(Boolean).join("  |  ");

      if (contactInfo) {
        doc
          .fillColor(SECONDARY)
          .fontSize(9)
          .font("Helvetica")
          .text(contactInfo, MARGIN, y, {
            width: CONTENT_W - 150,
            lineGap: 2
          });

        y = Math.max(doc.y + 14, PHOTO_Y + PHOTO_SIZE + 18);
      }

      doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + CONTENT_W, y)
        .strokeColor(RULE)
        .lineWidth(1)
        .stroke();

      y += 22;

      // PROFESSIONAL SUMMARY
      if (data.objective) {
        y = drawSection(doc, "Professional Summary", y);
        doc
          .fillColor(PRIMARY)
          .fontSize(10)
          .font("Helvetica")
          .text(data.objective, MARGIN, y, {
            width: CONTENT_W,
            align: "justify",
            lineGap: 2
          });
        y = doc.y + 15;
      }

      // TECHNICAL SKILLS
      if (data.skills?.length) {
        y = drawSection(doc, "Technical Skills", y);
        doc
          .fillColor(PRIMARY)
          .fontSize(10)
          .font("Helvetica")
          .text(data.skills.join(" • "), MARGIN, y, {
            width: CONTENT_W
          });
        y = doc.y + 15;
      }

      // EXPERIENCE SECTION
      if (data.experience?.length) {
        y = drawSection(doc, "Experience", y);
        // Experience entries
        data.experience.forEach((exp) => {
          doc
            .fillColor(PRIMARY)
            .fontSize(10.5)
            .font("Helvetica-Bold")
            .text(
              `${exp.role || "Role"}${exp.company ? ` — ${exp.company}` : ""}`,
              MARGIN,
              y,
              { width: CONTENT_W }
            );

          if (exp.duration) {
            doc
              .fillColor(LIGHT)
              .fontSize(8.5)
              .font("Helvetica")
              .text(exp.duration, PAGE_W - MARGIN - 100, y, {
                width: 100,
                align: "right"
              });
          }

          y = doc.y + 4;

          if (exp.description) {
            exp.description
              .split("\n")
              .filter(Boolean)
              .forEach((line) => {
                const clean = line.replace(/^[•\-–]\s*/, "").trim();
                if (!clean) return;

                doc
                  .fillColor(SECONDARY)
                  .fontSize(9.5)
                  .font("Helvetica")
                  .text(`• ${clean}`, MARGIN + 10, y, {
                    width: CONTENT_W - 10,
                    lineGap: 2
                  });

                y = doc.y + 2;
              });
          }

          y += 10;
        });
      }

      // EDUCATION SECTION
      if (data.education?.length) {
        y = drawSection(doc, "Education", y);
        data.education.forEach((edu) => {
          doc
            .fillColor(PRIMARY)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(
              `${edu.degree || "Degree"}${edu.institution ? ` — ${edu.institution}` : ""}`,
              MARGIN,
              y,
              { width: CONTENT_W }
            );

          if (edu.year) {
            doc
              .fillColor(LIGHT)
              .fontSize(8.5)
              .font("Helvetica")
              .text(edu.year, PAGE_W - MARGIN - 80, y, {
                width: 80,
                align: "right"
              });
          }

          y = doc.y + 3;

          if (edu.grade) {
            doc
              .fillColor(LIGHT)
              .fontSize(9)
              .font("Helvetica")
              .text(`CGPA / Grade: ${edu.grade}`, MARGIN, y, {
                width: CONTENT_W
              });
            y = doc.y + 8;
          } else {
            y += 8;
          }
        });
      }

      // PROJECTS SECTION
      if (data.projects?.length) {
        y = drawSection(doc, "Projects", y);
        data.projects.forEach((project) => {
          doc
            .fillColor(PRIMARY)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(project.name || "Project", MARGIN, y, { width: CONTENT_W });
          y = doc.y + 3;
          if (project.description) {
            doc
              .fillColor(SECONDARY)
              .fontSize(9.5)
              .font("Helvetica")
              .text(project.description, MARGIN, y, {
                width: CONTENT_W,
                lineGap: 2
              });
            y = doc.y + 8;
          }
        });
      }

      // CERTIFICATIONS SECTION
      if (data.certifications?.length) {
        y = drawSection(doc, "Certifications", y);
        data.certifications.forEach((cert) => {
          doc
            .fillColor(SECONDARY)
            .fontSize(9.5)
            .font("Helvetica")
            .text(`• ${cert}`, MARGIN, y, { width: CONTENT_W });
          y = doc.y + 4;
        });
        y += 8;
      }

      // ACHIEVEMENTS SECTION
      if (data.achievements?.length) {
        y = drawSection(doc, "Achievements", y);
        data.achievements.forEach((achievement) => {
          doc
            .fillColor(SECONDARY)
            .fontSize(9.5)
            .font("Helvetica")
            .text(`• ${achievement}`, MARGIN, y, { width: CONTENT_W });
          y = doc.y + 4;
        });
      }

      // LANGUAGES SECTION
      if (data.languages?.length) {
        y = drawSection(doc, "Languages", y);
        doc
          .fillColor(SECONDARY)
          .fontSize(9.5)
          .font("Helvetica")
          .text(data.languages.join(" • "), MARGIN, y, {
            width: CONTENT_W
          });
      }

      // FINALIZE PDF
      doc.end();

      stream.on("finish", () => {
        resolve({
          filename,
          pdfUrl: `/resumes/${filename}`,
          outputPath
        });
      });

      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateResumePDF };
