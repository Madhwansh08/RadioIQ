// PatientTable.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { IoFilter } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const truncateSlug = (slug, maxLength = 8) => {
  if (slug.length > maxLength) {
    return `${slug.substring(0, 10)}....`;
  }
  return slug;
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export default function PatientTable({
  recentXrays,
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  abnormalityFilter,
  onSearchChange,
  onAbnormalityFilterChange,
}) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
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

 

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Normal", value: "none" },
    { label: "Abnormal", value: "has" },
  ];

  const handleOptionClick = (value) => {
    onAbnormalityFilterChange(value);
    setShowDropdown(false);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-300 dark:text-gray-900">
            X-rays Record
          </h1>
          <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">
            A list of all the recently analysed X-rays
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-auto">
          <input
            type="text"
            placeholder="Search by Patient ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 dark:text-gray-900 sm:pl-6 lg:pl-8">
                    Patient ID
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 dark:text-gray-900">
                    Date
                  </th>
              
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 dark:text-gray-900">
                    Age
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 dark:text-gray-900">
                    X-ray ID
                  </th>
                  <th className="relative px-3 py-3.5 text-left text-sm font-semibold text-gray-300 dark:text-gray-900">
                    Abnormalities
                    <span className="relative inline-block ml-2">
                      <button
                        type="button"
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="inline-flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <IoFilter className="h-5 ml-2 w-5" aria-hidden="true" />
                      </button>
                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                          >
                            <ul className="py-1">
                              {filterOptions.map((option) => (
                                <li
                                  key={option.value}
                                  onClick={() => handleOptionClick(option.value)}
                                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-200 ${
                                    abnormalityFilter === option.value ? "font-semibold" : ""
                                  }`}
                                >
                                  {option.label}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 dark:text-gray-900">
                    TB Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500 dark:divide-gray-200 bg-black dark:bg-white">
                {recentXrays.length > 0 ? (
                  recentXrays.map((xray, index) => {
                    let barWidth = "25%";
                    let bgColor = "#10b981";
                    const tbScore = (xray.tbScore * 100).toFixed(0);
                    if (tbScore > 30 && tbScore <= 70) {
                      barWidth = "50%";
                      bgColor = "#facc15";
                    } else if (tbScore > 70 && tbScore <= 90) {
                      barWidth = "75%";
                      bgColor = "#f59e0b";
                    } else if (tbScore > 90) {
                      barWidth = "100%";
                      bgColor = "#ef4444";
                    }
                    return (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-400 dark:text-gray-900 sm:pl-6 lg:pl-8">
                          {xray.patientSlug.toUpperCase()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
                          {formatDate(xray.createdAt)}
                        </td>
                        
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
                          {xray.patientAge || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
                          <button
                            onClick={() => navigate(`/analysis/${xray.patientSlug}/${xray.xraySlug}`)}
                            className="text-blue-500 hover:underline"
                          >
                            {truncateSlug(xray.xraySlug)}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
                          {xray.abnormalities.join(", ")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
                          <div className="relative w-full h-4 bg-gray-200 rounded overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-4 rounded transition-all duration-500"
                              style={{ width: barWidth, backgroundColor: bgColor }}
                            ></div>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2 text-white text-base ${
                                tbScore <= 30
                                  ? "bg-green-500"
                                  : tbScore > 30 && tbScore <= 70
                                  ? "bg-yellow-500"
                                  : tbScore > 70 && tbScore <= 90
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                            >
                              {tbScore <= 30
                                ? "Low"
                                : tbScore > 30 && tbScore <= 70
                                ? "Medium"
                                : tbScore > 70 && tbScore <= 90
                                ? "High"
                                : "Critical"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-400">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div className="-mt-px flex w-0 flex-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
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
                  onClick={() => onPageChange(page)}
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-[#5c60c6] hover:text-[#5c60c6]"
            >
              Next
              <ArrowLongRightIcon className="ml-3 h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}