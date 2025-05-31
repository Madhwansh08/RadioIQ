import React, { useState, useEffect, lazy, useCallback, useContext, useRef, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import {
  setTableData,
  addTableData,
  updateTableRow,
} from "../redux/slices/tableSlice";
import { toast } from "react-toastify";
import { TfiUpload } from "react-icons/tfi";
import { TbReport, TbX } from "react-icons/tb";
import { motion } from "framer-motion";
import config from "../utils/config";
import {
  MdOutlineKeyboardArrowRight,
  MdOutlineKeyboardArrowLeft,
} from "react-icons/md";
import { BarLoader } from "../components/BarLoader";
import { addNotification } from "../redux/slices/notificationSlice";
import NotificationModal from "../components/NotificationsModal";
import CircularLoader from "../components/CircularLoader";
import { setUploadTotal, setInitialCount, updateProgress, resetLoader } from "../redux/slices/loaderSlice";
import { FaUser } from "react-icons/fa6";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import UserTip from "../components/UserTip";

const InstructionSlider = lazy(() => import("../components/InstructionSlider"));
const Header = lazy(() => import("../components/Header"));

// Reusable PatientDataTable component
const PatientDataTable = ({
  tableData,
  currentPage,
  itemsPerPage = 10,
  handleInputChange,
  handlePincodeChange,
  handleDicomUpdate,
  editingRowIndex,
  suggestions,
  handleSuggestionSelect,
  handlePageChange,
  setCurrentPage,
}) => {
  // Internal pagination fallback
  const [internalPage, setInternalPage] = useState(0);
  // Determine active page: external or internal
  const page = typeof currentPage === 'number' ? currentPage : internalPage;

  // Unified page change handler
  const onPageChange = (newPage) => {
    if (typeof handlePageChange === 'function') {
      handlePageChange(newPage);
    } else if (typeof setCurrentPage === 'function') {
      setCurrentPage(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Reverse data to show latest first
  const sortedData = useMemo(() => [...tableData].reverse(), [tableData]);
  const totalItems = sortedData.length;
  const pageCount = Math.ceil(totalItems / itemsPerPage);
  const startIndex = page * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Calculate display indices
  const firstItem = totalItems === 0 ? 0 : startIndex + 1;
  const lastItem = Math.min(startIndex + itemsPerPage, totalItems);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr className="dark:bg-[#030811] bg-[#5c60c6] dark:text-[#fdfdfd] text-[#fdfdfd]">
            <th className="py-2 px-4 border">Patient ID</th>
            <th className="py-2 px-4 border">Gender</th>
            <th className="py-2 px-4 border">Age</th>
            <th className="py-2 px-4 border">Pin Code</th>
            <th className="py-2 px-4 border">File Name</th>
            <th className="py-2 px-4 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, idx) => {
            const displayIndex = idx + startIndex;
            const originalIndex = tableData.length - 1 - displayIndex;
            return (
              <tr key={row.patientId || originalIndex}>
                <td className="py-2 px-4 border">
                  <input
                    type="text"
                    name="patientId"
                    value={row.patientId}
                    onChange={(e) => handleInputChange(e, originalIndex)}
                    className="w-full p-1 border rounded dark:text-[#fdfdfd] text-[#030811] dark:bg-[#030811] bg-[#fdfdfd] font-bold"
                  />
                </td>
                <td className="py-2 px-4 border">
                  <select
                    name="sex"
                    value={row.sex}
                    onChange={(e) => handleInputChange(e, originalIndex)}
                    className="w-full p-1 border dark:bg-[#030811] bg-[#fdfdfd] rounded dark:text-[#fdfdfd] text-[#030811] font-medium"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
                <td className="py-2 px-4 border">
                  <input
                    type="number"
                    name="age"
                    value={row.age}
                    onChange={(e) => handleInputChange(e, originalIndex)}
                    min="0"
                    step="1"
                    onKeyPress={(e) => {
                      if (e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full p-1 border dark:bg-[#030811] bg-[#fdfdfd] rounded dark:text-[#fdfdfd] text-[#030811] font-medium"
                  />
                </td>
                <td className="py-2 px-4 border relative">
                  <input
                    type="number"
                    name="location"
                    value={row.location || ''}
                    onChange={(e) => handlePincodeChange(e, originalIndex)}
                    className="w-full p-1 border rounded dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] font-medium"
                    placeholder="Type pincode"
                  />
                  {editingRowIndex === originalIndex && suggestions.length > 0 && (
                    <ul className="absolute bg-black text-white border rounded shadow-lg mt-2 max-h-40 overflow-y-auto z-10 w-full">
                      {suggestions.map((suggestion, i) => (
                        <li
                          key={i}
                          className="p-2 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-4 border">
                  <div className="relative group">
                    <span className="block truncate max-w-[150px] cursor-default dark:text-[#fdfdfd] text-[#030811]">
                      {row.fileName}
                    </span>
                    <div className="absolute left-0 top-full mt-1 hidden w-max rounded bg-gray-800 p-1 text-xs text-white group-hover:block z-10">
                      {row.fileName}
                    </div>
                  </div>
                </td>
                <td className="py-2 px-4 border">
                  <button
                    onClick={() => handleDicomUpdate(originalIndex)}
                    className="bg-[#5c60c6] text-[#fdfdfd] px-2 py-1 rounded-lg hover:bg-[#030811]"
                  >
                    <TbReport className="mx-1" size={26} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t dark:bg-[#030811] dark:text-[#fdfdfd] border-gray-200 bg-white px-4 py-3 sm:px-6">
        {/* Mobile */}
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#fdfdfd] hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount - 1}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#fdfdfd] hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {/* Desktop */}
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-[#fdfdfd]">
              Showing <span className="font-medium">{firstItem}</span> to <span className="font-medium">{lastItem}</span> of <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-[#fdfdfd] ring-1 ring-inset ring-gray-300 hover:bg-[#5c60c6] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p - 1)}
                  aria-current={p === page + 1 ? 'page' : undefined}
                  className={
                    p === page + 1
                      ? 'relative z-10 inline-flex items-center bg-[#5c60c6] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-[#fdfdfd] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount - 1}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

const Upload = () => {
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [pincode, setPincode] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for mobile drawer
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const tableData = useSelector((state) => state.table);
  const { uploadTotal, initialCount, progress } = useSelector((state) => state.loader);
  const dispatch = useDispatch();

  // Get the global clientId from our SSE context.
  const clientId = useSelector((state) => state.sse.clientId);

  const notify = useCallback((type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    dispatch(addNotification(newNotification));
    toast[type](message);
  }, [dispatch]);

  const warnedRef = useRef(false);

  useEffect(() => {
    if (warnedRef.current) return;

    const isMobile =
      window.innerWidth < 1024 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isMobile) {
      toast.warn("This page is for desktop devices; design may change on other devices");
      warnedRef.current = true;
    }
  }, []);

  const memoizedTableData = useMemo(() => tableData, [tableData]);

  useEffect(() => {
    if (uploadTotal > 0) {
      const newProgress = Math.min(((tableData.length - initialCount) / uploadTotal) * 100, 100);
      dispatch(updateProgress(newProgress));
    }
  }, [tableData, uploadTotal, initialCount, dispatch]);

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (!selectedFiles.length) return;

    setFilesUploaded(true);

    const validExtensions = [".dicom", ".png", ".dcm", ".dic"];
    const invalidFiles = selectedFiles.filter(
      (file) =>
        !validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        )
    );

    if (invalidFiles.length > 0) {
      toast.error("Please upload .dicom, .dcm, .dic, .png files only.");
      return;
    }

    let storedClientId = localStorage.getItem("clientId") || clientId;
    if (!storedClientId) {
      toast.error("Client ID not assigned yet. Please wait or refresh.");
      return;
    }

   

    dispatch(setUploadTotal(selectedFiles.length));
    dispatch(setInitialCount(tableData.length));
    dispatch(updateProgress(0));

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post(
        `${config.API_URL}/api/xrays/dicom/uploadMultiple`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          params: { clientId: storedClientId },
        }
      );

      if (response.status === 207) {
        const results = response.data.results;
        const errorFiles = results.filter((result) => result.error);
        const successFiles = results.filter((result) => !result.error);

        if (errorFiles.length > 0) {
          errorFiles.forEach((result) => {
            notify('error',
              `File ${result.fileName || "unknown"} failed: ${result.message || result.error}`
            );
          });
        }
        if (successFiles.length > 0) {
          notify('success',
            `${successFiles.length} file(s) processed successfully, but ${errorFiles.length} file(s) failed.`
          );
        }
      } else if (response.status === 200) {
        notify('success', "File Processing Started data would be available in a while");
      }
    } catch (error) {
      console.error("Error uploading files:", error.response?.data || error.message);
      notify('error', "Failed to upload DICOM files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e, actualIndex) => {
    const { name, value } = e.target;
    if (name === "age") {
      if (value === "") {
        dispatch(updateTableRow({ index: actualIndex, key: name, value: "" }));
      } else {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          notify('error', "Age must be a number.");
          return;
        }
        if (numValue < 0) {
          notify('error', "Age cannot be less than 0.");
          dispatch(updateTableRow({ index: actualIndex, key: name, value: 0 }));
        } else {
          dispatch(updateTableRow({ index: actualIndex, key: name, value: numValue }));
        }
      }
    } else {
      dispatch(updateTableRow({ index: actualIndex, key: name, value }));
    }
  };

  const handlePincodeChange = (e, index) => {
    const { value } = e.target;
    const actualIndex = index;
    dispatch(updateTableRow({ index: actualIndex, key: "location", value }));
    setEditingRowIndex(actualIndex);
    setPincode(value);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (editingRowIndex !== null) {
      dispatch(
        updateTableRow({
          index: editingRowIndex,
          key: "location",
          value: suggestion.label,
        })
      );
      setEditingRowIndex(null);
      setPincode("");
      setSuggestions([]);
    }
  };

  const handleDicomUpdate = async (index) => {
    const row = tableData[index];
    if (!row.patientId) {
      notify('error', "Patient ID is required.");
      return;
    }
    if (!row.sex) {
      notify('error', "Gender is required.");
      return;
    }
    if (row.age === "" || isNaN(row.age) || row.age < 0) {
      notify('error', "Valid age is required.");
      return;
    }
    try {
      const dataToUpdate = {
        ...row,
        xraySlug: row.xraySlug,
        xrayUrl: row.xrayUrl,
      };
      const response = await axios.put(
        `${config.API_URL}/api/xrays/dicom/update`,
        dataToUpdate,
        { withCredentials: true }
      );
      const patientSlug = response.data?.patient?.slug;
      const xraySlug = response.data?.xray?.slug;
      if (!patientSlug || !xraySlug) {
        throw new Error("Missing patientSlug or xraySlug in the response.");
      }
      navigate(`/analysis/${patientSlug}/${xraySlug}`, { state: { tableData } });
    } catch (error) {
      console.error("Error updating patient record or navigating:", error.message);
      notify('error', "Failed to save patient information or navigate. Please try again.");
    }
  };

  const paginatedData = useMemo(
    () =>
      tableData.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
      ),
    [tableData, currentPage, itemsPerPage]
  );

  return (
    <div>
      <Suspense fallback={<div className="bg-[#030811]">...</div>}>
        <Header />
      </Suspense>
      <div className="flex flex-col items-center mt-30 pt-20 min-h-screen dark:bg-[#030811] bg-[#fdfdfd] text-[#fdfdfd] relative">
        <h1 className="text-center text-4xl md:text-8xl font-bold mb-8 mx-auto dark:text-[#fdfdfd] text-[#030811]">
          <span className="dark:text-[#5c60c6] text-[#030811]">X-Ray</span> Analysis
        </h1>
        <p className="text-center text-xl md:text-3xl font-bold mb-8 mx-auto mt-2 dark:text-[#fdfdfd] text-[#030811]">
          Kindly Upload X-ray Images
        </p>
        <div className="flex flex-col items-center">
          <label
            htmlFor="dicom-upload"
            className="cursor-pointer dark:bg-[#030811] bg-[#fdfdfd] border-2 shadow-lg shadow-[#231b6e] border-[#231b6e] dark:text-[#fdfdfd] text-[#030811] py-7 px-20 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
          >
            Upload
            <TfiUpload className="dark:text-[#fdfdfd] text-[#030811] m-1 pl-1 text-xl" />
          </label>
          <input
            id="dicom-upload"
            type="file"
            multiple
            accept=".dicom,.png,.dcm,.dic"
            onChange={handleFileChange}
            className="hidden"
            data-testid="dicom-upload"
          />
        </div>

        {/* Mobile drawer toggle button */}
        <button
          className="md:hidden fixed bottom-4 right-4 bg-[#5c60c6] text-[#fdfdfd] p-2 rounded-full z-10"
          onClick={() => setIsDrawerOpen(true)}
        >
          <FaUser size={24} />
        </button>

        {/* Desktop layout */}
        <div className="hidden md:flex flex-row w-full mt-10 px-10">
          <div className="flex-1 dark:bg-[#030811] bg-[#fdfdfd] rounded-lg">
            <Suspense fallback={<div>Loading...</div>}>
              <InstructionSlider />
            </Suspense>
          </div>
          <div className="flex-1 dark:bg-[#030811] bg-[#fdfdfd] rounded-lg ml-5">
            {paginatedData.length > 0 ? (
              <PatientDataTable
                tableData={tableData}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                handleInputChange={handleInputChange}
                handlePincodeChange={handlePincodeChange}
                handleSuggestionSelect={handleSuggestionSelect}
                handleDicomUpdate={handleDicomUpdate}
                editingRowIndex={editingRowIndex}
                suggestions={suggestions}
              />
            ) : (
              !filesUploaded ? (
                <p className="text-center text-xl dark:text-[#fdfdfd] text-[#030811]">
                  Patient data would be available here as soon as the dicoms are uploaded.
                </p>
              ) : (
                <UserTip />
              )
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {isDrawerOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#030811] p-4 rounded-t-lg max-h-[80vh] overflow-y-auto shadow-lg">
              <button
                className="absolute top-2 right-2 text-[#fdfdfd] p-2"
                onClick={() => setIsDrawerOpen(false)}
              >
                <TbX size={24} />
              </button>
              <div className="overflow-x-auto">
                {paginatedData.length > 0 ? (
                  <PatientDataTable
                    tableData={tableData}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    handleInputChange={handleInputChange}
                    handlePincodeChange={handlePincodeChange}
                    handleSuggestionSelect={handleSuggestionSelect}
                    handleDicomUpdate={handleDicomUpdate}
                    editingRowIndex={editingRowIndex}
                    suggestions={suggestions}
                  />
                ) : (
                  !filesUploaded ? (
                    <p className="text-center text-xl dark:text-[#fdfdfd] text-[#030811]">
                      Patient data would be available here as soon as the dicoms are uploaded.
                    </p>
                  ) : (
                    <UserTip />
                  )
                )}
              </div>
            </div>
          </div>
        )}
        {uploading && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center dark:bg-[#030811]/50 bg-[#fdfdfd]/50 bg-opacity-50 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center">
              <BarLoader />
            </div>
          </div>
        )}

        {uploadTotal > 0 && (tableData.length - initialCount) < uploadTotal && (
          <div className="fixed bottom-4 right-4">
            <CircularLoader progress={progress} />
          </div>
        )}
        <NotificationModal />
      </div>
    </div>
  );
};

export default Upload;