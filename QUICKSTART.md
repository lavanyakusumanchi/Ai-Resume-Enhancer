# Quick Start Guide - AI Resume Enhancer

## 🚀 Getting Started (5 minutes)

### Step 1: Start Backend Server
```powershell
cd C:\Users\lavan\OneDrive\Desktop\ai-resume-enhancer-jules\backend
npm start
```

✅ You should see: `✅ Server running on port 5000`

### Step 2: Start Frontend Server (New Terminal)
```powershell
cd C:\Users\lavan\OneDrive\Desktop\ai-resume-enhancer-jules\frontend
npm start
```


---

## 💼 How to Use (3 Steps)

### 1️⃣ Upload PDF or Paste Text
- Click **"Choose File"** and select your resume PDF, OR
- Copy/paste resume text directly into the textarea

### 2️⃣ Click "Enhance Resume"
- The app extracts text from PDF
- AI improves the text (better formatting, action verbs, professional tone)
- Shows enhanced result below

### 3️⃣ Click "Download PDF"
- Saves improved resume as a PDF file
- Ready to send to employers!

---

## 🔧 Configuration (Optional)

### Enable MongoDB Storage
Create `backend/.env` file:
```env
MONGO_URI=mongodb://localhost:27017/resume-enhancer
```

### Enable Google Jules API
Add to `backend/.env`:
```env
JULES_API_KEY=your_key_here
```

### Enable OpenAI Fallback
Add to `backend/.env`:
```env
OPENAI_API_KEY=your_key_here
```

**Note:** The app works great WITHOUT these keys using local enhancement!

---

## 📊 Data Storage

- **Default:** JSON file (`backend/history.json`) - automatically stores last 50 enhancements
- **Optional:** MongoDB - set `MONGO_URI` in `backend/.env`

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| **PDF upload fails** | Make sure it's a text-based PDF, not scanned image |
| **Port 5000 in use** | Restart the backend, it will use next available port |
| **Enhancement shows original text** | This is normal! Local enhancement is working. Set API keys for premium AI. |
| **No Download PDF button** | Enhancement must complete first. Wait for "✅ Resume enhanced!" message |

---

## 📝 What Gets Enhanced?

✅ Professional phrasing
✅ Action verb replacement (did → executed, made → created, etc.)
✅ Better formatting and bullets
✅ ATS-friendly structure
✅ Grammar & capitalization

---

## 🎯 Next Features to Add

- [ ] Multiple resume templates
- [ ] Scanned PDF (OCR) support
- [ ] Email export
- [ ] Word (.docx) download
- [ ] User accounts & cloud storage

---

**Questions?** Check the main README.md for full documentation!
