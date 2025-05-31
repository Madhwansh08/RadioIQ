import React, { useState, useMemo, lazy, Suspense , useCallback } from "react";
import { TbReport } from "react-icons/tb";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Joyride, { EVENTS, STATUS } from "react-joyride";
import { useNavigate } from "react-router-dom";

const Header = lazy(() => import("../../components/Header"));
const InstructionSlider = lazy(() => import('../../components/InstructionSlider'));


const mockPatientData={
    "results": [
      {
        "patient": {
          "patientId": "playGround1",
          "slug": "pg1",
          "age": 45,
          "sex": "Male",
          "location": "Kanpur"
        },
        "xray": {
          "url": "https://infinityui-kanpur.s3.ap-south-1.amazonaws.com/pyfeatures/dicom_to_png/sample1.png",
          "originalUrl": "https://kanpur-radiovision-v1.s3.ap-south-1.amazonaws.com/xrays/dicom/sample1.dicom",
          "slug": "sample1slug",
          "patientId": "p001",
          "abnormalities": [
            {
                "id": "ab001",
                "name": "Opacity",
                "score": 0.85,
                "segmentation": [
                  650,
                  175,
                  890,
                  234,
                  782,
                  124,
                  456,
                  354,
                  567,
                  256,
                  789,
                ]
            }
          ],
          "view": "PA",
          "annotations": [],
          "lungsFound": true,
          "isNormal": false,
          "clahe": "https://radioiq.s3.ap-south-1.amazonaws.com/contrast-enhanced/sample1.png",
          "ctr": {
            "ratio": 0.32,
            "imageUrl": "https://radioiq.s3.ap-south-1.amazonaws.com/ct-ratio/sample1.png"
          },
          "zoom": {
            "x": 100,
            "y": 10,
            "width": 900,
            "height": 1000
          },
          "boneSuppression": "https://radioiq.s3.ap-south-1.amazonaws.com/bone-suppressed/sample1.png",
          "heatmap": "https://radioiq.s3.ap-south-1.amazonaws.com/global-heatmap/sample1.png",
          "editedAbnormalities": [],
          "report": null,
          "_id": "r001",
          "tbScore": 1,
          "createdAt": "2025-04-01T10:00:00Z",
          "updatedAt": "2025-04-01T10:00:00Z",
          "__v": 0
        }
      },
      {
        "patient": {
          "patientId": "playGround2",
          "slug": "pg2",
          "age": 60,
          "sex": "Female",
          "location": "Delhi"
        },
        "xray": {
          "url": "https://infinityui-kanpur.s3.ap-south-1.amazonaws.com/pyfeatures/dicom_to_png/sample2.png",
          "originalUrl": "https://kanpur-radiovision-v1.s3.ap-south-1.amazonaws.com/xrays/dicom/sample2.dicom",
          "slug": "sample2slug",
          "patientId": "p002",
         "abnormalities": [
            {
                "id": "ab002",
                "name": "Pneumothorax",
                "score": 0.90,
                "segmentation": [
                  650,
                  175,
                  890,
                  234,
                  782,
                  124,
                  456,
                  354,
                  567,
                  256,
                  789,
                ]
            }
          ],
          "view": "AP",
          "annotations": [],
          "lungsFound": true,
          "isNormal": false,
          "clahe": "https://radioiq.s3.ap-south-1.amazonaws.com/contrast-enhanced/sample2.png",
          "ctr": {
            "ratio": 0.25,
            "imageUrl": "https://radioiq.s3.ap-south-1.amazonaws.com/ct-ratio/sample2.png"
          },
          "zoom": {
            "x": 110,
            "y": 5,
            "width": 910,
            "height": 1010
          },
          "boneSuppression": "https://radioiq.s3.ap-south-1.amazonaws.com/bone-suppressed/sample2.png",
          "heatmap": "https://radioiq.s3.ap-south-1.amazonaws.com/global-heatmap/sample2.png",
          "editedAbnormalities": [],
          "report": null,
          "_id": "r002",
          "tbScore": 2,
          "createdAt": "2025-04-02T11:00:00Z",
          "updatedAt": "2025-04-02T11:00:00Z",
          "__v": 0
        }
      },
      {
        "patient": {
          "patientId": "playGround3",
          "slug": "pg3",
          "age": 35,
          "sex": "Male",
          "location": "Mumbai"
        },
        "xray": {
          "url": "https://infinityui-kanpur.s3.ap-south-1.amazonaws.com/pyfeatures/dicom_to_png/sample3.png",
          "originalUrl": "https://kanpur-radiovision-v1.s3.ap-south-1.amazonaws.com/xrays/dicom/sample3.dicom",
          "slug": "sample3slug",
          "patientId": "p003",
          "abnormalities": [
            {
                "id": "ab001",
                "name": "Pleural Effusion",
                "score": 0.55,
                "segmentation": [
                  650,
                  175,
                  890,
                  234,
                  782,
                  124,
                  456,
                  354,
                  567,
                  256,
                  789,
                ]
            }
          ],
          "view": "Lateral",
          "annotations": [],
          "lungsFound": true,
          "isNormal": false,
          "clahe": "https://radioiq.s3.ap-south-1.amazonaws.com/contrast-enhanced/sample3.png",
          "ctr": {
            "ratio": 0.22,
            "imageUrl": "https://radioiq.s3.ap-south-1.amazonaws.com/ct-ratio/sample3.png"
          },
          "zoom": {
            "x": 120,
            "y": 15,
            "width": 920,
            "height": 1020
          },
          "boneSuppression": "https://radioiq.s3.ap-south-1.amazonaws.com/bone-suppressed/sample3.png",
          "heatmap": "https://radioiq.s3.ap-south-1.amazonaws.com/global-heatmap/sample3.png",
          "editedAbnormalities": [],
          "report": null,
          "_id": "r003",
          "tbScore": 3,
          "createdAt": "2025-04-03T12:00:00Z",
          "updatedAt": "2025-04-03T12:00:00Z",
          "__v": 0
        }
      },
      {
        "patient": {
          "patientId": "playGround4",
          "slug": "pg4",
          "age": 50,
          "sex": "Female",
          "location": "Lucknow"
        },
        "xray": {
          "url": "https://infinityui-kanpur.s3.ap-south-1.amazonaws.com/pyfeatures/dicom_to_png/sample4.png",
          "originalUrl": "https://kanpur-radiovision-v1.s3.ap-south-1.amazonaws.com/xrays/dicom/sample4.dicom",
          "slug": "sample4slug",
          "patientId": "p004",
          "abnormalities": [
            {
                "id": "ab001",
                "name": "Consolidation",
                "score": 0.95,
                "segmentation": [
                  650,
                  175,
                  890,
                  234,
                  782,
                  124,
                  456,
                  354,
                  567,
                  256,
                  789,
                ]
            }
          ],
          "view": "PA",
          "annotations": [],
          "lungsFound": true,
          "isNormal": false,
          "clahe": "https://radioiq.s3.ap-south-1.amazonaws.com/contrast-enhanced/sample4.png",
          "ctr": {
            "ratio": 0.35,
            "imageUrl": "https://radioiq.s3.ap-south-1.amazonaws.com/ct-ratio/sample4.png"
          },
          "zoom": {
            "x": 130,
            "y": 20,
            "width": 930,
            "height": 1030
          },
          "boneSuppression": "https://radioiq.s3.ap-south-1.amazonaws.com/bone-suppressed/sample4.png",
          "heatmap": "https://radioiq.s3.ap-south-1.amazonaws.com/global-heatmap/sample4.png",
          "editedAbnormalities": [],
          "report": null,
          "_id": "r004",
          "tbScore": 4,
          "createdAt": "2025-04-04T13:00:00Z",
          "updatedAt": "2025-04-04T13:00:00Z",
          "__v": 0
        }
      },
      {
        "patient": {
          "patientId": "playGround5",
          "slug": "pg5",
          "age": 42,
          "sex": "Male",
          "location": "Varanasi"
        },
        "xray": {
          "url": "https://infinityui-kanpur.s3.ap-south-1.amazonaws.com/pyfeatures/dicom_to_png/98bd9ea3_5fe8_40d4_a0af_a4cb4f5a9d8d_Normal_Training_10897.png",
          "originalUrl": "https://kanpur-radiovision-v1.s3.ap-south-1.amazonaws.com/xrays/dicom/sample5.dicom",
          "slug": "sample5slug",
          "patientId": "p005",
          "abnormalities": [
            {
                "id": "ab001",
                "name": "Fibrosis",
                "score": 0.85,
                "segmentation": [
                  650,
                  175,
                  890,
                  234,
                  782,
                  124,
                  456,
                  354,
                  567,
                  256,
                  789,
                ]
            }
          ],
          "view": "AP",
          "annotations": [],
          "lungsFound": true,
          "isNormal": false,
          "clahe": "https://radioiq.s3.ap-south-1.amazonaws.com/contrast-enhanced/sample5.png",
          "ctr": {
            "ratio": 0.29,
            "imageUrl": "https://radioiq.s3.ap-south-1.amazonaws.com/ct-ratio/sample5.png"
          },
          "zoom": {
            "x": 140,
            "y": 25,
            "width": 940,
            "height": 1040
          },
          "boneSuppression": "https://radioiq.s3.ap-south-1.amazonaws.com/bone-suppressed/sample5.png",
          "heatmap": "https://radioiq.s3.ap-south-1.amazonaws.com/global-heatmap/sample5.png",
          "editedAbnormalities": [],
          "report": null,
          "_id": "r005",
          "tbScore": 5,
          "createdAt": "2025-04-05T14:00:00Z",
          "updatedAt": "2025-04-05T14:00:00Z",
          "__v": 0
        }
      }
    ]
}







const normalizeData = (data) =>
    data.results.map((item) => ({
      patientId: item.patient.patientId,
      sex: item.patient.sex,
      age: item.patient.age,
      location: item.patient.location,
      fileName: item.xray.originalUrl.split("/").pop(),
      xraySlug: item.xray.slug,
      xrayUrl: item.xray.url,
    }));
  
  // Copied verbatim from Upload.jsx:
  const PatientDataTable = ({
    tableData,
    currentPage,
    setCurrentPage,
    itemsPerPage = 10,
    handleInputChange,
    handlePincodeChange,
    handleDicomUpdate,
    editingRowIndex,
    suggestions,
    handleSuggestionSelect,
  }) => {
    const [internalPage, setInternalPage] = useState(0);
    const page = typeof currentPage === "number" ? currentPage : internalPage;
    const onPageChange = (newPage) => {
      if (typeof setCurrentPage === "function") {
        setCurrentPage(newPage);
      } else {
        setInternalPage(newPage);
      }
    };
    const sortedData = useMemo(() => [...tableData].reverse(), [tableData]);
    const totalItems = sortedData.length;
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    const startIndex = page * itemsPerPage;
    const paginatedData = sortedData.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    const firstItem = totalItems === 0 ? 0 : startIndex + 1;
    const lastItem = Math.min(startIndex + itemsPerPage, totalItems);
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  
    return (
      <>
      <div id="joy-table">
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
                <tr key={originalIndex}>
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
                        if (e.key === "-") e.preventDefault();
                      }}
                      className="w-full p-1 border dark:bg-[#030811] bg-[#fdfdfd] rounded dark:text-[#fdfdfd] text-[#030811] font-medium"
                    />
                  </td>
                  <td className="py-2 px-4 border relative">
                    <input
                      type="text"
                      name="location"
                      value={row.location || ""}
                      onChange={(e) => handlePincodeChange(e, originalIndex)}
                      className="w-full p-1 border rounded dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] font-medium"
                      placeholder="Type pincode"
                    />
                    {editingRowIndex === originalIndex &&
                      suggestions.length > 0 && (
                        <ul className="absolute bg-black text-white border rounded shadow-lg mt-2 max-h-40 overflow-y-auto z-10 w-full">
                          {suggestions.map((s, i) => (
                            <li
                              key={i}
                              className="p-2 hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleSuggestionSelect(s)}
                            >
                              {s.label}
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
                    id={`joy-analyze-btn-${idx}`}
                      onClick={() => handleDicomUpdate(originalIndex)}
                      className="bg-[#5c60c6] text-[#fdfdfd] px-2 py-1 rounded-lg hover:bg-[#030811]"
                    >
                      <TbReport className="mx-1" size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
  
        {/* Pagination */}
        <div className="flex items-center justify-between border-t dark:bg-[#030811] dark:text-[#fdfdfd] border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700 dark:text-[#fdfdfd]">
              Showing <span className="font-medium">{firstItem}</span> to{" "}
              <span className="font-medium">{lastItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </p>
            <nav
              aria-label="Pagination"
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            >
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-[#fdfdfd] ring-1 ring-inset ring-gray-300 hover:bg-[#5c60c6] focus:z-20 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p - 1)}
                  aria-current={p === page + 1 ? "page" : undefined}
                  className={
                    p === page + 1
                      ? "relative z-10 inline-flex items-center bg-[#5c60c6] px-4 py-2 text-sm font-semibold text-white"
                      : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-[#fdfdfd] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20"
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount - 1}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-[#fdfdfd] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </>
    );
  };
  
  const PlaygroundUpload = () => {
    const [tableData, setTableData] = useState(() =>
      normalizeData(mockPatientData)
    );
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const editingRowIndex = null;
    const suggestions = [];

    const [runTour, setRunTour] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    {
      target: "body", // Changed from "#joy-welcome"
      content: "👋 Welcome to the Playground! You can skip this tour at any time.",
      placement: "center",
    },
    {
      target: "#joy-table",
      content: "Here you see some mock patient data already available.",
    },
    {
      target: "#joy-analyze-btn-0",
      content: "Click this button to go to the analysis page for the first record.",
    },
  ];
  const handleJoyrideCallback = useCallback((data) => {
    const { status, index, type } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    } else if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }
  }, []);





    const navigate=useNavigate()
  
    const handleInputChange = (e, idx) => {
      const { name, value } = e.target;
      setTableData((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [name]: value };
        return copy;
      });
    };
  
    const handlePincodeChange = (e, idx) => {
      const { value } = e.target;
      setTableData((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], location: value };
        return copy;
      });
    };
  
    const handleDicomUpdate = (idx) => {
       
        const payload = mockPatientData.results[idx];
        navigate("/playground/playground-analysis", { state: payload });
      };


    return (
      <div className="dark:bg-[#030811] bg-[#fdfdfd] min-h-screen">

<Joyride
        steps={steps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showSkipButton
        showProgress
        styles={{ options: { zIndex: 10000 } }}
        callback={handleJoyrideCallback}
      />


        <Suspense fallback={<div className="h-16 bg-[#030811]" />}>
          <Header />
        </Suspense>
        <div className="flex flex-col items-center pt-20 px-4 md:px-10">
          <h1 className="text-4xl md:text-8xl font-bold mb-4 mt-10 text-[#fdfdfd]">
            <span className="dark:text-[#5c60c6] text-[#030811]">X-Ray Analysis </span> 
          </h1>
          <p className="text-xl md:text-3xl font-bold mb-8 mt-4 italic dark:text-[#fdfdfd] text-[#030811]">
            Patient Data already present
          </p>
  
          <div className="w-full flex flex-col md:flex-row gap-6 mt-20">
            <div className="flex-1 bg-[#fdfdfd] dark:bg-[#030811] rounded-lg p-4">
              <Suspense fallback={<div>Loading…</div>}>
                <InstructionSlider />
              </Suspense>
            </div>
  
            <div className="flex-1 bg-[#fdfdfd] dark:bg-[#030811] rounded-lg p-4">
              <PatientDataTable
                tableData={tableData}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                handleInputChange={handleInputChange}
                handlePincodeChange={handlePincodeChange}
                handleDicomUpdate={handleDicomUpdate}
                editingRowIndex={editingRowIndex}
                suggestions={suggestions}
                handleSuggestionSelect={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default PlaygroundUpload;