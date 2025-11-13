import React, { useState, useEffect } from "react";
import axios from "axios";
import EnhancedResult from "./EnhancedResult";
import jsPDF from "jspdf";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ResumeUpload({ darkMode, onEnhanceComplete }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState("");
  const [enhanced, setEnhanced] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [recentHistory, setRecentHistory] = useState([]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    const form = new FormData();
    form.append("file", f);
    setLoading(true);

    axios
      .post(`${API}/api/ai/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setParsed(res.data.text || "");
        setText(res.data.text || "");
      })
      .catch((err) => {
        const serverMsg = err?.response?.data?.details || err?.response?.data?.error;
        alert(`Failed to upload/parse PDF${serverMsg ? ": " + serverMsg : ""}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const loadRecentHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/ai/history`);
      const history = res.data || [];
      // Get most recent 3 items
      setRecentHistory(history.slice(0, 3));
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleEnhance = async () => {
    if (!text) return alert("Please paste text or upload a PDF first.");
    setLoading(true);
    setEnhanced(""); // Clear previous result
    try {
      const res = await axios.post(`${API}/api/ai/enhance`, { text });
      const enhancedText = res.data.enhanced || "No improvement available. Please try again.";
      
      if (!enhancedText || enhancedText.trim() === "") {
        throw new Error("Enhanced text is empty");
      }
      
      setEnhanced(enhancedText);
      
      // Scroll to result after a short delay
      setTimeout(() => {
        const resultElement = document.getElementById('enhanced-result');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
      // Load recent history to show below
      loadRecentHistory();
      
      // Notify parent component to refresh history
      if (onEnhanceComplete) {
        onEnhanceComplete();
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.details || err?.response?.data?.error;
      alert(`❌ Enhancement failed${serverMsg ? ": " + serverMsg : ""}`);
      console.error("Enhancement error:", err);
      setEnhanced(""); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load history on component mount
    loadRecentHistory();
  }, []);

  const handleDownloadPDF = () => {
    if (!enhanced) return alert("No enhanced text to download");
    
    try {
      const doc = new jsPDF();
      const pdfText = enhanced;
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin + 5;
      
      // Add title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const titleWidth = doc.getTextWidth("Enhanced Resume");
      doc.text("Enhanced Resume", (pageWidth - titleWidth) / 2, y);
      y += 12;
      
      // Add a line
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      // Process text line by line with proper formatting
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const textLines = pdfText.split('\n');
      
      textLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines (but add small spacing)
        if (!trimmedLine) {
          y += 4;
          // Check if we need a new page
          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin + 5;
          }
          return;
        }
        
        // Check for headers (all caps or short lines)
        const isHeader = trimmedLine.length < 60 && 
                        (trimmedLine === trimmedLine.toUpperCase() || 
                         (trimmedLine.split(' ').length <= 6 && /^[A-Z]/.test(trimmedLine)));
        
        if (isHeader && trimmedLine.length > 2) {
          // Format as header
          y += 6; // Space before header
          if (y > pageHeight - margin - 15) {
            doc.addPage();
            y = margin + 5;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          const headerLines = doc.splitTextToSize(trimmedLine, maxWidth);
          headerLines.forEach((headerLine) => {
            if (y > pageHeight - margin - 10) {
              doc.addPage();
              y = margin + 5;
            }
            doc.text(headerLine, margin, y);
            y += 8;
          });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          y += 2; // Space after header
        } else {
          // Format as regular text or bullet
          const isBullet = /^[-•\*]\s/.test(trimmedLine);
          
          if (isBullet) {
            // Format as bullet point
            const bulletText = trimmedLine.replace(/^[-•\*]\s*/, '');
            const bulletLines = doc.splitTextToSize(bulletText, maxWidth - 10);
            bulletLines.forEach((bulletLine, lineIndex) => {
              if (y > pageHeight - margin - 10) {
                doc.addPage();
                y = margin + 5;
              }
              if (lineIndex === 0) {
                doc.text('•', margin + 2, y);
                doc.text(bulletLine, margin + 8, y);
              } else {
                doc.text(bulletLine, margin + 8, y);
              }
              y += 6;
            });
            y += 1; // Small space after bullet
          } else {
            // Regular text
            const regularLines = doc.splitTextToSize(trimmedLine, maxWidth);
            regularLines.forEach((regularLine) => {
              if (y > pageHeight - margin - 10) {
                doc.addPage();
                y = margin + 5;
              }
              doc.text(regularLine, margin, y);
              y += 6;
            });
            y += 1; // Small space after paragraph
          }
        }
        
        // Check if we need a new page before next line
        if (y > pageHeight - margin - 10 && index < textLines.length - 1) {
          doc.addPage();
          y = margin + 5;
        }
      });
      
      // Save PDF
      const filename = fileName 
        ? `enhanced_${fileName.replace(/\.[^/.]+$/, "")}.pdf` 
        : "enhanced_resume.pdf";
      doc.save(filename);
    } catch (err) {
      alert("❌ Failed to generate PDF: " + (err.message || "Unknown error"));
      console.error("PDF generation error:", err);
    }
  };

  const handleLoadFromHistory = (item) => {
    setText(item.fullOriginalText || item.originalText);
    setEnhanced(item.fullEnhancedText || item.enhancedText);
    setParsed(item.fullOriginalText || item.originalText);
    // Scroll to top to show loaded content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`w-full max-w-4xl ${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-2xl shadow-lg transition-colors`}>
      <h1 className={`text-3xl font-bold text-center mb-6 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
        ✨ AI Resume Enhancer (Jules Edition)
      </h1>

      <div className="mb-6">
        <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          📄 Upload PDF Resume
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className={`mb-3 px-4 py-2 rounded-lg border ${
            darkMode
              ? "bg-gray-700 text-gray-300 border-gray-600"
              : "bg-white text-gray-900 border-gray-300"
          } cursor-pointer`}
        />
      </div>

      {parsed && (
        <div className={`mb-4 p-4 rounded-lg border ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
        }`}>
          <strong className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            📋 Parsed text preview:
          </strong>
          <div className={`text-sm mt-2 whitespace-pre-wrap ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            {parsed.substring(0, 300)}{parsed.length > 300 ? "..." : ""}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className={`block mb-2 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          📝 Or Paste Resume Text Here
        </label>
        <textarea
          className={`w-full p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 ${
            darkMode
              ? "bg-gray-700 text-gray-300 border-gray-600 placeholder-gray-500"
              : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
          }`}
          rows="10"
          placeholder="Paste or edit your resume text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleEnhance}
          disabled={loading || !text}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
            loading || !text
              ? darkMode
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              : darkMode
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {loading ? "✨ Enhancing..." : "🚀 Enhance Resume"}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={!enhanced}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            !enhanced
              ? darkMode
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              : darkMode
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          📥 Download PDF
        </button>
      </div>

      {loading && (
        <div className={`text-center py-4 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>
          <div className="animate-pulse">✨ Please wait — AI is enhancing your resume...</div>
        </div>
      )}

      {enhanced && !loading && (
        <div className={`mb-4 p-4 rounded-lg ${
          darkMode ? "bg-green-900 border border-green-700" : "bg-green-50 border border-green-200"
        }`}>
          <p className={`text-center font-semibold ${darkMode ? "text-green-300" : "text-green-700"}`}>
            ✅ Resume enhanced successfully!
          </p>
        </div>
      )}

      {enhanced && (
        <div id="enhanced-result">
          <EnhancedResult result={enhanced} darkMode={darkMode} />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setText(enhanced);
                setEnhanced("");
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              📝 Use Enhanced Text
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(enhanced);
                alert("Enhanced text copied to clipboard!");
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Recent History Section */}
      {recentHistory.length > 0 && (
        <div className={`mt-8 pt-6 border-t ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <h2 className={`text-xl font-bold mb-4 ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            📚 Recent History
          </h2>
          <div className="space-y-3">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
                onClick={() => handleLoadFromHistory(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-xs mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <p className={`text-sm mb-1 line-clamp-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      <strong className={darkMode ? "text-gray-200" : "text-gray-800"}>
                        Original:
                      </strong>{" "}
                      {item.fullOriginalText?.substring(0, 150) || item.originalText || "N/A"}
                      {(item.fullOriginalText && item.fullOriginalText.length > 150) || 
                       (item.originalText && item.originalText.length > 150) ? "..." : ""}
                    </p>
                    <p className={`text-sm line-clamp-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      <strong className={darkMode ? "text-gray-300" : "text-gray-700"}>
                        Enhanced:
                      </strong>{" "}
                      {item.fullEnhancedText?.substring(0, 150) || item.enhancedText || "N/A"}
                      {(item.fullEnhancedText && item.fullEnhancedText.length > 150) || 
                       (item.enhancedText && item.enhancedText.length > 150) ? "..." : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadFromHistory(item);
                    }}
                    className={`ml-4 px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      darkMode
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
