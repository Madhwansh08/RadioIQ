import React, { useEffect, useState } from "react";

function getDeviceLabel(devicePath) {
  if (devicePath.includes("/gvfs/mtp:")) return "Android Device";
  if (devicePath.includes("/gvfs/afc:")) return "iPhone/iPad";
  if (devicePath.includes("/media/")) return "USB Drive";
  return devicePath;
}

function FolderTree({
  nodes,
  selectedFilePaths,
  setSelectedFilePaths,
  expandedPaths,
  setExpandedPaths,
  parentPath = ""
}) {
  if (!nodes || nodes.length === 0) return null;

  const handleFileClick = (file, event) => {
    event.preventDefault();
    const isMultiSelect = event.ctrlKey || event.metaKey;
    setSelectedFilePaths(prev => {
      const newSet = new Set(prev);
      if (isMultiSelect) {
        if (newSet.has(file.path)) {
          newSet.delete(file.path);
        } else {
          newSet.add(file.path);
        }
      } else {
        // Single select on click (no modifiers)
        if (newSet.size === 1 && newSet.has(file.path)) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(file.path);
        }
      }
      return newSet;
    });
  };

  const handleDirClick = (dirPath, event) => {
    event.preventDefault();
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dirPath)) {
        newSet.delete(dirPath);
      } else {
        newSet.add(dirPath);
      }
      return newSet;
    });
  };

  return (
    <ul className="ml-4">
      {nodes.map(node => {
        if (node.type === "directory") {
          const isOpen = expandedPaths.has(node.path);
          return (
            <li key={node.path}>
              <button
                className={
                  "font-semibold flex items-center focus:outline-none focus:ring-2 focus:ring-[#5c60c6] " +
                  "bg-transparent border-none p-0 cursor-pointer " +
                  "text-[#5c60c6] dark:text-[#fdfdfd] hover:underline"
                }
                onClick={e => handleDirClick(node.path, e)}
                tabIndex={0}
              >
                <span className="mr-1">{isOpen ? "📂" : "📁"}</span>
                {node.name}
              </button>
              {isOpen && node.children && (
                <FolderTree
                  nodes={node.children}
                  selectedFilePaths={selectedFilePaths}
                  setSelectedFilePaths={setSelectedFilePaths}
                  expandedPaths={expandedPaths}
                  setExpandedPaths={setExpandedPaths}
                  parentPath={node.path}
                />
              )}
            </li>
          );
        } else {
          // file
          return (
            <li key={node.path}>
              <button
                className={`text-left w-full px-2 py-1 rounded flex items-center
                  focus:outline-none focus:ring-2 focus:ring-[#5c60c6]
                  ${
                    selectedFilePaths.has(node.path)
                      ? "bg-[#5c60c6] text-white"
                      : "hover:bg-[#5c60c6] hover:text-white dark:hover:bg-[#5c60c6] dark:text-[#fdfdfd] text-[#030811]"
                  }
                `}
                tabIndex={0}
                onClick={(e) => handleFileClick(node, e)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") handleFileClick(node, e);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFilePaths.has(node.path)}
                  onChange={() => {}} // No-op: checkbox is controlled by button click
                  className="mr-2 accent-[#5c60c6] dark:accent-[#fdfdfd]"
                  tabIndex={-1}
                  readOnly
                />
                {node.name}
              </button>
            </li>
          );
        }
      })}
    </ul>
  );
}

export default function UsbFileModal({ open, onClose, onFileSelect }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track selected files as a set of paths for fast lookup
  const [selectedFilePaths, setSelectedFilePaths] = useState(new Set());
  // Track expanded folder paths
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setDevices([]);
    setSelectedFilePaths(new Set());
    setExpandedPaths(new Set());
    fetch("http://localhost:7000/api/usb-files")
      .then(res => res.json())
      .then(data => {
        setDevices(data.devices || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load devices: " + err.message);
        setLoading(false);
      });
  }, [open]);

  // Helper to flatten selected files for upload
  const allFiles = [];
  function collectFiles(nodes) {
    nodes.forEach(node => {
      if (node.type === "file" && selectedFilePaths.has(node.path)) {
        allFiles.push({ path: node.path, name: node.name });
      }
      if (node.type === "directory" && node.children) {
        collectFiles(node.children);
      }
    });
  }
  devices.forEach(device => collectFiles(device.tree || []));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`
          bg-white dark:bg-[#030811]
          p-0
          rounded-lg
          min-w-[400px]
          max-w-[95vw]
          border-2
          ${open ? "border-[#5c60c6] dark:border-[#5c60c6]" : ""}
          shadow-lg
          relative
        `}
        style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="p-6 pb-2 border-b border-[#eee] dark:border-[#222] flex-shrink-0">
          <button
            className="absolute top-2 right-2 text-[#5c60c6] dark:text-[#fdfdfd] focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
            onClick={onClose}
          >
            &times;
          </button>
          <h3 className="text-lg font-bold mb-2 dark:text-[#fdfdfd] text-[#030811]">
            Select file(s) from USB device
          </h3>
        </div>
        {/* Scrollable Content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-2 custom-scrollbar"
          style={{ maxHeight: "calc(80vh - 124px)" }} // 124px = header + footer approx
        >
          {loading && <div className="text-[#030811] dark:text-[#fdfdfd]">Loading USB devices...</div>}
          {error && (
            <div className="text-red-600 dark:text-red-300 mb-2">
              {error}
            </div>
          )}
          {!loading && !error && devices.length === 0 && (
            <div className="text-[#030811] dark:text-[#fdfdfd]">No USB devices detected. Please insert a USB device.</div>
          )}
          {!loading && !error && devices.map((device, idx) => (
            <div key={device.device} className="mb-4">
              <div className="font-semibold mb-2 dark:text-[#fdfdfd] text-[#030811]">
                Device: {getDeviceLabel(device.device)}
                <span className="block text-xs text-gray-400">{device.device}</span>
              </div>
              <FolderTree
                nodes={device.tree || []}
                selectedFilePaths={selectedFilePaths}
                setSelectedFilePaths={setSelectedFilePaths}
                expandedPaths={expandedPaths}
                setExpandedPaths={setExpandedPaths}
              />
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[#eee] dark:border-[#222] flex-shrink-0 bg-white dark:bg-[#030811]">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-[#030811] dark:text-[#fdfdfd] hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#4750b3] ${
              allFiles.length > 0
                ? "bg-[#5c60c6] hover:bg-[#4750b3]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={() => {
              if (allFiles.length > 0) {
                onFileSelect(allFiles);
                onClose();
              }
            }}
            disabled={allFiles.length === 0}
          >
            Upload Selected
          </button>
        </div>
      </div>
    </div>
  );
}