import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import SemiCircle from "../components/SemiCircle";
import { useNavigate, useParams } from "react-router-dom";
import AbnormalityBar from "../components/AbnormalityBar";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { GridLoader } from "react-spinners";

import {
  FaRegEye,
  FaRegEyeSlash,
  FaDownload,
  FaArrowRight,
  FaUser,
} from "react-icons/fa6";
import { GoZoomIn, GoZoomOut } from "react-icons/go";
import Progress from "../components/Progress";
import config from "../utils/config";
import { toast } from "react-toastify";
import { MdClose, MdOutlineZoomInMap, MdZoomOutMap } from "react-icons/md";
import { useSelector } from "react-redux";
import abnormalityLinks from "../utils/abnormalityLinks";
import { BsThreeDots } from "react-icons/bs";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/20/solid";
import CustomTooltip from "../components/CustomToolTip";
import { FaCross } from "react-icons/fa";
import ResponsiveTable from "../components/ResponsiveTable";

const Heatmap = () => {
  const { patientSlug, xraySlug } = useParams();
  const [patientData, setPatientData] = useState(null);
  const [xrayData, setXrayData] = useState(null);
  const [abnormalities, setAbnormalities] = useState([]);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [filterValues, setFilterValues] = useState({
    brightness: 0,
    contrast: 0,
    negative: 0,
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [annotationsActive, setAnnotationsActive] = useState(false);
  const [smartZoomActive, setSmartZoomActive] = useState(false);
  const [segmentationActive, setSegmentationActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Patient History");
  const [historyData, setHistoryData] = useState({});
  const [similarCaseData, setSimilarCaseData] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const auth = useSelector((state) => state.auth);
  const [loading,setLoading] = useState(false);
  // const { setModelAnnotatedImage } = useAnnotatedImage();

  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);


  const patientHistoryColumns = [
    {
      header: 'PID',
      render: (xray) => (xray.id ? `...${xray.id.slice(-4)}` : '-'),
    },
    {
      header: 'TB Probability',
      render: (xray) =>
        xray.tbScore != null
          ? xray.tbScore > 90
            ? 'Critical'
            : xray.tbScore > 60
            ? 'High'
            : xray.tbScore > 30
            ? 'Medium'
            : 'Low'
          : '-',
    },
    {
      header: 'Diseases Found',
      render: (xray) =>
        xray.abnormalities?.length > 0 ? (
          <div className="relative group">
            <span>
              {abnormalityLinks[xray.abnormalities[0]] ? (
                <a
                  href={abnormalityLinks[xray.abnormalities[0]]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {xray.abnormalities[0]}
                </a>
              ) : (
                xray.abnormalities[0]
              )}
            </span>
            {xray.abnormalities.length > 1 && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-[#030811] border border-[#fdfdfd] text-[#fdfdfd] text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {xray.abnormalities.slice(1).map((d) => (
                  <div
                    key={d}
                    className="px-4 py-2 border-b border-[#fdfdfd] last:border-b-0"
                  >
                    {abnormalityLinks[d] ? (
                      <a
                        href={abnormalityLinks[d]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {d}
                      </a>
                    ) : (
                      d
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          '-'
        ),
    },
    {
      header: 'Date',
      render: (xray) =>
        xray.createdAt
          ? new Date(xray.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '-',
    },
  ];


  const similarCasesColumns = [
    {
      header: 'PID',
      render: (caseItem) => (caseItem.patientId ? `...${caseItem.patientId.slice(-4)}` : '-'),
    },
    {
      header: 'Location',
      render: (caseItem) => caseItem.location || '-',
    },
    {
      header: 'Diseases Found',
      render: (caseItem) =>
        caseItem.xrays?.[0]?.abnormalities?.length > 0 ? (
          <div className="relative group">
            <span>
              {abnormalityLinks[caseItem.xrays[0].abnormalities[0].name] ? (
                <a
                  href={abnormalityLinks[caseItem.xrays[0].abnormalities[0].name]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {caseItem.xrays[0].abnormalities[0].name}
                </a>
              ) : (
                caseItem.xrays[0].abnormalities[0].name
              )}
            </span>
            {caseItem.xrays[0].abnormalities.length > 1 && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-[#030811] border border-[#fdfdfd] text-[#fdfdfd] text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {caseItem.xrays[0].abnormalities.slice(1).map((abn) => (
                  <div
                    key={abn.name}
                    className="px-4 py-2 border-b border-[#fdfdfd] last:border-b-0"
                  >
                    {abnormalityLinks[abn.name] ? (
                      <a
                        href={abnormalityLinks[abn.name]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {abn.name}
                      </a>
                    ) : (
                      abn.name
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          '-'
        ),
    },
    {
      header: 'Date',
      render: (caseItem) =>
        caseItem.xrays?.[0]?.date
          ? new Date(caseItem.xrays[0].date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '-',
    },
  ];

  const abnormalitiesMap = {
    0: { name: "Lung Nodules", color: "orange" },
    1: { name: "Consolidation", color: "green" },
    2: { name: "Pleural Effusion", color: "blue" },
    3: { name: "Opacity", color: "pink" },
    4: { name: "Rib Fractures", color: "darkorange" },
    5: { name: "Pneumothorax", color: "cyan" },
    6: { name: "Cardiomegaly", color: "purple" },
    7: { name: "Lymphadenopathy", color: "red" },
    8: { name: "Cavity", color: "lightgreen" },
  };

  const warnedRef = useRef(false);

  useEffect(() => {
    if (warnedRef.current) return;
    const isMobile =
      window.innerWidth < 1024 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    if (isMobile) {
      toast.warn("This page is optimized for desktop; mobile design may vary");
      warnedRef.current = true;
    }
  }, []);

  // useEffect(() => {
  //   const canvas = document.getElementById("canvasId");
  //   if (canvas) setModelAnnotatedImage(canvas.toDataURL("image/png"));
  // }, [xrayData]);

  useEffect(() => {
    if (patientSlug && xraySlug) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [
            patientResponse,
            xrayResponse,
            abnormalitiesResponse,
            patientHistoryResponse,
            similarCaseResponse,
          ] = await Promise.all([
            axios.get(`${config.API_URL}/api/patients/${patientSlug}`),
            axios.get(`${config.API_URL}/api/xrays/${xraySlug}`),
            axios.get(`${config.API_URL}/api/xrays/${xraySlug}/abnormalities`),
            axios.get(`${config.API_URL}/api/patients/${patientSlug}/history`),
            axios.get(`${config.API_URL}/api/patients/${patientSlug}/similar`),
          ]);

          setPatientData(patientResponse.data);
          setXrayData(xrayResponse.data);
          setAbnormalities(abnormalitiesResponse.data);
          setHistoryData(patientHistoryResponse.data);
          setSimilarCaseData(similarCaseResponse.data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to load data. Please try again.");
        }
      };
      fetchData();
    }
  }, [patientSlug, xraySlug]);

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const container = containerRef.current;
        if (window.innerWidth < 768) {
          canvasRef.current.width = container.clientWidth;
          canvasRef.current.height = container.clientHeight;
        } else {
          canvasRef.current.width = 1024;
          canvasRef.current.height = 1024;
        }
        // Redraw immediately after resizing
        if (drawImageRef.current) {
          drawImageRef.current();
        }
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);


  const drawImageRef=useRef()
  

  const drawImage = (callback) => {
    if (canvasRef.current && xrayData) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = xrayData?.heatmap;

      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scaleToFit = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const offsetX = (canvas.width - img.width * scaleToFit) / 2;
        const offsetY = (canvas.height - img.height * scaleToFit) / 2;
        ctx.save();
        ctx.translate(offsetX + panOffset.x, offsetY + panOffset.y);
        ctx.scale(scale * scaleToFit, scale * scaleToFit);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const brightness = filterValues.brightness;
        const contrastFactor =
          (259 * (128 + filterValues.contrast)) /
          (255 * (259 - filterValues.contrast));
        const negative = filterValues.negative > 0;

        for (let i = 0; i < data.length; i += 4) {
          data[i] += brightness;
          data[i + 1] += brightness;
          data[i + 2] += brightness;
          data[i] = contrastFactor * (data[i] - 128) + 128;
          data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128;
          data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128;
          if (negative) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
        if (callback) callback(ctx, { scaleToFit, offsetX, offsetY });
      };
      img.onerror = () => {
        console.error("Failed to load X-ray image:", img.src);
        toast.error("X-ray image failed to load.");
      };
    }
  };

  useEffect(() => {
    drawImageRef.current = drawImage;
  }, [drawImage]);

  const drawAnnotations = (ctx) => {
    if (abnormalities.length === 0) return;
    abnormalities.forEach((abnormality) => {
      let coords = abnormality.annotation_coordinates;
      if (typeof coords === "string") {
        coords = coords.split(",").map(Number);
      }
      const disease = abnormality.name || "Unknown";
      const color = abnormalitiesMap[disease]?.color || "red";
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      if (coords.length === 4) {
        const [x1, y1, x2, y2] = coords;
        const adjustedX1 = x1 * scale + panOffset.x;
        const adjustedY1 = y1 * scale + panOffset.y;
        const adjustedX2 = x2 * scale + panOffset.x;
        const adjustedY2 = y2 * scale + panOffset.y;
        ctx.strokeRect(
          adjustedX1,
          adjustedY1,
          adjustedX2 - adjustedX1,
          adjustedY2 - adjustedY1
        );
        ctx.font = `${18 * scale}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          disease,
          adjustedX1 + (adjustedX2 - adjustedX1) / 2,
          adjustedY2 + 14 * scale
        );
      }
    });
  };

  const drawModelAnnotation = () => {
    if (!canvasRef.current || !xrayData) return;
    drawImage((ctx) => {
      if (annotationsActive) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawImage();
      } else {
        drawAnnotations(ctx);
      }
    });
    setAnnotationsActive(!annotationsActive);
  };

  const handleSegmentationToggle = () => {
    if (!canvasRef.current || !xrayData) return;
    drawImage((ctx, { scaleToFit, offsetX, offsetY }) => {
      if (!segmentationActive) {
        ctx.save();
        ctx.translate(offsetX + panOffset.x, offsetY + panOffset.y);
        ctx.scale(scale * scaleToFit, scale * scaleToFit);
        abnormalities.forEach((abnormality) => {
          if (
            abnormality.segmentation &&
            Array.isArray(abnormality.segmentation) &&
            abnormality.segmentation.length > 0
          ) {
            const segData = abnormality.segmentation[0];
            const color =
              abnormalitiesMap[abnormality.name]?.color || "magenta";
            ctx.beginPath();
            ctx.moveTo(segData[0], segData[1]);
            for (let i = 2; i < segData.length; i += 2) {
              ctx.lineTo(segData[i], segData[i + 1]);
            }
            ctx.closePath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / (scale * scaleToFit);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.05;
            ctx.fill();
            ctx.globalAlpha = 0.05;
          }
        });
        ctx.restore();
      } else {
        drawImage((ctx) => {
          if (annotationsActive) drawAnnotations(ctx);
        });
      }
    });
    setSegmentationActive((prev) => !prev);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1));
  };

  const handleSmartZoom = () => {
    if (!smartZoomActive) {
      const canvas = canvasRef.current;
      if (!canvas || !xrayData?.zoom) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = xrayData.url;
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const sFit = Math.min(cw / imgWidth, ch / imgHeight);
        const { x: zx, y: zy, width: zw, height: zh } = xrayData.zoom;
        const newScale = Math.min(cw / (zw * sFit), ch / (zh * sFit));
        const offsetX = (cw - imgWidth * sFit) / 2;
        const offsetY = (ch - imgHeight * sFit) / 2;
        const regionCenterX = zx + zw / 2;
        const regionCenterY = zy + zh / 2;
        const newPanX = cw / 2 - offsetX - regionCenterX * newScale * sFit;
        const newPanY = ch / 2 - offsetY - regionCenterY * newScale * sFit;
        setScale(newScale);
        setPanOffset({ x: newPanX, y: newPanY });
        drawImage((ctx) => {
          if (annotationsActive) drawAnnotations(ctx);
        });
        setSmartZoomActive(true);
      };
    } else {
      resetFilters();
      setSmartZoomActive(false);
    }
  };

  const handleWheel = (e) => {
    setScale((prevScale) =>
      Math.min(Math.max(prevScale + e.deltaY * -0.001, 1), 3)
    );
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsPanning(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const { x, y } = panOffset;
      const handleMouseMove = (event) => {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const newX = x + dx;
        const newY = y + dy;
        const canvas = canvasRef.current;
        const imgWidth = canvas.width * scale;
        const imgHeight = canvas.height * scale;
        const maxOffsetX = Math.max(0, (imgWidth - canvas.width) / 2);
        const maxOffsetY = Math.max(0, (imgHeight - canvas.height) / 2);
        setPanOffset({
          x: Math.min(Math.max(newX, -maxOffsetX), maxOffsetX),
          y: Math.min(Math.max(newY, -maxOffsetY), maxOffsetY),
        });
      };
      const handleMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  useEffect(() => {
    drawImage((ctx, { scaleToFit, offsetX, offsetY }) => {
      if (annotationsActive) drawAnnotations(ctx);
      if (segmentationActive) {
        ctx.save();
        ctx.translate(offsetX + panOffset.x, offsetY + panOffset.y);
        ctx.scale(scale * scaleToFit, scale * scaleToFit);
        abnormalities.forEach((abnormality) => {
          if (
            abnormality.segmentation &&
            Array.isArray(abnormality.segmentation) &&
            abnormality.segmentation.length > 0
          ) {
            let segData = abnormality.segmentation[0];
            const points = [];
            for (let i = 0; i < segData.length; i += 2) {
              if (segData[i] !== undefined && segData[i + 1] !== undefined) {
                points.push([segData[i], segData[i + 1]]);
              }
            }
            if (points.length > 0) {
              ctx.beginPath();
              ctx.moveTo(points[0][0], points[0][1]);
              points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
              const color =
                Object.values(abnormalitiesMap).find(
                  (a) => a.name === abnormality.name
                )?.color || "blue";
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5 / (scale * scaleToFit);
              ctx.stroke();
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.08;
              ctx.fill();
              ctx.globalAlpha = 1.0;
              const [x, y] = points[0];
              ctx.font = `${16 * scale}px Arial`;
              ctx.textAlign = "center";
              ctx.fillStyle = color;
              ctx.fillText(abnormality.name, x, y - 10 * scale);
            }
          }
        });
        ctx.restore();
      }
    });
  }, [
    xrayData,
    filterValues,
    scale,
    panOffset,
    annotationsActive,
    segmentationActive,
  ]);

  const resetFilters = () => {
    setFilterValues({ brightness: 0, contrast: 0, negative: 0 });
    setActiveFilter(null);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const renderFilterSlider = (filter) => (
    <div className="flex flex-col bg-[#1a1a2e] p-4 shadow-lg rounded-md w-64 z-50">
      <h3 className="text-lg text-[#fdfdfd] mb-2 font-semibold">
        Adjust {filter.charAt(0).toUpperCase() + filter.slice(1)}
      </h3>
      <input
        type="range"
        min={-100}
        max={100}
        value={filterValues[filter]}
        onChange={(e) => setFilterValues({ ...filterValues, [filter]: parseInt(e.target.value) })}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
      />
      <div className="text-white mt-2 text-sm">
        Value: <span className="font-semibold">{filterValues[filter]}</span>
      </div>
      <button
        onClick={() => setActiveFilter(null)}
        className="mt-4 p-2 bg-[#5c60c6] text-[#fdfdfd] font-semibold rounded hover:bg-[#030811] border-1 hover:border-[#5c60c6] transition-colors"
      >
        Close
      </button>
    </div>
  );
  
  const handleZoomAnnotation = (zoomType) => {
    setScale((prevScale) => {
      const newScale =
        zoomType === "in"
          ? Math.min(prevScale + 0.1, 3)
          : Math.max(prevScale - 0.1, 1);
      drawImage((ctx) => drawAnnotations(ctx));
      return newScale;
    });
  };

  const handleEditClick = () => {
    navigate(`/analysis/${patientSlug}/${xraySlug}/edit`);
  };

  const handleHeatmapClick = () => {
    navigate(`/analysis/${patientSlug}/${xraySlug}/heatmap`);
  };

  const handleQuadrantClick = () => {
    navigate(`/analysis/${patientSlug}/${xraySlug}/quadrant`);
  };

  const handleDownload = () => {
    const canvas = document.getElementById("canvasId");
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `xray-${xraySlug}.png`;
      link.click();
    }
    toast.success("Image downloaded successfully!");
  };

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${config.API_URL}/api/xrays/dicom/update/${xraySlug}`,
        { note },
        { withCredentials: true }
      );
      toast.success("Note submitted successfully!");
      setNote("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting Note:", error);
      toast.error("Failed to submit Note. Please try again.");
    }
  };

  const handleViewSubmit = () => {
    axios
      .put(
        `${config.API_URL}/api/xrays/dicom/update/${xraySlug}`,
        { view: selectedView },
        { withCredentials: true }
      )
      .then(() => toast.success("View updated successfully!"))
      .catch((error) => {
        console.error("Error updating view:", error);
        toast.error("Error updating view. Please try again.");
      });
  };

  // const captureAndUploadScreenshot = async () => {
  //   if (!canvasRef.current) return;
  //   canvasRef.current.toBlob(async (blob) => {
  //     if (!blob) return;
  //     const formData = new FormData();
  //     formData.append("modelannotated", blob, "screenshot.png");
  //     try {
  //       await axios.put(
  //         `${config.API_URL}/api/xrays/dicom/update/${xraySlug}`,
  //         formData,
  //         {
  //           withCredentials: true,
  //           headers: { "Content-Type": "multipart/form-data" },
  //         }
  //       );
  //     } catch (error) {
  //       console.error("Failed to upload screenshot:", error);
  //     }
  //   }, "image/png");
  // };

  // useEffect(() => {
  //   const timer = setTimeout(() => captureAndUploadScreenshot(), 5000);
  //   return () => clearTimeout(timer);
  // }, []);

  const rowsPerPage = 7;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(1), [activeTab]);

  const paginate = (items) => {
    if (!Array.isArray(items)) return [];
    const start = (currentPage - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  };

  const totalPages = (items) =>
    Array.isArray(items) ? Math.ceil(items.length / rowsPerPage) : 1;

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = (items) =>
    setCurrentPage((p) => Math.min(p + 1, totalPages(items)));

  const ToolbarButton = ({ children, onClick, className, mouseY, label, isActive }) => {
    const ref = useRef();
    const distance = 100;
    const baseSize = 40;
    const maxSize = 48;
    const isHovered = useMotionValue(0);

    const mouseDistance = useTransform(mouseY, (val) => {
      if (!ref.current || val === Infinity) return Infinity;
      const rect = ref.current.getBoundingClientRect();
      return val - (rect.top + rect.height / 2);
    });

    const size = useTransform(mouseDistance, [-distance, 0, distance], [baseSize, maxSize, baseSize]);
    const animatedSize = useSpring(size, { mass: 0.1, stiffness: 150, damping: 12 });

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        className={`flex items-center justify-center rounded-xl p-2 ${className} ${isActive ? 'bg-red-500' : ''}`}
        style={{ width: animatedSize, height: animatedSize }}
        onHoverStart={() => isHovered.set(1)}
        onHoverEnd={() => isHovered.set(0)}
        onFocus={() => isHovered.set(1)}
        onBlur={() => isHovered.set(0)}
      >
        {children}
        <AnimatePresence>
          {isHovered.get() === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 10 }}
              exit={{ opacity: 0, x: 0 }}
              className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-[#060606] text-white px-2 py-1 rounded text-sm"
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  const Toolbar = () => {
    const mouseY = useMotionValue(Infinity);

    return (
      <motion.div
        onMouseMove={(e) => mouseY.set(e.clientY)}
        onMouseLeave={() => mouseY.set(Infinity)}
        className="flex flex-col items-center gap-y-6"
      >
        <CustomTooltip title="AI Annotation">
        <ToolbarButton
          onClick={handleSegmentationToggle}
          className={`rounded-xl p-2 ${segmentationActive ? "bg-red-500" : "dark:bg-[#030811] bg-[#fdfdfd]"} dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]`}
          mouseY={mouseY}
          label="AI Annotation"
          isActive={segmentationActive}
        >
          {segmentationActive ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Smart Zoom">
        <ToolbarButton
          onClick={handleSmartZoom}
          className="dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
          mouseY={mouseY}
          label="Smart Zoom"
          isActive={smartZoomActive}
        >
          {smartZoomActive ? <MdZoomOutMap size={20} /> : <MdOutlineZoomInMap size={20} />}
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Heatmap">
        <ToolbarButton
          onClick={handleHeatmapClick}
          className="dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
          mouseY={mouseY}
          label="Heatmap"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a.5.5 0 0 1 .5.5v5.243L9 7.1V4.72C9 3.77 9.77 3 10.72 3c.524 0 1.023.27 1.443.592.431.332.847.773 1.216 1.229.736.908 1.347 1.946 1.58 2.48.176.405.393 1.16.556 2.011.165.857.283 1.857.24 2.759-.04.867-.232 1.79-.837 2.33-.67.6-1.622.556-2.741-.004l-1.795-.897A2.5 2.5 0 0 1 9 11.264V8.329l-1-.715-1 .715V7.214c-.1 0-.202.03-.29.093l-2.5 1.786a.5.5 0 1 0 .58.814L7 8.329v2.935A2.5 2.5 0 0 1 5.618 13.5l-1.795.897c-1.12.56-2.07.603-2.741.004-.605-.54-.798-1.463-.838-2.33-.042-.902.076-1.902.24-2.759.164-.852.38-1.606.558-2.012.232-.533.843-1.571 1.579-2.479.37-.456.785-.897 1.216-1.229C4.257 3.27 4.756 3 5.28 3 6.23 3 7 3.77 7 4.72V7.1l.5-.357V1.5A.5.5 0 0 1 8 1m3.21 8.907a.5.5 0 1 0 .58-.814l-2.5-1.786A.5.5 0 0 0 9 7.214V8.33z" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Quadrant">
        <ToolbarButton
          onClick={handleQuadrantClick}
          className="dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
          mouseY={mouseY}
          label="Quadrant"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 0h16v16H0zm1 1v6.5h6.5V1zm7.5 0v6.5H15V1zM15 8.5H8.5V15H15zM7.5 15V8.5H1V15z" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Zoom in">
        <ToolbarButton
          onClick={annotationsActive ? () => handleZoomAnnotation("in") : handleZoomIn}
          className="dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
          mouseY={mouseY}
          label="Zoom In"
        >
          <GoZoomIn size={24} />
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Zoom out">
        <ToolbarButton
          onClick={annotationsActive ? () => handleZoomAnnotation("out") : handleZoomOut}
          className="dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
          mouseY={mouseY}
          label="Zoom Out"
        >
          <GoZoomOut size={24} />
        </ToolbarButton>
        </CustomTooltip>
        {["brightness", "contrast", "negative"].map((filter) => (
          <div key={filter} className="relative">
            <ToolbarButton
              onClick={() => {
                if (filter === "negative") {
                  setFilterValues((prev) => ({ ...prev, negative: prev.negative === 0 ? 1 : 0 }));
                } else {
                  setActiveFilter((prev) => (prev === filter ? null : filter));
                }
              }}
              className={`dark:text-[#fdfdfd] text-[#030811] ${activeFilter === filter ? "bg-[#5c60c6]" : "dark:bg-[#000000] bg-[#fdfdfd]"} dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]`}
              mouseY={mouseY}
              label={filter.charAt(0).toUpperCase() + filter.slice(1)}
            >
             
              {filter === "brightness" && (
                 <CustomTooltip title="Brightness">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
                </svg>
                </CustomTooltip>
              )}
              {filter === "contrast" && (
                <CustomTooltip title="Contrast">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1V2a6 6 0 1 0 0 12z" />
                </svg>
                </CustomTooltip>
              )}
              {filter === "negative" && (
                <CustomTooltip title="Negative">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8zm7-4.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 1 0v-8a.5.5 0 0 0-.5-.5z" />
                </svg>
                </CustomTooltip>
              )}
            </ToolbarButton>
            {filter !== "negative" && activeFilter === filter && (
              <div className="absolute left-full ml-2 top-0 z-50">
                {renderFilterSlider(filter)}
              </div>
            )}
          </div>
        ))}
        <CustomTooltip title="Reset">
        <ToolbarButton
          onClick={resetFilters}
          className="bg-[#5c60c6] text-[#fdfdfd] hover:bg-[#030811]"
          mouseY={mouseY}
          label="Reset Filters"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Edit">
        <ToolbarButton
          onClick={handleEditClick}
          className="bg-[#5c60c6] text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          mouseY={mouseY}
          label="Edit Page"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Note">
        <ToolbarButton
          onClick={toggleModal}
          className="bg-[#5c60c6] text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          mouseY={mouseY}
          label="Feedback"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 15 8.586V2.5A1.5 1.5 0 0 0 13.5 1zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V8H9.5A1.5 1.5 0 0 0 8 9.5V14H2.5a.5.5 0 0 1-.5-.5zm7 11.293V9.5a.5.5 0 0 1 .5-.5h4.293z" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
        <CustomTooltip title="Back">
        <ToolbarButton
          onClick={() => navigate(-1)}
          className="bg-[#5c60c6] text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          mouseY={mouseY}
          label="Back"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
          </svg>
        </ToolbarButton>
        </CustomTooltip>
      </motion.div>
    );
  };

  return (
    <div className="flex md:flex-row flex-col min-h-screen dark:bg-gradient-to-b dark:bg-[#030811] bg-[#fdfdfd]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-[#030811] p-2 flex justify-between items-center z-10">
        {/* <span className="text-[#fdfdfd]">{patientData?.patient.patientId}</span> */}
        <button
            onClick={() => setIsPatientDrawerOpen(true)}
            className="mr-2 text-[#fdfdfd]"
          >
            <FaUser size={20} />
          </button>
<div className="flex items-center ml-20 pl-5">
  <img className="w-[55%] h-13 invert grayscale dark:invert-0 hover:opacity-80 cursor-pointer" src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png" alt="Logo" onClick={() => navigate("/")} />
</div>
        <div>
      
          <button
            onClick={() => setIsAnalysisDrawerOpen(true)}
            className="text-[#fdfdfd]"
          >
            <BsThreeDots size={20} />
          </button>
        </div>
      </div>

      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:block w-[35%] min-h-screen dark:bg-[#030811] bg-[#fdfdfd] dark:text-white text-[#030811] flex-col py-4">
        <img
          src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"
          alt="Logo"
          onClick={() => navigate("/")}
          className="w-[35%] h-13 invert grayscale dark:invert-0 hover:opacity-80 cursor-pointer mb-10"
        />
        <div className="flex">
          <aside className="w-20 mr-1 flex flex-col items-center border-r dark:border-[#fdfdfd] border-[#030811]">
            <Toolbar />
          </aside>
          <div className="w-[20vw]">
            <h1 className="text-transparent pl-12 ml-10 text-3xl font-bold gradient-animated">
              CXR Analysis
            </h1>
            <div className="flex dark:text-[#fdfdfd] text-[#030811] justify-center items-center mr-10 ml-12 mt-5 mb-8 border-2">
              {patientData?.patient.patientId}
            </div>
            <div className="flex items-center justify-center w-45 mt-3">
              <div className="relative flex items-center dark:bg-[#030811] bg-[#fdfdfd] border dark:border-[#4A4A4A] border-[#5c60c6] rounded-full overflow-hidden w-80">
                <div
                  className={`absolute top-0 left-0 h-full w-1/2 dark:bg-[#fdfdfd] bg-[#5c60c6] rounded-full transition-all duration-300 ${activeTab === "Similar Cases" ? "translate-x-full" : "translate-x-0"}`}
                ></div>
                <button
                  className={`relative z-10 flex-1 px-6 py-2 text-sm font-medium ${activeTab === "Patient History" ? "dark:text-black text-white" : "dark:text-white text-black"}`}
                  onClick={() => setActiveTab("Patient History")}
                >
                  Patient History
                </button>
                <button
                  className={`relative z-10 flex-1 px-6 py-2 text-sm font-medium ${activeTab === "Similar Cases" ? "dark:text-black text-white" : "dark:text-white text-black"}`}
                  onClick={() => setActiveTab("Similar Cases")}
                >
                  Similar Cases
                </button>
              </div>
            </div>
            <div className="w-full mt-4 h-64 overflow-y-auto">
            <ResponsiveTable
                columns={
                  activeTab === 'Patient History'
                    ? patientHistoryColumns
                    : similarCasesColumns
                }
                data={
                  activeTab === 'Patient History'
                    ? paginate(historyData.xrays)
                    : paginate(
                        similarCaseData.sort(
                          (a, b) => b.xrays?.[0]?.tbScore - a.xrays?.[0]?.tbScore
                        )
                      )
                }
              />
            </div>
            <div className="flex justify-between items-center mt-2 mb-10">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:text-[#fdfdfd] text-[#030811] rounded-full"
              >
                <ArrowLongLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm dark:text-[#fdfdfd] text-[#030811]">
                Record {currentPage} of{' '}
                {activeTab === 'Patient History'
                  ? totalPages(historyData.xrays)
                  : totalPages(similarCaseData)}
              </span>
              <button
                onClick={() =>
                  activeTab === 'Patient History'
                    ? handleNext(historyData.xrays)
                    : handleNext(similarCaseData)
                }
                disabled={
                  currentPage ===
                  (activeTab === 'Patient History'
                    ? totalPages(historyData.xrays)
                    : totalPages(similarCaseData))
                }
                className="px-3 py-1 border rounded disabled:opacity-50 dark:text-[#fdfdfd] text-[#030811] rounded-full"
              >
                <ArrowLongRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="items-left text-left ml-3 dark:text-[#fdfdfd] text-[#030811] border-2 dark:border-[#fdfdfd] border-[#030811] rounded-2xl mt-4 pl-1">
              {patientData && (
                <div>
                  <h2 className="text-xl font-bold text-center">Patient Demographics</h2>
                  <ul className="mt-4 space-y-2">
                    <li><strong>ID:</strong> {patientData.patient.patientId}</li>
                    <li><strong>Age:</strong> {patientData.patient.age}</li>
                    <li><strong>Gender:</strong> {patientData.patient.sex}</li>
                    <li><strong>Location:</strong> {patientData.patient.location}</li>
                  </ul>
                  <div className="mt-2">
                    <strong>View: </strong>
                    <div className="relative inline-block">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-2 ml-2 mb-2 border rounded-full bg-gray-200 dark:bg-[#030811] cursor-pointer inline-flex items-center"
                      >
                        {selectedView || (xrayData && xrayData.view) || "Select View"}
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-[#030811] border rounded shadow">
                          {["PA View", "AP View", "Lateral View", "Decubitus View", "Lordotic"].map((option) => (
                            <div
                              key={option}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                setSelectedView(option);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {(selectedView || (xrayData && xrayData.view)) && (
                      <button onClick={handleViewSubmit} className="ml-1 px-2 py-1 text-[#030811] rounded-full bg-[#5c60c6]">
                        ✔️
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 md:mt-0 mt-16 dark:bg-[#030811] bg-[#fdfdfd] flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={scale > 1 ? handleMouseDown : null}
      >
        {loading && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <GridLoader color="#5c60c6" size={24}/>
                  </div>
                )}
        <canvas
          id="canvasId"
          ref={canvasRef}
          className="rounded-lg"
          style={{ display: "block", visibility: "visible" }}
        ></canvas>
      </div>

      {/* Right Sidebar (Desktop) */}
      <div className="hidden md:block w-[25%] h-screen dark:bg-[#030811] bg-[#fdfdfd] dark:text-white text-[#030811] flex-col justify-between p-4">
        <div className="mb-[50%] overflow-x-auto">
          <Progress
            currentStep="heatmap"
            patientSlug={patientSlug}
            xraySlug={xraySlug}
            onNavigate={navigate}
          />
        </div>
        <div className="text-center items-center ">
          <h2 className="text-2xl mt-3 ml-5 font-bold">TB Probability</h2>
          <div className="mt-4 pl-10">
            <SemiCircle percentage={(xrayData?.tbScore * 100).toFixed(0)} />
          </div>
          <div>
            {abnormalities.length > 0 ? (
              <AbnormalityBar abnormalities={abnormalities} />
            ) : (
              <div className="mt-7 pt-9 text-center text-2xl font-semibold">No abnormalities found</div>
            )}
          </div>
     
          <div className="py-10 pl-20 ml-10 mt-20 items-center justify-center">
            <button
              onClick={handleDownload}
              className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full flex items-center gap-2"
            >
              <FaDownload size={20} />
            </button>
          </div>
          <div className="text-center items-center">
            <p className="text-sm font-medium italic"
            >Note: This is an AI generated diagnosis. The findings are to be used for diagnostic purposes in consultation with a licensed medical expert.</p>
          </div>
        </div>
      </div>

      {/* Patient Drawer (Mobile) */}
      {isPatientDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsPatientDrawerOpen(false)}
          ></div>
          <div className="md:hidden fixed top-0 left-0 w-3/4 h-full bg-[#030811] z-50 p-4 overflow-y-auto dark:text-[#fdfdfd] text-[#030811]">
            <button
              onClick={() => setIsPatientDrawerOpen(false)}
              className="mb-4 p-2 bg-[#5c60c6] text-[#fdfdfd] rounded"
            >
           <MdClose size={20} />
            </button>
            <h1 className="text-2xl font-bold text-center">CXR Analysis</h1>
            <div className="flex justify-center items-center mt-5 mb-8 border-2">
              {patientData?.patient.patientId}
            </div>
            <div className="flex items-center justify-center w-45 mt-3">
              <div className="relative flex items-center dark:bg-[#030811] bg-[#fdfdfd] border dark:border-[#4A4A4A] border-[#5c60c6] rounded-full overflow-hidden w-80">
                <div
                  className={`absolute top-0 left-0 h-full w-1/2 dark:bg-[#fdfdfd] bg-[#5c60c6] rounded-full transition-all duration-300 ${activeTab === "Similar Cases" ? "translate-x-full" : "translate-x-0"}`}
                ></div>
                <button
                  className={`relative z-10 flex-1 px-6 py-2 text-sm font-medium ${activeTab === "Patient History" ? "dark:text-black text-white" : "dark:text-white text-black"}`}
                  onClick={() => setActiveTab("Patient History")}
                >
                  Patient History
                </button>
                <button
                  className={`relative z-10 flex-1 px-6 py-2 text-sm font-medium ${activeTab === "Similar Cases" ? "dark:text-black text-white" : "dark:text-white text-black"}`}
                  onClick={() => setActiveTab("Similar Cases")}
                >
                  Similar Cases
                </button>
              </div>
            </div>
            <div className="w-full mt-4 h-64 overflow-y-auto">
              <ResponsiveTable
                columns={
                  activeTab === 'Patient History'
                    ? patientHistoryColumns
                    : similarCasesColumns
                }
                data={
                  activeTab === 'Patient History'
                    ? paginate(historyData.xrays)
                    : paginate(
                        similarCaseData.sort(
                          (a, b) => b.xrays?.[0]?.tbScore - a.xrays?.[0]?.tbScore
                        )
                      )
                }
              />
            </div>
            <div className="flex justify-between items-center mt-2 mb-10">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 rounded-full"
              >
                <ArrowLongLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm">
                Record {currentPage} of{' '}
                {activeTab === 'Patient History'
                  ? totalPages(historyData.xrays)
                  : totalPages(similarCaseData)}
              </span>
              <button
                onClick={() =>
                  activeTab === 'Patient History'
                    ? handleNext(historyData.xrays)
                    : handleNext(similarCaseData)
                }
                disabled={
                  currentPage ===
                  (activeTab === 'Patient History'
                    ? totalPages(historyData.xrays)
                    : totalPages(similarCaseData))
                }
                className="px-3 py-1 border rounded disabled:opacity-50 rounded-full"
              >
                <ArrowLongRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="items-left text-left border-2 dark:border-[#fdfdfd] border-[#030811] rounded-2xl mt-4 pl-1">
              {patientData && (
                <div>
                  <h2 className="text-xl font-bold text-center">Patient Demographics</h2>
                  <ul className="mt-4 space-y-2">
                    <li><strong>ID:</strong> {patientData.patient.patientId}</li>
                    <li><strong>Age:</strong> {patientData.patient.age}</li>
                    <li><strong>Gender:</strong> {patientData.patient.sex}</li>
                    <li><strong>Location:</strong> {patientData.patient.location}</li>
                  </ul>
                  <div className="mt-2">
                    <strong>View: </strong>
                    <div className="relative inline-block">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-2 ml-2 mb-2 border rounded-full bg-gray-200 dark:bg-[#030811] cursor-pointer inline-flex items-center"
                      >
                        {selectedView || (xrayData && xrayData.view) || "Select View"}
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-[#030811] border rounded shadow">
                          {["PA View", "AP View", "Lateral View", "Decubitus View", "Lordotic"].map((option) => (
                            <div
                              key={option}
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => {
                                setSelectedView(option);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {(selectedView || (xrayData && xrayData.view)) && (
                      <button onClick={handleViewSubmit} className="ml-1 px-2 py-1 text-[#030811] rounded-full bg-[#5c60c6]">
                        ✔️
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analysis Drawer (Mobile) */}
      {isAnalysisDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsAnalysisDrawerOpen(false)}
          ></div>
          <div className="md:hidden fixed top-0 right-0 w-3/4 h-full bg-[#030811] z-50 p-4 overflow-y-auto dark:text-[#fdfdfd] text-[#030811]">
            <button
              onClick={() => setIsAnalysisDrawerOpen(false)}
              className="mb-4 p-2 absolute right-2 bg-[#5c60c6] text-[#fdfdfd] rounded"
            >
              <MdClose size={20} />
            </button>
            <div className="mb-4 overflow-x-auto">
              <Progress
                currentStep="heatmap"
                patientSlug={patientSlug}
                xraySlug={xraySlug}
                onNavigate={navigate}
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl mt-3 font-bold">TB Probability</h2>
              <div className="mt-4">
                <SemiCircle percentage={(xrayData?.tbScore * 100).toFixed(0)} />
              </div>
              <div>
                {abnormalities.length > 0 ? (
                  <AbnormalityBar abnormalities={abnormalities} />
                ) : (
                  <div className="mt-7 pt-9 text-center text-2xl font-semibold">No abnormalities found</div>
                )}
              </div>
              <div className="mt-10 pt-10 pl-10 ml-10 items-center justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full flex items-center gap-2"
                >
                  <FaDownload size={20} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#030811] p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-xl font-bold text-[#fdfdfd] mb-4">Submit Note</h2>
            <textarea
              className="w-full h-40 p-4 bg-[#030811] text-[#fdfdfd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
              placeholder="Enter your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
            <div className="flex justify-end mt-4 space-x-4">
              <button
                type="button"
                onClick={toggleModal}
                className="py-2 px-4 bg-gray-500 text-[#fdfdfd] rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleNoteSubmit}
                className="py-2 px-4 bg-[#5c60c6] text-[#fdfdfd] rounded-lg hover:bg-[#030811] border border-[#5c60c6]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;