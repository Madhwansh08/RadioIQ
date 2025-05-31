import React, { useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMetadata } from "../../redux/slices/metadataSlice";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import config from "../../utils/config";
import { TfiUpload, TfiDownload } from "react-icons/tfi";


export default function MetaData() {
  const dispatch = useDispatch();
  const metadataState = useSelector((state) => state.metadata.metadata);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modal state for editing/adding new metadata rows
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRows, setNewRows] = useState([
    { group: "0099", element: "1001", description: "", vr: "", value: "" },
  ]);

    const auth=useSelector((state)=>state.auth)


  // Compute the next Element value based on existing metadata
  const getNextElement = () => {
    let newDefaultElement = "1001";
    if (metadataState && metadataState.metadata && metadataState.metadata.length > 0) {
      const elements = metadataState.metadata
        .filter((row) => row.Group === "0099")
        .map((row) => parseInt(row.Element, 10));
      if (elements.length > 0) {
        newDefaultElement = (Math.max(...elements) + 1).toString();
      }
    }
    return newDefaultElement;
  };

  const resetNewRows = () => {
    setNewRows([{ group: "0099", element: getNextElement(), description: "", vr: "", value: "" }]);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Save file name locally
    setUploadedFileName(file.name);
  
    const formData = new FormData();
    // Append file with key "dicomFile" (this must match your backend field name)
    formData.append("dicomFile", file);
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await axios.post(
        `${config.API_URL}/api/xrays/dicom/upload/metadata`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            
          },
          withCredentials: true,
        }
      );
  
      const data = response.data;
      // Look inside data.metadata.metadata_results if available
      let metadataResults = [];
      if (data.metadata && data.metadata.metadata_results) {
        metadataResults = data.metadata.metadata_results;
      } else if (data.metadata_results) {
        metadataResults = data.metadata_results;
      }
  
      if (metadataResults.length > 0) {
        const fileMetadata = metadataResults[0];
        // Ensure the file name is included
        if (!fileMetadata.file_name) {
          fileMetadata.file_name = file.name;
        }
        dispatch(setMetadata(fileMetadata));
        setCurrentPage(1);
      } else {
        throw new Error("No metadata found in the response.");
      }
    } catch (err) {
      setError(err.message);
    }
  
    setLoading(false);
  };
  

  // Pagination helper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = Math.ceil(
      metadataState && metadataState.metadata ? metadataState.metadata.length / rowsPerPage : 0
    );
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const metadataList = metadataState && metadataState.metadata ? metadataState.metadata : [];
  const totalPages = Math.ceil(metadataList.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = metadataList.slice(indexOfFirstRow, indexOfLastRow);

  // PDF download handler (excludes rows containing "pixel data")
  const handleDownloadPdf = () => {
    if (!metadataState) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    const fileName = metadataState.file_name || uploadedFileName;
    doc.text(`Metadata for: ${fileName} (${metadataState.format})`, 14, 22);

    const tableColumn = ["Group", "Element", "Description", "VR", "Value"];
    const tableRows = metadataState.metadata
      .filter(
        (row) =>
          !(row.Description && row.Description.toLowerCase().includes("pixel data"))
      )
      .map((row) => [
        row.Group,
        row.Element,
        row.Description,
        row.VR,
        row.Value,
      ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("metadata.pdf");
  };

  // Handler for changes in the new row fields inside the modal
  const handleNewRowChange = (index, field, value) => {
    setNewRows((prev) => {
      const newRowsCopy = [...prev];
      newRowsCopy[index] = { ...newRowsCopy[index], [field]: value };
      return newRowsCopy;
    });
  };

  // Add a new metadata row in the modal form
  const handleAddRow = () => {
    setNewRows((prev) => {
      const lastRow = prev[prev.length - 1];
      const nextElement = (parseInt(lastRow.element, 10) + 1).toString();
      return [
        ...prev,
        { group: "0099", element: nextElement, description: "", vr: "", value: "" },
      ];
    });
  };

  // Save the new metadata rows from the modal
  const handleModalSubmit = (e) => {
    e.preventDefault();
    const transformedNewRows = newRows.map((row) => ({
      Group: row.group,
      Element: row.element,
      Description: row.description || null,
      VR: row.vr || null,
      Value: row.value || null,
    }));
    if (metadataState) {
      const updatedMetadata = {
        ...metadataState,
        metadata: [...metadataState.metadata, ...transformedNewRows],
      };
      dispatch(setMetadata(updatedMetadata));
    } else {
      dispatch(
        setMetadata({
          file_name: uploadedFileName,
          format: "",
          metadata: transformedNewRows,
        })
      );
    }
    setIsModalOpen(false);
    resetNewRows();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-300 dark:text-gray-900">
            Metadata Extract
          </h1>
          <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">
            Extracted metadata from the uploaded DICOM file.
          </p>
          {metadataState ? (
            <h2 className="text-lg font-semibold mt-4">
              File:{" "}
              <span className="text-[#030811]">
                {metadataState.file_name || uploadedFileName}
              </span>{" "}
              <span className="text-[#5c60c6] ml-2">
                ({metadataState.format})
              </span>
            </h2>
          ) : (
            <h2 className="text-xl font-semibold mt-4 text-gray-400">
              No file selected
            </h2>
          )}
        </div>
        {/* Action Buttons: Edit and Download PDF */}
        {metadataState && (
          <div className="mt-4 sm:mt-0 sm:ml-auto flex gap-4">
            <button
              onClick={() => {
                setIsModalOpen(true);
                resetNewRows();
              }}
              className="cursor-pointer bg-[#5c60c6] text-[#fdfdfd] py-2 px-12 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 flex items-center gap-2"
            >
              Edit
            </button>
            <button
              onClick={handleDownloadPdf}
              className="cursor-pointer bg-[#030811] text-[#fdfdfd] py-5 px-8 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
            >
              Download PDF
              <TfiDownload className="m-1 pl-1 text-xl" />
            </button>
          </div>
        )}
      </div>

      {/* Custom File Upload Button */}
      <div className="flex flex-col items-center">
        <label
          htmlFor="dicom-upload"
          className="cursor-pointer bg-[#5c60c6] text-[#fdfdfd] py-5 px-10 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
        >
          Upload
          <TfiUpload className="dark:text-[#fdfdfd] text-[#030811] m-1 pl-1 text-xl" />
        </label>
        <input
          id="dicom-upload"
          type="file"
          accept=".dicom"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="dicom-upload"
        />
      </div>

      {loading && <p className="text-center text-gray-700 mt-4">Loading...</p>}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}

      {/* Metadata Table */}
      {metadataState && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Element
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VR
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <AnimatePresence>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.Group}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.Element}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.Description}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.VR}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="truncate" title={row.Value}>
                            {row.Value}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {metadataState && totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div className="-mt-px flex w-0 flex-1">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-[#5c60c6] hover:text-[#5c60c6]"
            >
              <ArrowLongLeftIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Previous
            </button>
          </div>
          <div className="hidden md:-mt-px md:flex">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={index}
                  className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                    page === currentPage
                      ? "border-[#5c60c6] text-[#5c60c6]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <div className="-mt-px flex w-0 flex-1 justify-end">
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-[#5c60c6] hover:text-[#5c60c6]"
            >
              Next
              <ArrowLongRightIcon className="ml-3 h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-3xl bg-[#fdfdfd] text-[#030811] p-6 rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Add New Metadata Row(s)</h2>
            <form onSubmit={handleModalSubmit} className="space-y-6">
              {newRows.map((row, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium">Group</label>
                      <input
                        type="text"
                        value={row.group}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Element</label>
                      <input
                        type="text"
                        value={row.element}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium">Description</label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          handleNewRowChange(index, "description", e.target.value)
                        }
                        placeholder="Description"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">VR</label>
                      <input
                        type="text"
                        value={row.vr}
                        onChange={(e) =>
                          handleNewRowChange(index, "vr", e.target.value)
                        }
                        placeholder="VR"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Value</label>
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          handleNewRowChange(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Add Field
                </button>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetNewRows();
                    }}
                    className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
