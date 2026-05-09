# InternHub – Resume Builder Feature (v2)

A complete, production-ready resume creation system with:
- **5-step form** (Personal Info + Photo → Education → Experience → Skills/Languages/Certs/Achievements → Verify & Pay)
- **Photo upload** (JPEG/PNG/WebP, circular crop in PDF)
- **OTP email verification** (6-digit boxes, countdown timer, resend, paste support)
- **Razorpay payment** (₹50 + 18% GST = ₹59)
- **Server-side OTP gate** (payment API blocked if OTP not verified)
- **HMAC-SHA256 signature verification** for Razorpay
- **pdfkit PDF generation** (professional 2-column layout with photo)
- **Nodemailer invoice email** (HTML email with PDF download link)
- **MongoDB storage** (OTP TTL, resume draft + paid records)

---

## 📂 Project Structure

```
internhub-resume/
├── backend/
│   ├── server.js                  ← Express app entry point
│   ├── .env.example               ← Copy to .env and fill in
│   ├── config/
│   │   └── models.js              ← OTP + Resume Mongoose schemas
│   ├── middleware/
│   │   └── upload.js              ← Multer config (photo upload, 5MB max)
│   ├── routes/
│   │   ├── otp.js                 ← POST /api/otp/send  &  /verify
│   │   ├── resume.js              ← POST /api/resume/draft  |  GET draft + paid
│   │   └── payment.js             ← POST /api/payment/create-order  &  /verify
│   ├── utils/
│   │   ├── otpService.js          ← Generate, email, verify OTP (6-digit)
│   │   ├── pdfGenerator.js        ← pdfkit 2-column resume with circular photo
│   │   └── mailer.js              ← HTML invoice email via Nodemailer
│   └── uploads/                   ← Auto-created: PDFs + photos stored here
│       └── photos/
└── frontend/
    ├── public/index.html           ← Loads Razorpay checkout.js + Google Fonts
    ├── .env.example
    └── src/
        ├── App.js                  ← Router
        ├── index.js
        ├── styles/global.css       ← Full design system (tokens, components)
        ├── utils/api.js            ← All API calls (axios)
        ├── components/
        │   ├── Navbar.js / .css
        │   ├── PersonalInfo.js     ← Step 1: photo upload + personal fields
        │   ├── Education.js        ← Step 2: dynamic education entries
        │   ├── Experience.js       ← Step 3: dynamic experience entries
        │   ├── SkillsMore.js       ← Step 4: tag-based skills/languages/certs
        │   ├── VerifyPay.js        ← Step 5: OTP boxes + Razorpay
        │   └── SuccessScreen.js    ← Invoice + PDF download
        └── pages/
            └── ResumeBuilder.js    ← Orchestrates all 5 steps + draft save
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# → Open .env and fill in your Razorpay keys, SMTP creds, MongoDB URI

# Frontend
cd ../frontend
npm install
cp .env.example .env
# → Set REACT_APP_RAZORPAY_KEY_ID to your Razorpay test key
```

### 2. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath /data/db

# OR use MongoDB Atlas — paste connection string in MONGO_URI
```

### 3. Run

```bash
# Terminal 1 – Backend
cd backend && npm run dev
# → http://localhost:5001

# Terminal 2 – Frontend
cd frontend && npm start
# → http://localhost:3000
```

---

## 🔄 Complete User Flow

```
1.  Student opens Resume Builder (/resume)
2.  Step 1: Fills personal info + uploads photo (drag & drop or click)
3.  Step 2: Adds education entries (institution, degree, year, CGPA)
4.  Step 3: Adds experience (company, role, duration, bullet descriptions)
5.  Step 4: Adds skills, languages, certifications, achievements (tag input)
6.  Click "Save & Continue" → FormData POSTed to /api/resume/draft
    → Photo saved to /uploads/photos/ as file + base64 embedded in DB
    → Draft saved with paymentStatus: "pending"
7.  Step 5: Click "Send OTP to my Email"
    → POST /api/otp/send → 6-digit OTP emailed via Nodemailer
8.  Student enters OTP in 6 individual digit boxes
    → POST /api/otp/verify → checks DB, marks verified:true
9.  Payment panel unlocks
10. Click "Pay ₹59 via Razorpay"
    → POST /api/payment/create-order (blocked if OTP not verified)
    → Razorpay checkout popup opens
11. Student completes payment (test card: 4111 1111 1111 1111)
12. Razorpay calls handler with order_id + payment_id + signature
    → POST /api/payment/verify
    → HMAC-SHA256 verified
    → pdfkit generates 2-column PDF with circular photo
    → PDF saved to /uploads/resumes_{email}_{ts}.pdf
    → Resume DB updated: paymentStatus:"paid", pdfUrl stored
    → HTML invoice email sent via Nodemailer
13. Frontend shows Success screen with invoice table + PDF download link
```

---

## ⚙️ Environment Variables

### Backend `.env`

```env
PORT=5001
NODE_ENV=development
BACKEND_URL=http://localhost:5001

MONGO_URI=mongodb://localhost:27017/internhub_resume

RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx     ← Gmail App Password (not regular password)
SMTP_FROM=InternHub <youremail@gmail.com>

FRONTEND_URL=http://localhost:3000
OTP_EXPIRY_MINUTES=10
RESUME_FEE_PAISE=5000
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
```

---

## 🔑 Gmail App Password Setup

1. Go to → https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Search for **"App passwords"**
4. Select app: **Mail** → device: **Other** → name: `internhub`
5. Copy the 16-character password → paste as `SMTP_PASS`

---

## 💳 Razorpay Test Credentials

| Field   | Value                  |
|---------|------------------------|
| Card    | 4111 1111 1111 1111    |
| Expiry  | Any future date        |
| CVV     | Any 3 digits           |
| OTP     | 1234                   |

Get test API keys: https://dashboard.razorpay.com → Settings → API Keys → Generate Test Key

---

## 📄 PDF Resume Layout

The generated PDF uses a professional **2-column layout**:

- **Left sidebar** (dark navy `#1A3A5C`):
  - Circular photo (from upload)
  - Full name + tagline
  - Contact details (email, phone, address, LinkedIn, GitHub, website)
  - Skills
  - Languages

- **Main area** (light `#FAFAF8`):
  - Professional Summary
  - Education (with institution, degree, year, CGPA)
  - Work & Project Experience (with bullet points)
  - Certifications
  - Achievements & Awards
  - Footer with generation date

---

## 🔒 Security

- OTP gate is enforced **server-side** — payment API returns 403 if OTP not verified
- Razorpay signature verified with **HMAC-SHA256** before any PDF generation
- OTPs expire in 10 minutes (MongoDB TTL index auto-deletes expired docs)
- Max 5 OTP attempts before auto-delete
- Photo upload restricted to JPEG/PNG/WebP, max 5 MB (Multer)

---

## 📡 API Reference

| Method | Path                      | Auth Gate       | Description               |
|--------|---------------------------|-----------------|---------------------------|
| POST   | /api/otp/send             | —               | Send OTP to email         |
| POST   | /api/otp/verify           | —               | Verify OTP (marks verified)|
| POST   | /api/resume/draft         | —               | Save/update draft (FormData)|
| GET    | /api/resume/draft/:email  | —               | Get pending draft         |
| GET    | /api/resume/paid/:email   | —               | Get paid resumes          |
| POST   | /api/payment/create-order | OTP verified ✅  | Create Razorpay order     |
| POST   | /api/payment/verify       | Razorpay sig ✅  | Verify + generate PDF     |
| GET    | /api/payment/fee          | —               | Get current fee info      |
| GET    | /resumes/:filename        | —               | Download PDF              |
| GET    | /photos/:filename         | —               | View uploaded photo       |
