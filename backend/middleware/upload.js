const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const photoDir = path.join(__dirname, "../uploads/photos");
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photoDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || ".jpg";
    const name = `photo_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const ALLOWED_MIMES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp"
];
const ALLOWED_EXTS = /\.(jpe?g|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  const extOk  = ALLOWED_EXTS.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIMES.includes(file.mimetype);
  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Use JPEG, PNG or WebP.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;
