import React, { useEffect, useRef } from "react";

export default function EnhancedResult({ result, darkMode }) {
  const resultRef = useRef(null);

  useEffect(() => {
    // Scroll into view when result is displayed
    if (resultRef.current && result) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  if (!result || result.trim() === "") {
    return null;
  }

  return (
    <div 
      ref={resultRef}
      id="enhanced-result"
      className={`mt-6 p-6 rounded-lg border shadow-lg ${
        darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
      } transition-colors animate-fadeIn`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-bold ${
          darkMode ? "text-green-400" : "text-green-600"
        }`}>
          🌟 Enhanced Resume
        </h2>
        <span className={`text-xs px-2 py-1 rounded ${
          darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
        }`}>
          Ready to use
        </span>
      </div>
      <div className={`p-6 rounded-lg border max-h-[600px] overflow-y-auto ${
        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
      }`}>
        <div className={`whitespace-pre-wrap text-base leading-7 ${
          darkMode ? "text-gray-200" : "text-gray-800"
        }`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {result.split('\n').map((line, index, lines) => {
            const trimmedLine = line.trim();
            // Check if line is a bullet point
            const isBullet = /^[-•\*]\s/.test(trimmedLine);
            // Check if line is a header (all caps, or short line that's likely a section header)
            // Headers are usually short, all caps, or have specific patterns
            const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 2;
            const isShortHeader = trimmedLine.length < 60 && trimmedLine.length > 2 && 
                                 /^[A-Z]/.test(trimmedLine) && 
                                 (!trimmedLine.includes('.') || trimmedLine.split(' ').length <= 4) &&
                                 (index === 0 || lines[index - 1]?.trim() === ''); // Has empty line before it
            const isHeader = isAllCaps || (isShortHeader && trimmedLine.split(' ').length <= 6);
            
            if (trimmedLine === '') {
              return <div key={index} className="h-2" />;
            } else if (isHeader && !isBullet) {
              return (
                <div key={index} className={`font-bold text-lg mt-4 mb-2 ${
                  darkMode ? "text-indigo-300" : "text-indigo-700"
                }`}>
                  {trimmedLine}
                </div>
              );
            } else if (isBullet) {
              return (
                <div key={index} className="ml-4 mb-1 flex items-start">
                  <span className={`mr-2 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>•</span>
                  <span className="flex-1">{trimmedLine.replace(/^[-•\*]\s*/, '')}</span>
                </div>
              );
            } else {
              return (
                <div key={index} className="mb-2">
                  {line}
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
