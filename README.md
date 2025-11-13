# 🚀 AI Resume Enhancer (Jules Edition)

A full-stack web application that uses Google Jules API to enhance resumes, making them more professional, ATS-friendly, and job-ready. Upload or paste your resume, get AI-powered enhancements, and download the improved version as a PDF.

## ✨ Features

- 📄 **Upload PDF Resumes** - Upload and parse PDF resumes automatically
- 📝 **Paste Resume Text** - Manually paste or edit resume text
- 🤖 **AI Enhancement** - Uses Google Jules API (with OpenAI fallback) to enhance resume content
- 📥 **PDF Download** - Download enhanced resumes as PDFs (client-side generation)
- 📚 **History View** - View and manage previously enhanced resumes
- 🌙 **Dark/Light Mode** - Toggle between dark and light themes
- 💾 **Local Storage** - History saved in JSON file (MongoDB optional)
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## 🧠 Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **jsPDF** - Client-side PDF generation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Mongoose** - MongoDB ODM (optional)
- **Axios** - HTTP client for API calls

### AI Integration
- **Google Jules API** - Primary AI enhancement
- **OpenAI API** - Fallback option
- **Local Enhancement** - Basic enhancement if no API keys

## 📁 Project Structure

```
ai-resume-enhancer-jules/
├── backend/
│   ├── server.js              # Express server
│   ├── routes/
│   │   └── aiRoutes.js        # API routes
│   ├── models/
│   │   └── Resume.js          # MongoDB model (optional)
│   ├── utils/
│   │   ├── julesClient.js     # Jules API client
│   │   └── db.js              # Database connection
│   ├── uploads/               # Temporary file storage
│   ├── history.json           # Local history storage
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── components/
│   │   │   ├── ResumeUpload.jsx    # Upload & enhance component
│   │   │   ├── EnhancedResult.jsx  # Result display
│   │   │   └── HistoryView.jsx     # History component
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Global styles
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── postcss.config.js      # PostCSS configuration
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Google Jules API Key** (optional, for AI enhancement)
- **OpenAI API Key** (optional, as fallback)
- **MongoDB** (optional, for database storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-resume-enhancer-jules
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000

# AI API Keys (at least one recommended)
JULES_API_KEY=your_jules_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB (optional)
MONGO_URI=mongodb://localhost:27017/resume-enhancer
```

**Note**: If no API keys are provided, the app will use a basic local enhancement function.

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # or for development with auto-reload
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   # or
   npm run dev
   ```
   Frontend will run on `http://localhost:5173` (or similar Vite port)

3. **Open in Browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## 🎯 Usage

1. **Upload or Paste Resume**
   - Click "Upload PDF Resume" to upload a PDF file, or
   - Paste your resume text in the textarea

2. **Enhance Resume**
   - Click "🚀 Enhance Resume" button
   - Wait for AI to process your resume
   - View the enhanced version below

3. **Download PDF**
   - Click "📥 Download PDF" to download the enhanced resume as PDF

4. **View History**
   - Switch to "📚 History" tab to view all previously enhanced resumes
   - Click on any history item to view details
   - Download or delete individual items

5. **Toggle Theme**
   - Click the "🌙 Dark Mode" / "☀️ Light Mode" button in the header

## 🔌 API Endpoints

### Backend API Routes

- `POST /api/ai/upload` - Upload and parse PDF file
  - Body: `multipart/form-data` with `file` field
  - Response: `{ text, resumeId }`

- `POST /api/ai/enhance` - Enhance resume text
  - Body: `{ text, resumeId? }`
  - Response: `{ enhanced, historyId }`

- `POST /api/ai/download` - Download enhanced resume as PDF (server-side)
  - Body: `{ enhancedText, filename? }`
  - Response: PDF file

- `GET /api/ai/history` - Get all history items
  - Response: `Array<HistoryItem>`

- `GET /api/ai/history/:id` - Get specific history item
  - Response: `HistoryItem`

- `DELETE /api/ai/history/:id` - Delete history item
  - Response: `{ success: true }`

- `DELETE /api/ai/history` - Clear all history
  - Response: `{ success: true }`

## 🧰 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## 🚀 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. **Set Environment Variables**
   - `JULES_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `MONGO_URI` (optional)
   - `PORT` (usually set automatically)

2. **Deploy**
   - Connect your repository
   - Set build command: `npm install`
   - Set start command: `node server.js`

### Frontend Deployment (Vercel/Netlify)

1. **Set Environment Variables**
   - `VITE_BACKEND_URL` - Your backend API URL

2. **Deploy**
   - Connect your repository
   - Set build command: `npm run build`
   - Set output directory: `dist`

### MongoDB Atlas (Optional)

1. Create a MongoDB Atlas account
2. Create a cluster
3. Get connection string
4. Add `MONGO_URI` to environment variables

## 🔧 Configuration

### Frontend Configuration

Update `frontend/src/components/ResumeUpload.jsx`:
```javascript
const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
```

### Backend Configuration

Update `backend/server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

## 📝 Notes

- **PDF Parsing**: Uses `pdf-parse` library. Large PDFs may take time to process.
- **History Storage**: By default, history is stored in `backend/history.json`. Limited to 50 entries.
- **API Keys**: At least one AI API key is recommended for best results. Without keys, basic local enhancement is used.
- **File Upload**: Maximum file size is 10MB.
- **Dark Mode**: Theme preference is saved in browser localStorage.

## 🐛 Troubleshooting

### Backend Issues

- **Port already in use**: Change `PORT` in `.env` file
- **PDF parsing fails**: Ensure `pdf-parse` is installed correctly
- **API errors**: Check API keys in `.env` file

### Frontend Issues

- **CORS errors**: Ensure backend CORS is enabled
- **API connection fails**: Check `VITE_BACKEND_URL` environment variable
- **PDF download fails**: Ensure `jspdf` is installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Google Jules API for AI enhancement
- OpenAI for fallback API support
- All the open-source libraries used in this project

## 📧 Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using React, Node.js, and Google Jules API**
