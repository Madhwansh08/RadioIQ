import React, { useEffect, useState } from "react";

export default function PdfModal({ open, onClose, pdfUrl, title = "Document" }) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    // Listen for class changes on html element
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (!open) return null;

  // Theme-based styles
  const overlayStyle = isDark
    ? { backgroundColor: "rgba(10, 10, 30, 0.90)" }
    : { backgroundColor: "rgba(0, 0, 0, 0.6)" };
  const modalStyle = isDark
    ? { backgroundColor: "#030811", color: "#fdfdfd" }
    : { backgroundColor: "#fff", color: "#030811" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={overlayStyle}
    >
      <div
        className="rounded-lg shadow-xl max-w-4xl w-full relative p-4 flex flex-col"
        style={modalStyle}
      >
        <button
          className="absolute top-2 right-2 text-xl text-[#5c60c6] dark:text-[#fdfdfd] hover:text-red-500 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <iframe
          src={pdfUrl}
          title={title}
          className="flex-1 min-h-[90vh] min-w-[60vh] rounded border"
          style={{
            borderColor: isDark ? "#222" : "#eee",
            background: isDark ? "#222" : "#fff"
          }}
        />
      </div>
    </div>
  );
}