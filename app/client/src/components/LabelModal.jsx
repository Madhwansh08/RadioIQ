import React, { useState } from "react";

const LabelModal = ({ isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState("");

  const handleSave = () => {
    onSave(label);
    setLabel("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold mb-4">Add Label to Annotation</h2>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border bg-white rounded p-2 w-full"
          placeholder="Enter label"
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-[#fdfdfd] px-4 py-2 rounded text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#5c60c6] hover:bg-[#030811]  px-4 py-2 rounded text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabelModal;
