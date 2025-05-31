// Tables.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import config from "../../utils/config";
import PatientTable from "./PatientTable";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

const Banner = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // Auto-close after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-x-0 bottom-0 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8"
      >
        <div className="flex items-center justify-between gap-x-6 dark:bg-[#030811] bg-[#fdfdfd] px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pl-4 sm:pr-3.5">
          <p className="text-sm dark:text-[#f2ebe3] text-[#030811]">
            <strong className="font-semibold">RadioIQ</strong>
            <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline size-0.5 fill-current">
              <circle r={1} cx={1} cy={1} />
            </svg>
            Click on the X-ray ID to go to the analysis screen.
          </p>
          <button type="button" onClick={onClose} className="-m-1.5 flex-none p-1.5">
            <span className="sr-only">Dismiss</span>
            <XMarkIcon aria-hidden="true" className="size-5 text-white" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const Tables = () => {
  const [recentXrays, setRecentXrays] = useState([]);
  const [showBanner, setShowBanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [abnormalityFilter, setAbnormalityFilter] = useState("all");
  const auth = useSelector((state) => state.auth);
  const limit = 10; // Number of records per page

  // Whenever filters or currentPage change, re-fetch data from the API.
  useEffect(() => {
    const fetchRecentXrays = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/RecentXrays?page=${currentPage}&limit=${limit}&searchQuery=${encodeURIComponent(
            searchQuery
          )}&abnormalityFilter=${abnormalityFilter}`,
          { withCredentials: true }
        );
        setRecentXrays(response.data.recentXrays);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching recent X-rays:", error);
      }
    };
    fetchRecentXrays();
  }, [auth.token, currentPage, searchQuery, abnormalityFilter, limit]);




  // Reset page to 1 when filter values change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, abnormalityFilter]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      {showBanner && <Banner onClose={() => setShowBanner(false)} />}
      <PatientTable
        recentXrays={recentXrays}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        searchQuery={searchQuery}
        abnormalityFilter={abnormalityFilter}
        onSearchChange={setSearchQuery}
        onAbnormalityFilterChange={setAbnormalityFilter}
      />
    </div>
  );
};

export default Tables;
