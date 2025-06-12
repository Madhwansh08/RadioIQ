import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiUndo, CiRedo, CiSaveDown1 } from "react-icons/ci";
import { RxReset } from "react-icons/rx";
import { TbPoint } from "react-icons/tb";
import { IoMdArrowBack } from "react-icons/io";
import { FaInfoCircle } from "react-icons/fa";
import { PiBoundingBoxThin, PiCircle, PiInfoBold } from "react-icons/pi";
import { FaRegHandPaper, FaUser, FaDownload } from "react-icons/fa";
import { BsCircleHalf, BsThreeDots } from "react-icons/bs";
import { GoDownload } from "react-icons/go";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import config from "../utils/config";
import pointgif from "../assets/PA.gif";
import ovalgif from "../assets/RV_oval.gif";
import boxgif from "../assets/RV_sq.gif";
import freegif from "../assets/RV_free.gif";
import ToolTip from "../components/ToolTip";
import { useSelector } from "react-redux";
import axios from "axios";
import ModalDiseaseInfo from "../components/ModalDiseaseInfo";
import UsbFolderPicker from "../components/UsbFolderPicker";
import { BarLoader } from "../components/BarLoader";

const SemiCircle = lazy(() => import("../components/SemiCircle"));
const AbnormalityBar = lazy(() => import("../components/AbnormalityBar"));
const LabelModal = lazy(() => import("../components/LabelModal"));
const Progress = lazy(() => import("../components/Progress"));

const AnalysisEdit = () => {
  const { patientSlug, xraySlug } = useParams();
  const [xrayData, setXrayData] = useState(null);
  const [abnormalities, setAbnormalities] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [annotationMode, setAnnotationMode] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [freehandPath, setFreehandPath] = useState([]);
  const canvasRef = useRef(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [tempAnnotation, setTempAnnotation] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(0.7);
  const [negative, setNegative] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [annotationSaved, setAnnotationSaved] = useState(true);
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);
  const [isToolDrawerOpen, setIsToolDrawerOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [usbModalOpen, setUsbModalOpen] = useState(false);
  const [pendingImageBlob, setPendingImageBlob] = useState(null);
  const [savingToUsb, setSavingToUsb] = useState(false);

  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const handleNavigation = (path) => {
    if (!annotationSaved) {
      toast.warning("Save annotations before moving to the next page!");
      return;
    }
    navigate(path);
  };

  const fetchXrayData = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/xrays/${xraySlug}`);
      const data = await response.json();
      setXrayData(data);

      const abnormalitiesResponse = await fetch(
        `${config.API_URL}/api/xrays/${xraySlug}/abnormalities`
      );
      const abnormalitiesData = await abnormalitiesResponse.json();
      setAbnormalities(abnormalitiesData);
    } catch (error) {
      console.error("Error fetching X-ray data:", error);
    }
  }, [xraySlug]);

  useEffect(() => {
    fetchXrayData();
  }, [fetchXrayData]);

  const memoizedAbnormalities = useMemo(() => abnormalities, [abnormalities]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas || !xrayData) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = xrayData.url;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `
        brightness(${brightness})
        contrast(${contrast})
        ${negative ? "invert(1)" : ""}
      `;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw saved annotations
      annotations.forEach((annotation) => {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.lineWidth = 3;

        if (annotation.type === "Box") {
          ctx.strokeRect(
            annotation.x,
            annotation.y,
            annotation.width,
            annotation.height
          );
          ctx.fillRect(
            annotation.x,
            annotation.y,
            annotation.width,
            annotation.height
          );
          if (annotation.label) {
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.fillText(annotation.label, annotation.x + 5, annotation.y - 5);
          }
        } else if (annotation.type === "Oval") {
          ctx.beginPath();
          ctx.ellipse(
            annotation.x,
            annotation.y,
            annotation.radiusX,
            annotation.radiusY,
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          ctx.fill();
          if (annotation.label) {
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.fillText(annotation.label, annotation.x + 5, annotation.y - 5);
          }
        } else if (annotation.type === "Point") {
          ctx.beginPath();
          ctx.arc(annotation.x, annotation.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0, 150, 255, 0.7)";
          ctx.fill();
          if (annotation.label) {
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.fillText(annotation.label, annotation.x + 8, annotation.y - 8);
          }
        } else if (annotation.type === "Freehand") {
          ctx.beginPath();
          annotation.path.forEach(([x, y], i) => {
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
          if (annotation.label) {
            const [x, y] = annotation.path[0];
            ctx.fillStyle = "white";
            ctx.font = "14px Arial";
            ctx.fillText(annotation.label, x + 5, y - 5);
          }
        }
      });

      // Real-time annotations
      if (currentAnnotation && annotationMode === "Box") {
        ctx.strokeRect(
          currentAnnotation.x,
          currentAnnotation.y,
          currentAnnotation.width,
          currentAnnotation.height
        );
        ctx.fillRect(
          currentAnnotation.x,
          currentAnnotation.y,
          currentAnnotation.width,
          currentAnnotation.height
        );
      } else if (currentAnnotation && annotationMode === "Oval") {
        ctx.beginPath();
        ctx.ellipse(
          currentAnnotation.x,
          currentAnnotation.y,
          currentAnnotation.radiusX,
          currentAnnotation.radiusY,
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        ctx.fill();
      } else if (annotationMode === "Freehand" && freehandPath.length) {
        ctx.beginPath();
        freehandPath.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.stroke();
      }
    };
  };

  useEffect(() => {
    drawAnnotations();
  }, [
    xrayData,
    annotations,
    currentAnnotation,
    freehandPath,
    brightness,
    contrast,
    negative,
  ]);

  const getCanvasCoordinates = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    if (annotationMode === "Box") {
      setCurrentAnnotation({ type: "Box", x, y, width: 0, height: 0 });
      setIsDrawing(true);
    } else if (annotationMode === "Point") {
      const newAnnotation = { type: "Point", x, y };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setTempAnnotation(newAnnotation);
      setIsLabelModalOpen(true);
    } else if (annotationMode === "Oval") {
      setCurrentAnnotation({ type: "Oval", x, y, radiusX: 0, radiusY: 0 });
      setIsDrawing(true);
    } else if (annotationMode === "Freehand") {
      setFreehandPath([[x, y]]);
      setIsDrawing(true);
    }
    setAnnotationSaved(false);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    if (annotationMode === "Box" && currentAnnotation) {
      setCurrentAnnotation((prev) => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y,
      }));
    } else if (annotationMode === "Oval" && currentAnnotation) {
      const radiusX = Math.abs(x - currentAnnotation.x);
      const radiusY = Math.abs(y - currentAnnotation.y);
      setCurrentAnnotation((prev) => ({
        ...prev,
        radiusX,
        radiusY,
      }));
    } else if (annotationMode === "Freehand") {
      setFreehandPath((prev) => [...prev, [x, y]]);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    if (annotationMode === "Box" && currentAnnotation) {
      const newAnnotations = [...annotations, currentAnnotation];
      setUndoStack([...undoStack, annotations]);
      setRedoStack([]);
      setAnnotations(newAnnotations);
      setTempAnnotation(currentAnnotation);
      setIsLabelModalOpen(true);
      setCurrentAnnotation(null);
    } else if (annotationMode === "Oval" && currentAnnotation) {
      const newAnnotations = [...annotations, currentAnnotation];
      setUndoStack([...undoStack, annotations]);
      setRedoStack([]);
      setAnnotations(newAnnotations);
      setTempAnnotation(currentAnnotation);
      setIsLabelModalOpen(true);
      setCurrentAnnotation(null);
    } else if (annotationMode === "Freehand" && freehandPath.length > 1) {
      const newAnnotation = { type: "Freehand", path: freehandPath };
      const newAnnotations = [...annotations, newAnnotation];
      setUndoStack([...undoStack, annotations]);
      setRedoStack([]);
      setAnnotations(newAnnotations);
      setTempAnnotation(newAnnotation);
      setIsLabelModalOpen(true);
      setFreehandPath([]);
    }
    setIsDrawing(false);
  }, [isDrawing, annotationMode, currentAnnotation, freehandPath, annotations, undoStack]);

  const saveAnnotations = async () => {
    try {
      const response = await axios.put(
        `${config.API_URL}/api/xrays/dicom/update/${xraySlug}`,
        {
          annotations,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const canvas = document.getElementById("canvasId1");
        // setAnnotatedImage(canvas.toDataURL("image/png"));
        toast.success("Annotations saved successfully!");
        setAnnotationSaved(true);
      }
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast.error("Error saving annotations.");
    }
  };

  const resetAnnotations = () => {
    setBrightness(1);
    setContrast(0.7);
    setNegative(false);
    setAnnotations([]);
    setUndoStack([...undoStack, annotations]);
    setFreehandPath([]);
    setRedoStack([]);
  };

  const saveLabel = useCallback(
    (label) => {
      if (tempAnnotation) {
        const annotationIndex = annotations.findIndex((annotation) => {
          if (annotation.type === tempAnnotation.type) {
            if (annotation.type === "Box") {
              return (
                annotation.x === tempAnnotation.x &&
                annotation.y === tempAnnotation.y &&
                annotation.width === tempAnnotation.width &&
                annotation.height === tempAnnotation.height
              );
            } else if (annotation.type === "Point") {
              return (
                annotation.x === tempAnnotation.x &&
                annotation.y === tempAnnotation.y
              );
            } else if (annotation.type === "Oval") {
              return (
                annotation.x === tempAnnotation.x &&
                annotation.y === tempAnnotation.y &&
                annotation.radiusX === tempAnnotation.radiusX &&
                annotation.radiusY === tempAnnotation.radiusY
              );
            } else if (annotation.type === "Freehand") {
              return annotation.path === tempAnnotation.path;
            }
          }
          return false;
        });

        if (annotationIndex !== -1) {
          const updatedAnnotations = [...annotations];
          updatedAnnotations[annotationIndex] = {
            ...updatedAnnotations[annotationIndex],
            label,
          };
          setAnnotations(updatedAnnotations);
        }
      }
      setIsLabelModalOpen(false);
    },
    [annotations, tempAnnotation]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastState = undoStack.pop();
    setRedoStack([annotations, ...redoStack]);
    setAnnotations(lastState);
  });

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.shift();
    setUndoStack([...undoStack, annotations]);
    setAnnotations(nextState);
  });

  const handleDownload = () => {
    try {
      const canvas = document.getElementById("canvasId1");
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            setPendingImageBlob(blob);
            setUsbModalOpen(true); // Open USB picker modal
          } else {
            toast.error("Canvas conversion failed.");
          }
        }, "image/png");
      }
    } catch (error) {
      console.error("Error preparing image for USB save:", error);
      toast.error("Failed to prepare image. Please try again.");
    }
  };


  const handleGoBack = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    if (xrayData && xrayData.annotations) {
      setAnnotations(xrayData.annotations);
    }
  }, [xrayData]);

  // Mobile Toolbar Component
  const MobileToolbar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[#030811] p-2 flex justify-around items-center z-10 md:hidden">
      <button
        onClick={() => setAnnotationMode("Box")}
        className={`p-2 rounded-full ${annotationMode === "Box" ? "bg-[#5c60c6]" : "bg-[#030811]"}`}
      >
        <PiBoundingBoxThin size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={() => setAnnotationMode("Oval")}
        className={`p-2 rounded-full ${annotationMode === "Oval" ? "bg-[#5c60c6]" : "bg-[#030811]"}`}
      >
        <PiCircle size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={() => setAnnotationMode("Point")}
        className={`p-2 rounded-full ${annotationMode === "Point" ? "bg-[#5c60c6]" : "bg-[#030811]"}`}
      >
        <TbPoint size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={() => setAnnotationMode("Freehand")}
        className={`p-2 rounded-full ${annotationMode === "Freehand" ? "bg-[#5c60c6]" : "bg-[#030811]"}`}
      >
        <FaRegHandPaper size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={undo}
        className="p-2 rounded-full bg-[#030811]"
      >
        <CiUndo size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={redo}
        className="p-2 rounded-full bg-[#030811]"
      >
        <CiRedo size={20} className="text-[#fdfdfd]" />
      </button>
      <button
        onClick={() => setIsToolDrawerOpen(true)}
        className="p-2 rounded-full bg-[#5c60c6]"
      >
        <BsThreeDots size={20} className="text-[#fdfdfd]" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen dark:bg-[#030811] bg-[#fdfdfd]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-[#030811] p-2 flex justify-between items-center z-10">
        <button
          onClick={handleGoBack}
          className="text-[#fdfdfd]"
        >
          <IoMdArrowBack size={20} />
        </button>
        <div className="flex items-center ml-28">
          <img
            className="w-[55%] h-13 invert grayscale dark:invert-0 hover:opacity-80 cursor-pointer"
            src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"
            alt="Logo"
            onClick={() => navigate("/")}
          />
        </div>
        <button
          onClick={() => setIsPatientDrawerOpen(true)}
          className="text-[#fdfdfd]"
        >
          <BsThreeDots size={20} />
        </button>
      </div>

      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:block max-w-[35%] min-h-screen dark:bg-[#030811] bg-[#fdfdfd] dark:text-[#fdfdfd] text-[#030811]">
        <div className="relative items-center gap-10 flex flex-col bg-clip-border ml-10 dark:bg-[#030811] bg-[#fdfdfd] h-[calc(100vh-2rem)] w-full max-w-[20rem] p-4">
          <div>
            <img
              src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"
              alt="logo"
              className="w-[90%] h-10 mx-auto invert grayscale dark:invert-0"
            />
          </div>
          <nav className="flex flex-col gap-1 min-w-[240px] p-2 font-sans text-base font-normal">
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-[#030811] dark:text-[#fdfdfd] mb-2">
                  Brightness
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[#030811] dark:text-[#fdfdfd] mb-2">
                  Contrast
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="2"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <button
              onClick={() => setNegative(!negative)}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-gray-50 active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <BsCircleHalf size={24} />
              </div>
              Negative
            </button>

            <button
              onClick={() => setAnnotationMode("Box")}
              className="relative flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-gray-50 active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <PiBoundingBoxThin size={24} />
              </div>
              Box Annotation
              <div className="absolute top-1 right-1">
                <span
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredTool("Box")}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <PiInfoBold size={20} className="text-[#5c60c6] hover:text-[#030811]" />
                  <ToolTip isHovered={hoveredTool === "Box"} gifSrc={boxgif} />
                </span>
              </div>
            </button>

            <button
              onClick={() => setAnnotationMode("Oval")}
              className="relative flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-gray-50 active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <PiCircle size={24} />
              </div>
              Oval Annotation
              <div className="absolute top-1 right-1">
                <span
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredTool("Oval")}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <PiInfoBold size={20} className="text-[#5c60c6] hover:text-black" />
                  <ToolTip isHovered={hoveredTool === "Oval"} gifSrc={ovalgif} />
                </span>
              </div>
            </button>

            <button
              onClick={() => setAnnotationMode("Point")}
              className="relative flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] focus:bg-[#fdfdfd] active:bg-[#fdfdfd] hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <TbPoint size={24} />
              </div>
              Point Annotation
              <div className="absolute top-1 right-1">
                <span
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredTool("point")}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <PiInfoBold size={20} className="text-[#5c60c6] hover:text-black" />
                  <ToolTip isHovered={hoveredTool === "point"} gifSrc={pointgif} />
                </span>
              </div>
            </button>

            <button
              onClick={() => setAnnotationMode("Freehand")}
              className="relative flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-[#fdfdfd] active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <FaRegHandPaper size={30} />
              </div>
              Free Hand Annotation
              <div className="absolute top-1 right-1">
                <span
                  className="relative cursor-pointer"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <PiInfoBold size={20} className="text-[#5c60c6] hover:text-black" />
                  <ToolTip isHovered={isHovered} gifSrc={freegif} />
                </span>
              </div>
            </button>

            <button
              onClick={undo}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-[#fdfdfd] active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <CiUndo size={24} />
              </div>
              Undo
            </button>

            <button
              onClick={redo}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-[#fdfdfd] active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <CiRedo size={24} />
              </div>
              Redo
            </button>

            <button
              onClick={resetAnnotations}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-[#fdfdfd] active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <RxReset size={24} />
              </div>
              Reset
            </button>

            <button
              onClick={saveAnnotations}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all hover:bg-[#fdfdfd] hover:bg-opacity-80 focus:bg-[#fdfdfd] focus:bg-opacity-80 active:bg-[#fdfdfd] active:bg-opacity-80 hover:text-[#030811] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <CiSaveDown1 size={24} />
              </div>
              Save Annotation
            </button>

            <button
              onClick={handleGoBack}
              className="flex items-center w-full m-3 p-3 rounded-lg text-start leading-tight transition-all bg-[#5c60c6] hover:bg-[#fdfdfd] hover:text-[#5c60c6] focus:bg-[#5c60c6] active:bg-[#fdfdfd] active:bg-opacity-80 text-[#fdfdfd] focus:text-[#030811] active:text-[#030811] outline-none"
            >
              <div className="grid place-items-center mr-4">
                <IoMdArrowBack size={24} />
              </div>
              Back to Analysis
            </button>
          </nav>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 flex lg:ml-[6vw] items-center justify-center dark:bg-[#030811] bg-[#fdfdfd] mt-0 md:mt-0"
        style={{ paddingBottom: "0px" }} // Add padding for mobile toolbar
      >
        <canvas
          id="canvasId1"
          className="rounded-lg max-w-full md:h-[1024px]"
          style={{
            cursor: "crosshair",
            filter: `brightness(${brightness}) contrast(${contrast})`,
            objectFit: 'contain'
          }}
          ref={canvasRef}
          width={1024}
          height={1024}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          // Update touch handlers in the canvas component:
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
            const mouseEvent = new MouseEvent("mousedown", {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            handleMouseDown(mouseEvent);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);
            const mouseEvent = new MouseEvent("mousemove", {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            handleMouseMove(mouseEvent);
          }}
          onTouchEnd={() => {
            const mouseEvent = new MouseEvent("mouseup", {});
            handleMouseUp(mouseEvent);
          }}
        ></canvas>
      </div>

      {/* Right Sidebar (Desktop) */}
      <div className="hidden md:block max-w-[25%] dark:bg-[#030811] bg-[#fdfdfd] text-white flex-col justify-between items-stretch p-4">
        <div className="pl-[-4px] overflow-x-auto">
          <Suspense fallback={null}>
            <Progress
              currentStep="edit"
              patientSlug={patientSlug}
              xraySlug={xraySlug}
              onNavigate={handleNavigation}
            />
            <LabelModal
              isOpen={isLabelModalOpen}
              onClose={() => setIsLabelModalOpen(false)}
              onSave={saveLabel}
              position={tempAnnotation ?
                (tempAnnotation.type === "Point" ?
                  { x: tempAnnotation.x, y: tempAnnotation.y } :
                  tempAnnotation.type === "Freehand" ?
                    { x: tempAnnotation.path[0][0], y: tempAnnotation.path[0][1] } :
                    { x: tempAnnotation.x, y: tempAnnotation.y }
                ) :
                { x: 0, y: 0 }
              }
            />
          </Suspense>
        </div>

        <div className="flex flex-col text-center mt-[50%] items-center justify-center">
          {/* Modal */}
          <ModalDiseaseInfo open={showInfoModal} onClose={() => setShowInfoModal(false)} />
          <h2 className="text-2xl mt-3 ml-0 font-bold dark:text-[#fdfdfd] text-[#030811]">
            TB Probability
          </h2>
          <div className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <SemiCircle percentage={(xrayData?.tbScore * 100).toFixed(0)} />
            </Suspense>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <LabelModal
              isOpen={isLabelModalOpen}
              onClose={() => setIsLabelModalOpen(false)}
              onSave={saveLabel}
            />
          </Suspense>

          <div className="flex flex-row justify-center w-full">
            {memoizedAbnormalities.length > 0 ? (
              // <div>
              <Suspense fallback={<div>Loading...</div>}>
                <AbnormalityBar abnormalities={memoizedAbnormalities} />
              </Suspense>
              // </div>
            ) : (
              <div className="mt-7 pt-9 text-center text-2xl font-semibold">No abnormalities found</div>
            )}
            <button
              onClick={() => setShowInfoModal(true)}
              className="absolute flex right-2 mt-10 text-[#5c60c6] h-9 w-9 hover:text-[#45639b] bg-gray-200 dark:bg-gray-800 rounded-full p-2 shadow-lg"
              aria-label="Show Disease Info"
              type="button"
            >
              <FaInfoCircle size={20} />
            </button>
          </div>
          <div className="pt-10 items-center justify-center">
            <button
              onClick={handleDownload}
              className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full items-center gap-2"
            >
              <GoDownload size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* USB Folder Picker Modal */}
      <UsbFolderPicker
        open={usbModalOpen}
        onClose={() => setUsbModalOpen(false)}
        onSelectFolder={async (folderPath) => {
          setUsbModalOpen(false);
          if (!pendingImageBlob) return;
          setSavingToUsb(true);
          const formData = new FormData();
          formData.append("file", pendingImageBlob, `xray-${xraySlug}.png`);
          formData.append("targetPath", folderPath);

          try {
            const response = await fetch(`${config.API_URL}/api/save-to-usb`, {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              toast.success("Image saved to USB successfully!");
            } else {
              const data = await response.json();
              toast.error("Error saving image to USB: " + (data.error || "Unknown error"));
            }
          } catch (err) {
            toast.error("Failed to save image to USB: " + err.message);
          } finally {
            setSavingToUsb(false);
            setPendingImageBlob(null);
          }
        }}
      />
      {savingToUsb && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center dark:bg-[#030811]/50 bg-[#fdfdfd]/50 bg-opacity-50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center">
            <BarLoader />
            <span className="mt-4 text-lg text-[#5c60c6]">Saving image to USB...</span>
          </div>
        </div>
      )}

      {/* Mobile Toolbar */}
      <MobileToolbar />

      {/* Patient Drawer (Mobile) */}
      {isPatientDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsPatientDrawerOpen(false)}
          ></div>
          <div className="md:hidden fixed top-0 right-0 w-3/4 h-full bg-[#030811] z-50 p-4 overflow-y-auto dark:text-[#fdfdfd] text-[#030811]">
            <button
              onClick={() => setIsPatientDrawerOpen(false)}
              className="mb-4 p-2 absolute right-2 bg-[#5c60c6] text-[#fdfdfd] rounded"
            >
              <MdClose size={20} />
            </button>
            <div className="text-center justify-between">
              <div className="mt-4">
                <Suspense fallback={<div>Loading...</div>}>
                  <Progress
                    currentStep="edit"
                    patientSlug={patientSlug}
                    xraySlug={xraySlug}
                    onNavigate={handleNavigation}
                  />
                </Suspense>
              </div>
              <div>
                {/* Modal */}
                <ModalDiseaseInfo open={showInfoModal} onClose={() => setShowInfoModal(false)} />
                <SemiCircle percentage={(xrayData?.tbScore * 100).toFixed(0)} />
                <h2 className="text-2xl font-bold">TB Probability</h2>
              </div>
              <div className="flex flex-row justify-center w-full">
                {memoizedAbnormalities.length > 0 ? (
                  <Suspense fallback={<div>Loading...</div>}>
                    <AbnormalityBar abnormalities={memoizedAbnormalities} />
                  </Suspense>
                ) : (
                  <div className="mt-7 pt-9 text-center text-2xl font-semibold">No abnormalities found</div>
                )}
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="absolute flex mt-10 right-2 text-[#5c60c6] h-9 w-9 hover:text-[#45639b] bg-gray-200 dark:bg-gray-800 rounded-full p-2 shadow-lg"
                  aria-label="Show Disease Info"
                  type="button"
                >
                  <FaInfoCircle size={20} />
                </button>
              </div>

              <div className="mt-2 pt-2 items-center justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full flex items-center gap-2 mx-auto"
                >
                  <FaDownload size={20} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        <LabelModal
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
          onSave={saveLabel}
          position={tempAnnotation ?
            (tempAnnotation.type === "Point" ?
              { x: tempAnnotation.x, y: tempAnnotation.y } :
              tempAnnotation.type === "Freehand" ?
                { x: tempAnnotation.path[0][0], y: tempAnnotation.path[0][1] } :
                { x: tempAnnotation.x, y: tempAnnotation.y }
            ) :
            { x: 0, y: 0 }
          }
        />
      </Suspense>


      {/* Tools Drawer (Mobile) */}
      {isToolDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsToolDrawerOpen(false)}
          ></div>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#030811] z-50 p-4 overflow-y-auto dark:text-[#fdfdfd] text-[#030811]">
            <button
              onClick={() => setIsToolDrawerOpen(false)}
              className="mb-4 p-2 bg-[#5c60c6] text-[#fdfdfd] rounded float-right"
            >
              <MdClose size={20} />
            </button>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <div>
                <label className="block text-[#fdfdfd] mb-2">Brightness</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[#fdfdfd] mb-2">Contrast</label>
                <input
                  type="range"
                  min="0.7"
                  max="2"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value)}
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setNegative(!negative)}
                className={`flex items-center w-full p-3 rounded-lg ${negative ? "bg-[#5c60c6]" : "bg-[#030811]"}`}
              >
                <BsCircleHalf size={20} className="text-[#fdfdfd] mr-2" />
                Negative
              </button>
              <button
                onClick={resetAnnotations}
                className="flex items-center w-full p-3 rounded-lg bg-[#030811]"
              >
                <RxReset size={20} className="text-[#fdfdfd] mr-2" />
                Reset
              </button>
              <button
                onClick={saveAnnotations}
                className="flex items-center w-full p-3 rounded-lg bg-[#5c60c6]"
              >
                <CiSaveDown1 size={20} className="text-[#fdfdfd] mr-2" />
                Save
              </button>
              <button
                onClick={handleGoBack}
                className="flex items-center w-full p-3 rounded-lg bg-[#5c60c6]"
              >
                <IoMdArrowBack size={20} className="text-[#fdfdfd] mr-2" />
                Back
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisEdit;