import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import PDFDocument from "pdfkit";
import axios from "axios";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// setup multer
// ensure uploads folder exists (helps prevent multer ENOENT errors)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// History file path - user-specific
const getHistoryPath = (userId) => {
  const historyDir = path.join(process.cwd(), "history");
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  return path.join(historyDir, userId ? `history_${userId}.json` : "history.json");
};

// Helper function to read history for a user
const readHistory = (userId) => {
  try {
    const historyPath = getHistoryPath(userId);
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, "utf-8");
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error("Error reading history:", err);
    return [];
  }
};

// Helper function to write history for a user
const writeHistory = (userId, history) => {
  try {
    const historyPath = getHistoryPath(userId);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing history:", err);
  }
};

// Local enhancement fallback function
function localEnhance(text) {
  if (!text || typeof text !== 'string') return text || "";

  try {
    // Small dictionary of common typos / misspellings to correct locally
    const typoFixes = {
      '\\u007fwnat\\u007f': 'want',
      'wnat': 'want',
      'develper': 'developer',
      'develp': 'develop',
      'front end': 'frontend',
      'front-end': 'frontend',
      'fronted': 'frontend',
      'i ': 'I ',
      'I i': 'I',
      'js': 'JavaScript',
      'php': 'PHP'
    };

    // Normalize whitespace and split into paragraphs/lines
    let s = text.replace(/[\t\r]+/g, '\n').replace(/\u00A0/g, ' ');
    s = s.replace(/\s{2,}/g, ' ');

    // Apply simple typo fixes (word boundaries)
    Object.keys(typoFixes).forEach((k) => {
      const safeKey = k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp('\\b' + safeKey + '\\b', 'gi');
      s = s.replace(re, (m) => {
        // preserve case for single-letter 'i'
        if (m === 'i') return 'I';
        const replacement = typoFixes[k];
        // Preserve capitalization if needed
        if (/^[A-Z]/.test(m)) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        return replacement;
      });
    });

    // Sentence-case each sentence to improve capitalization
    const sentences = s
      .split(/(?<=[.!?])\s+/)
      .map((sent) => {
        const t = sent.trim();
        if (!t) return '';
        return t.charAt(0).toUpperCase() + t.slice(1);
      })
      .filter(Boolean)
      .join(' ');

    // Improve bullet formatting and small verb replacements
    const lines = sentences
      .split('\n')
      .map((line) => {
        let l = line.trim();
        if (!l) return '';

        // Convert asterisks or leading hyphens to a consistent dash
        if (/^[*-]\s*/.test(l)) {
          l = '- ' + l.replace(/^[*-]\s*/, '');
        }

        // Action verbs small map
        l = l
          .replace(/\bworked\b/gi, 'developed')
          .replace(/\bmade\b/gi, 'created')
          .replace(/\bdid\b/gi, 'executed')
          .replace(/\bgot\b/gi, 'achieved');

        return l;
      })
      .filter(Boolean)
      .join('\n');

    let enhanced = lines;

    // Add a simple header if missing
    if (!enhanced.toLowerCase().includes('resume') && !enhanced.toLowerCase().includes('curriculum')) {
      enhanced = 'RESUME\n\n' + enhanced;
    }

    return enhanced;
  } catch (err) {
    console.error('Local enhance error:', err);
    return text; // Return original text if enhancement fails
  }
}

// Normalize extracted PDF text to remove control characters, fix spacing, and preserve bullets
function normalizeExtractedText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  // Remove non-printable/control characters except newlines and tabs
  let s = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, '');
  // Replace multiple spaces with single space
  s = s.replace(/ /g, ' '); // replace NBSP
  s = s.replace(/[ ]{2,}/g, ' ');
  // Fix common ligature/encoding issues
  s = s.replace(/â/g, '-').replace(/â¢/g, '-').replace(/â|â/g, '"');
  // Convert page breaks to double newlines
  s = s.replace(/\f/g, '\n\n');
  // Normalize CRLF and CR to LF
  s = s.replace(/\r\n?/g, '\n');
  // Preserve paragraph structure - collapse multiple newlines to max 2
  s = s.replace(/\n{3,}/g, '\n\n');
  
  // Clean up each line while preserving structure
  const lines = s.split('\n');
  const cleanedLines = lines.map(line => {
    // Trim trailing spaces but preserve some structure
    let cleaned = line.replace(/[ \t]+$/g, '');
    // Collapse multiple spaces within a line to single space
    cleaned = cleaned.replace(/[ ]{2,}/g, ' ');
    return cleaned;
  });
  
  // Join lines back, preserving structure but removing excessive empty lines
  s = cleanedLines
    .map((line, idx) => {
      // Keep single empty lines for paragraph breaks
      if (!line.trim() && idx > 0 && cleanedLines[idx - 1]?.trim() && 
          idx < cleanedLines.length - 1 && cleanedLines[idx + 1]?.trim()) {
        return '';
      }
      // Remove empty lines at start/end
      if (!line.trim() && (idx === 0 || idx === cleanedLines.length - 1)) {
        return null;
      }
      return line;
    })
    .filter((line, idx, arr) => {
      // Remove consecutive empty lines, keep max 1 empty line
      if (!line?.trim() && idx > 0 && !arr[idx - 1]?.trim()) {
        return false;
      }
      return line !== null;
    })
    .join('\n');
  
  // Normalize bullets to consistent format
  s = s.replace(/^[•\u2022\*]\s*/gm, '- ');
  s = s.replace(/^[-]\s*/gm, '- ');
  
  // Final cleanup: remove leading/trailing whitespace but preserve line breaks
  return s.trim();
}

// ====== PDF UPLOAD ======
router.post("/upload", optionalAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const dataBuffer = fs.readFileSync(req.file.path);
    // Convert Buffer to Uint8Array (required by pdfjs-dist)
    const uint8Array = new Uint8Array(dataBuffer);
    
    try {
      // Use pdfjs-dist (ESM-compatible) to parse PDF
      const pdf = await getDocument({ data: uint8Array }).promise;
      let text = "";
      
      // Extract text from all pages while preserving structure
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        // Build text while preserving structure using transform matrix
        let pageText = "";
        let lastY = null;
        let lastXEnd = null;
        const lineHeight = 10; // Approximate line height threshold
        
        // Process items in order, using transform to detect line breaks
        for (const item of content.items) {
          if (!item.str || !item.str.trim()) continue;
          
          // Get position from transform matrix [a, b, c, d, tx, ty]
          // tx is X translation, ty is Y translation
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const currentY = transform[5] || 0;
          const currentX = transform[4] || 0;
          const itemWidth = item.width || 0;
          const currentXEnd = currentX + itemWidth;
          
          // Check if we're on a new line (significant Y change)
          if (lastY !== null && Math.abs(currentY - lastY) > lineHeight) {
            pageText += "\n";
            lastXEnd = null; // Reset X position for new line
          }
          // Check if we need a space (same line but X gap)
          else if (lastXEnd !== null && currentX - lastXEnd > 5 && 
                   Math.abs(currentY - (lastY || 0)) < lineHeight) {
            pageText += " ";
          }
          
          pageText += item.str;
          lastY = currentY;
          lastXEnd = currentXEnd;
        }
        
        text += pageText + "\n\n";
      }

      // Normalize extracted text
      const normalized = normalizeExtractedText(text);

      fs.unlinkSync(req.file.path); // delete temp file
      console.log("✅ PDF parsed successfully, extracted text length:", normalized.length);
      res.json({ text: normalized });
    } catch (pdfErr) {
      console.error("❌ PDF parsing error:", pdfErr.message);
      console.error("Stack:", pdfErr.stack);
      try { fs.unlinkSync(req.file.path); } catch(e) {}
      return res.status(500).json({ 
        error: 'Failed to parse PDF', 
        details: pdfErr?.message || "Could not extract text from PDF" 
      });
    }
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    console.error("Stack:", err.stack);
    try { fs.unlinkSync(req.file.path); } catch(e) {}
    res.status(500).json({ error: "Failed to parse PDF", details: err?.message || String(err) });
  }
});

// ====== ENHANCE RESUME ======
router.post("/enhance", optionalAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // Normalize incoming text before enhancement
    const cleanedText = normalizeExtractedText(text);

    const prompt = `Enhance this resume text to make it professional, ATS-friendly, and job-ready. Improve tone, use action verbs, and keep the meaning same. Return only the enhanced text.

Resume:
${text}`;

    let enhanced = "";

    // Verify localEnhance function exists (safety check)
    if (typeof localEnhance !== 'function') {
      console.error("localEnhance function is not defined!");
      throw new Error("Enhancement function not available");
    }

    // If neither Jules nor OpenAI keys are present, use localEnhance immediately
    if (!process.env.JULES_API_KEY && !process.env.OPENAI_API_KEY) {
      console.log("No API keys found, using local enhancement");
      enhanced = localEnhance(cleanedText);
    } else {
      // ==== Try Jules API (if key present) ====
      if (process.env.JULES_API_KEY) {
        try {
          console.log("Attempting Jules API enhancement...");
          // First create a session
          const sessionResponse = await axios.post(
            "https://jules.googleapis.com/v1alpha/sessions",
            {},
            {
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.JULES_API_KEY,
              },
            }
          );
          const sessionId = sessionResponse?.data?.sessionId || sessionResponse?.data?.name?.split("/").pop();
          
          if (sessionId) {
            // Send message to the session
            const messageResponse = await axios.post(
              `https://jules.googleapis.com/v1alpha/sessions/${sessionId}:sendMessage`,
              {
                message: {
                  role: "user",
                  content: prompt,
                },
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": process.env.JULES_API_KEY,
                },
              }
            );
            enhanced = messageResponse?.data?.response?.text || messageResponse?.data?.content || JSON.stringify(messageResponse.data);
          } else {
            // Fallback: try direct prompt if session creation format is different
            const julesResponse = await axios.post(
              "https://jules.googleapis.com/v1alpha/sessions",
              { prompt },
              {
                headers: {
                  "Content-Type": "application/json",
                  "X-Goog-Api-Key": process.env.JULES_API_KEY,
                },
              }
            );
            enhanced = julesResponse?.data?.output || julesResponse?.data?.text || JSON.stringify(julesResponse.data);
          }
          if (enhanced) {
            console.log("Jules API enhancement successful");
          }
        } catch (jerr) {
          console.warn("Jules API failed — falling back:", jerr.message);
          if (jerr.response) {
            console.warn("Jules API error response:", jerr.response.status, jerr.response.data);
          }
        }
      }

      // If still empty and OpenAI key is present, try OpenAI
      if (!enhanced && process.env.OPENAI_API_KEY) {
        try {
          console.log("Attempting OpenAI enhancement...");
          const openaiResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a professional resume writer. Rewrite the text to sound polished, confident, and ATS-friendly.",
                },
                { role: "user", content: text },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          enhanced = openaiResponse.data.choices?.[0]?.message?.content?.trim();
          if (enhanced) {
            console.log("OpenAI enhancement successful");
          }
        } catch (fallbackErr) {
          console.warn("OpenAI fallback failed:", fallbackErr.message);
        }
      }

      // final fallback to localEnhance
      if (!enhanced) {
        console.log("All API attempts failed, using local enhancement");
        enhanced = localEnhance(cleanedText);
      }
    }

    // Save to local history JSON (user-specific if authenticated)
    const userId = req.userId || "anonymous";
    const history = readHistory(userId);
    const historyEntry = {
      id: Date.now().toString(),
      userId: userId,
      originalText: cleanedText.substring(0, 500) + (cleanedText.length > 500 ? "..." : ""), // Preview
      enhancedText: enhanced.substring(0, 500) + (enhanced.length > 500 ? "..." : ""), // Preview
      fullOriginalText: cleanedText,
      fullEnhancedText: enhanced,
      createdAt: new Date().toISOString(),
    };
    history.unshift(historyEntry);
    // Keep only last 50 entries
    if (history.length > 50) history.splice(50);
    writeHistory(userId, history);

    res.json({ enhanced, historyId: historyEntry.id });
  } catch (err) {
    console.error("Enhance route error:", err);
    res.status(500).json({ error: "Enhancement failed", details: err?.message || String(err) });
  }
});

// ====== DOWNLOAD PDF ======
router.post("/download", async (req, res) => {
  try {
    const { enhancedText, filename } = req.body;
    if (!enhancedText)
      return res.status(400).json({ error: "No enhanced text provided" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${
          filename || "enhanced_resume"
        }.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    });

    doc.fontSize(16).text("Enhanced Resume", { align: "center" });
    doc.moveDown();

    const paragraphs = enhancedText.split("\n\n");
    doc.font("Times-Roman").fontSize(11);

    paragraphs.forEach((p) => {
      const lines = p.split("\n");
      lines.forEach((line) => {
        if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
          const clean = line.replace(/^[-*]\s?/, "");
          doc.text(`• ${clean}`, { indent: 10 });
        } else {
          doc.text(line);
        }
      });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error("Download PDF error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// ====== GET HISTORY ======
router.get("/history", optionalAuth, (req, res) => {
  try {
    const userId = req.userId || "anonymous";
    const history = readHistory(userId);
    res.json(history);
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// ====== GET HISTORY ITEM ======
router.get("/history/:id", optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || "anonymous";
    const history = readHistory(userId);
    const item = history.find((h) => h.id === id);
    if (!item) return res.status(404).json({ error: "History item not found" });
    res.json(item);
  } catch (err) {
    console.error("Get history item error:", err);
    res.status(500).json({ error: "Failed to get history item" });
  }
});

// ====== DELETE HISTORY ITEM ======
router.delete("/history/:id", optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || "anonymous";
    const history = readHistory(userId);
    const filtered = history.filter((h) => h.id !== id);
    writeHistory(userId, filtered);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete history item error:", err);
    res.status(500).json({ error: "Failed to delete history item" });
  }
});

// ====== CLEAR HISTORY ======
router.delete("/history", optionalAuth, (req, res) => {
  try {
    const userId = req.userId || "anonymous";
    writeHistory(userId, []);
    res.json({ success: true });
  } catch (err) {
    console.error("Clear history error:", err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

export default router;
