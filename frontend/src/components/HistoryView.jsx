import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function HistoryView({ onSelectResume, darkMode, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/ai/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;
    
    try {
      await axios.delete(`${API}/api/ai/history/${id}`);
      setHistory(history.filter((h) => h.id !== id));
      // Clear selected item if it's the one being deleted
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err) {
      alert("Failed to delete resume");
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all history?")) return;
    
    try {
      await axios.delete(`${API}/api/ai/history`);
      setHistory([]);
      setSelectedId(null); // Clear selected item
    } catch (err) {
      alert("Failed to clear history");
      console.error(err);
    }
  };

  const handleDownloadPDF = (item) => {
    try {
      const doc = new jsPDF();
      const text = item.fullEnhancedText || item.enhancedText;
      
      if (!text) {
        alert("No enhanced text available to download");
        return;
      }
      
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
      const textLines = text.split('\n');
      
      textLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines (but add small spacing)
        if (!trimmedLine) {
          y += 4;
          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin + 5;
          }
          return;
        }
        
        // Check for headers
        const isHeader = trimmedLine.length < 60 && 
                        (trimmedLine === trimmedLine.toUpperCase() || 
                         (trimmedLine.split(' ').length <= 6 && /^[A-Z]/.test(trimmedLine)));
        
        if (isHeader && trimmedLine.length > 2) {
          // Format as header
          y += 6;
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
          y += 2;
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
            y += 1;
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
            y += 1;
          }
        }
        
        // Check if we need a new page before next line
        if (y > pageHeight - margin - 10 && index < textLines.length - 1) {
          doc.addPage();
          y = margin + 5;
        }
      });
      
      doc.save(`enhanced_resume_${item.id}.pdf`);
    } catch (err) {
      alert("❌ Failed to generate PDF: " + (err.message || "Unknown error"));
      console.error("PDF generation error:", err);
    }
  };

  const handleSelect = (item) => {
    setSelectedId(item.id);
    if (onSelectResume) {
      onSelectResume({
        original: item.fullOriginalText || item.originalText,
        enhanced: item.fullEnhancedText || item.enhancedText,
      });
    }
  };

  const selectedItem = history.find((h) => h.id === selectedId);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
        <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Loading history...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          📚 Resume History
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              darkMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          No history yet. Enhance a resume to see it here!
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedId === item.id
                  ? darkMode
                    ? "bg-indigo-900 border-2 border-indigo-500"
                    : "bg-indigo-50 border-2 border-indigo-500"
                  : darkMode
                  ? "bg-gray-700 hover:bg-gray-600 border border-gray-600"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className={`text-sm mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>
                    <strong>Original:</strong> {item.originalText}
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>
                    <strong>Enhanced:</strong> {item.enhancedText}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPDF(item);
                    }}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      darkMode
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    📥 PDF
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      darkMode
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className={`mt-6 p-6 rounded-lg border ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              📄 Selected Resume Details
            </h3>
            <button
              onClick={() => setSelectedId(null)}
              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              ✕ Close
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className={`text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Original:
              </h4>
              <pre className={`whitespace-pre-wrap text-sm p-4 rounded border ${
                darkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-white border-gray-300 text-gray-700"
              }`}>
                {selectedItem.fullOriginalText || selectedItem.originalText}
              </pre>
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-700"}`}>
                Enhanced:
              </h4>
              <pre className={`whitespace-pre-wrap text-sm p-4 rounded border ${
                darkMode ? "bg-gray-800 border-gray-600 text-gray-300" : "bg-white border-gray-300 text-gray-700"
              }`}>
                {selectedItem.fullEnhancedText || selectedItem.enhancedText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

