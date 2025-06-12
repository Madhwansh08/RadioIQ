import React, { useEffect, useState } from "react";
import config from "../utils/config";

// Utility for device label
function getDeviceLabel(devicePath) {
  if (devicePath.includes("/gvfs/mtp:")) return "Android Device";
  if (devicePath.includes("/gvfs/afc:")) return "iPhone/iPad";
  if (devicePath.includes("/media/")) return "USB Drive";
  return devicePath;
}

// Folder tree for directories only (for folder selection)
function FolderTree({
  nodes,
  selectedFolder,
  setSelectedFolder,
  expandedPaths,
  setExpandedPaths,
}) {
  if (!nodes || nodes.length === 0) return null;

  const handleDirClick = (dirPath, event) => {
    event.preventDefault();
    setExpandedPaths((prev) => {
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
      {nodes.map((node) => {
        if (node.type === "directory") {
          const isOpen = expandedPaths.has(node.path);
          return (
            <li key={node.path}>
              <button
                className={
                  "flex items-center font-semibold focus:outline-none focus:ring-2 focus:ring-[#5c60c6] " +
                  "bg-transparent border-none p-0 cursor-pointer " +
                  (selectedFolder === node.path
                    ? "underline text-[#5c60c6] dark:text-[#a591ff]"
                    : "text-[#5c60c6] dark:text-[#fdfdfd]") +
                  " hover:underline"
                }
                onClick={(e) => {
                  setSelectedFolder(node.path);
                  handleDirClick(node.path, e);
                }}
                tabIndex={0}
                style={{ background: "none" }}
                type="button"
              >
                <span className="mr-1">{isOpen ? "📂" : "📁"}</span>
                {node.name}
              </button>
              {isOpen && node.children && (
                <FolderTree
                  nodes={node.children}
                  selectedFolder={selectedFolder}
                  setSelectedFolder={setSelectedFolder}
                  expandedPaths={expandedPaths}
                  setExpandedPaths={setExpandedPaths}
                />
              )}
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

export default function UsbFolderPicker({ open, onClose, onSelectFolder }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [error, setError] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    function fetchDevices() {
      fetch(`${config.API_URL}/api/usb-files`)
        .then((res) => res.json())
        .then((data) => {
          setDevices(data.devices || []);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load devices: " + err.message);
          setLoading(false);
        });
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Reset selection and expansion when closed
  useEffect(() => {
    if (!open) {
      setSelectedFolder(null);
      setExpandedPaths(new Set());
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`
          bg-white dark:bg-[#030811]
          rounded-lg
          min-w-[400px] max-w-[95vw]
          border-2 border-[#5c60c6]
          shadow-lg
          relative
          flex flex-col
        `}
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="p-6 pb-2 border-b border-[#eee] dark:border-[#222] flex-shrink-0">
          <button
            className="absolute top-2 right-2 text-[#5c60c6] dark:text-[#fdfdfd] focus:outline-none focus:ring-2 focus:ring-[#5c60c6] text-2xl"
            onClick={onClose}
            aria-label="Close USB Folder Picker"
            type="button"
          >
            &times;
          </button>
          <h3 className="text-lg font-bold mb-2 dark:text-[#fdfdfd] text-[#030811]">
            Select folder on USB device
          </h3>
        </div>
        {/* Scrollable Content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-2 custom-scrollbar"
          style={{ maxHeight: "calc(80vh - 124px)" }}
        >
          {loading && (
            <div className="text-[#030811] dark:text-[#fdfdfd]">
              Loading USB devices...
            </div>
          )}
          {error && (
            <div className="text-red-600 dark:text-red-300 mb-2">
              {error}
            </div>
          )}
          {!loading && !error && devices.length === 0 && (
            <div className="text-[#030811] dark:text-[#fdfdfd]">
              No external USB detected. Please insert a USB drive.
            </div>
          )}
          {!loading &&
            !error &&
            devices.map((device) => (
              <div key={device.device} className="mb-4">
                <div className="font-semibold mb-2 dark:text-[#fdfdfd] text-[#030811]">
                  Device: {getDeviceLabel(device.device)}
                  <span className="block text-xs text-gray-400">
                    {device.device}
                  </span>
                </div>
                <FolderTree
                  nodes={device.tree || []}
                  selectedFolder={selectedFolder}
                  setSelectedFolder={setSelectedFolder}
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
            type="button"
          >
            Cancel
          </button>
          <button
            disabled={!selectedFolder}
            onClick={() => onSelectFolder(selectedFolder)}
            className={`px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#5c60c6] ${
              selectedFolder
                ? "bg-[#5c60c6] hover:bg-[#4750b3]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            type="button"
          >
            Save Here
          </button>
        </div>
      </div>
    </div>
  );
}