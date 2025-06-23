import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../utils/config";
import Progress from "../components/Progress";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaBars, FaTimes } from "react-icons/fa";
import logo1 from "../assets/rq.png"
import logo2 from "../assets/rq2.png"

// CanvasOverlayStatic: Draws annotations relative to original image dimensions.
const CanvasOverlayStatic = ({
  annotations,
  originalWidth = 1000,
  originalHeight = 1000,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0 || containerSize.height === 0) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = containerSize.width / originalWidth;
    const scaleY = containerSize.height / originalHeight;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();

    annotations.forEach((annotation) => {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.lineWidth = 2;

      if (annotation.type === "Box") {
        const x = annotation.x * scaleX;
        const y = annotation.y * scaleY;
        const w = annotation.width * scaleX;
        const h = annotation.height * scaleY;
        ctx.strokeRect(x, y, w, h);
        if (annotation.label) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(annotation.label, x + 5, y - 5);
        }
      } else if (annotation.type === "Oval") {
        const x = annotation.x * scaleX;
        const y = annotation.y * scaleY;
        const rX = annotation.radiusX * scaleX;
        const rY = annotation.radiusY * scaleY;
        ctx.beginPath();
        ctx.ellipse(x, y, rX, rY, 0, 0, 2 * Math.PI);
        ctx.stroke();
        if (annotation.label) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(annotation.label, x + 5, y - 5);
        }
      } else if (annotation.type === "Point") {
        const x = annotation.x * scaleX;
        const y = annotation.y * scaleY;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0,150,255,0.7)";
        ctx.fill();
        if (annotation.label) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(annotation.label, x + 5, y - 5);
        }
      } else if (annotation.type === "Freehand") {
        ctx.beginPath();
        annotation.path.forEach(([px, py], i) => {
          const x = px * scaleX;
          const y = py * scaleY;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        if (annotation.label && annotation.path.length > 0) {
          const [fx, fy] = annotation.path[0];
          ctx.font = "12px Arial";
          ctx.fillStyle = "white";
          ctx.fillText(annotation.label, fx * scaleX + 5, fy * scaleY - 5);
        }
      }
    });

    ctx.restore();
  }, [annotations, containerSize, originalWidth, originalHeight]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={containerSize.width}
        height={containerSize.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

const Quadrant = () => {
  const [patientData, setPatientData] = useState(null);
  const [xrayData, setXrayData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(4);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  
    useEffect(() => {
    // Listen for class changes on html element
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);


  const mockXrayData = [
    { id: 1, imageUrl: xrayData?.url, label: "Normal" },
    { id: 2, imageUrl: xrayData?.modelannotated || xrayData?.url, label: "Model Annotated" },
    { id: 3, imageUrl: xrayData?.url, label: "Your Annotated" },
    { id: 4, imageUrl: xrayData?.heatmap, label: "Heatmap" },
    { id: 5, imageUrl: xrayData?.clahe, label: "Clahe" },
    { id: 6, imageUrl: xrayData?.ctr?.imageUrl || xrayData?.ctr?.image, label: "CTR Image" },
    { id: 7, imageUrl: xrayData?.boneSuppression, label: "Bone Suppressed" },
    { id: 8, imageUrl: xrayData?.negativeUrl, label: "Negative" },
  ];

  const containerRef = useRef(null);
  const { patientSlug, xraySlug } = useParams();
  const navigate = useNavigate();

  // Set items per slide based on width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsPerSlide(1);
      else setItemsPerSlide(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const { data: p } = await axios.get(`${config.API_URL}/api/patients/${patientSlug}`);
        setPatientData(p);
        const { data: x } = await axios.get(`${config.API_URL}/api/xrays/${xraySlug}`);
        setXrayData(x);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [patientSlug, xraySlug]);

  const handleScroll = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((z) => {
      const nz = Math.min(Math.max(z + delta, 1), 3);
      if (nz === 1) handleReset();
      return nz;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseMove = (e) => {
    if (isPanning && startPos) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseUp = () => {
    setIsPanning(false);
    setStartPos(null);
  };

  const totalSlides = Math.ceil(mockXrayData.length / itemsPerSlide);
  const handleNextSlide = () => setSlideIndex((i) => (i + 1) % totalSlides);
  const handlePrevSlide = () => setSlideIndex((i) => (i - 1 + totalSlides) % totalSlides);
  const handleReset = () => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  };

  // Generate negative image
  useEffect(() => {
    if (!xrayData?.url) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = xrayData.url;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = 255 - d.data[i];
        d.data[i + 1] = 255 - d.data[i + 1];
        d.data[i + 2] = 255 - d.data[i + 2];
      }
      ctx.putImageData(d, 0, 0);
      setXrayData((prev) => ({ ...prev, negativeUrl: c.toDataURL() }));
    };
  }, [xrayData?.url]);

  const renderQuadrantContent = (data) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomLevel})`,
        transformOrigin: "center",
      }}
      onMouseDown={data.label !== "Your Annotated" ? handleMouseDown : undefined}
      onMouseMove={data.label !== "Your Annotated" ? handleMouseMove : undefined}
      onMouseUp={data.label !== "Your Annotated" ? handleMouseUp : undefined}
      onMouseLeave={data.label !== "Your Annotated" ? handleMouseUp : undefined}
    >
      <img
        src={data.imageUrl}
        alt={`xray quadrant ${data.id}`}
        style={{ width: "100%", height: "100%" }}
        draggable={false}
      />
      {data.label === "Your Annotated" && xrayData?.annotations && (
        <CanvasOverlayStatic
          annotations={xrayData.annotations}
          originalWidth={xrayData.originalWidth || 1000}
          originalHeight={xrayData.originalHeight || 1000}
        />
      )}
    </div>
  );

  const arrowVariants = {
    hover: {
      scale: 1,
      backgroundColor: "#4b5563", // Darker gray on hover
      transition: { duration: 0.2 },
    },
    rest: {
      scale: 1,
      backgroundColor: "#5c60c6", // Default gray
      transition: { duration: 0.2 },
    },
  };


  return (
    <div className="flex flex-col md:flex-row h-screen" onWheel={handleScroll}>
      {/* Main viewer */}
      <div
        ref={containerRef}
        className="w-full md:w-4/5 dark:bg-[#030811] bg-[#fdfdfd] p-8 relative"
      >
        {/* Mobile toggle */}
        <button
          className="md:hidden absolute top-4 right-4 z-20 p-2 bg-gray-600 text-white rounded"
          onClick={() => setDrawerOpen(true)}
        >
          <FaBars />
        </button>

        <div className="w-full h-[calc(100vh-4rem)] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: itemsPerSlide === 4 ? "repeat(2,1fr)" : "1fr",
                gridTemplateRows: itemsPerSlide === 4 ? "repeat(2,1fr)" : "1fr",
              }}
            >
              {mockXrayData
                .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                .map((d) => (
                  <div key={d.id} className="w-full h-full p-2 overflow-hidden border border-gray-300 relative">
                    <div className="absolute top-3 left-3 bg-black text-white text-sm px-2 py-1 rounded z-10 font-semibold opacity-40">
                      {d.label}
                    </div>
                    {renderQuadrantContent(d)}
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>

          <motion.button
            onClick={handlePrevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 p-3 rounded-full dark:text-[#fdfdfd] text-[#030811]"
            variants={arrowVariants}
            initial="rest"
            whileHover="hover"
            style={{ marginLeft: "-1.5rem" }} // Position outside the border
          >
            <FaArrowLeft size={18} />
          </motion.button>
          <motion.button
            onClick={handleNextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-3 rounded-full dark:text-[#fdfdfd] text-[#030811]"
            variants={arrowVariants}
            initial="rest"
            whileHover="hover"
            style={{ marginRight: "-1.5rem" }} // Position outside the border
          >
            <FaArrowRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* drawer panel */}
            <motion.div
              className="fixed top-0 right-0 h-full w-4/5 bg-[#fdfdfd] dark:bg-[#030811] z-40 p-4"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <button
                className="mb-4 p-2 bg-gray-600 text-white rounded"
                onClick={() => setDrawerOpen(false)}
              >
                <FaTimes />
              </button>
              <img
                src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"
                alt="logo"
                className="w-50 h-10 mx-auto invert grayscale dark:invert-0"
              />
              <div className="mt-10 pt-10">
                <Progress
                  currentStep="quadrant"
                  patientSlug={patientSlug}
                  xraySlug={xraySlug}
                  onNavigate={(p) => navigate(p)}
                />
              </div>
              <button
                onClick={handleReset}
                className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full w-full mt-8"
              >
                Reset
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-1/5 dark:bg-[#030811] bg-[#fdfdfd] p-4 flex-col">
        <img
          src={isDark ? logo2 : logo1}
          alt="logo"
          className="w-50 h-10 mx-auto "
        />
        <div className="mt-10 pt-10">
          <Progress
            currentStep="quadrant"
            patientSlug={patientSlug}
            xraySlug={xraySlug}
            onNavigate={(p) => navigate(p)}
          />
        </div>
        <button
          onClick={handleReset}
          className="bg-[#5c60c6] hover:bg-[#030811] border-2 border-[#fdfdfd] text-[#fdfdfd] font-semibold py-2 px-8 rounded-full w-full mt-8"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Quadrant;
