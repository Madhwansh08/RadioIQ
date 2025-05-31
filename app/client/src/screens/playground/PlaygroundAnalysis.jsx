
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SemiCircle from "../../components/SemiCircle";
import AbnormalityBar from "../../components/AbnormalityBar";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { GoZoomIn, GoZoomOut } from "react-icons/go";
import logo from '../../assets/logo1_resize.png';
import Joyride, { EVENTS, STATUS } from "react-joyride";

const PlaygroundAnalysis = () => {
  const location = useLocation();
  const { patient, xray } = location.state || {};
  const navigate = useNavigate();
  const imageRef = useRef(null); // Store the loaded image
  const drawTimeoutRef = useRef(null); // For debouncing redraws

  if (!patient || !xray) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">No data received.</p>
      </div>
    );
  }

  const xrayData = xray;
  const patientData = patient;

  // State variables
  const [filterValues, setFilterValues] = useState({
    brightness: 0,
    contrast: 0,
    negative: 0,
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [segmentationActive, setSegmentationActive] = useState(true);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Joyride state
  const [runTour, setRunTour] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      target: "body",
      content: "This is the analysis screen.",
      placement: "center",
    },
    {
      target: "#joy-zoom-in",
      content: "Click here to zoom in.",
    },
    {
      target: "#joy-zoom-out",
      content: "Click here to zoom out.",
    },
    {
      target: "#joy-brightness",
      content: "Adjust brightness here.",
    },
    {
      target: "#joy-contrast",
      content: "Adjust contrast here.",
    },
    {
      target: "#joy-negative",
      content: "Toggle negative filter here.",
    },
    {
      target: "#joy-reset",
      content: "Reset filters here.",
    },
    {
      target: "#joy-canvas",
      content: "This is the X-ray image with segmentation.",
    },
    {
      target: "#joy-right-sidebar",
      content: "Here you can see the TB score and abnormalities.",
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    } else if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }
  };

  // Function to get color for abnormality
  const getColorForAbnormality = (name) => {
    const colorMap = {
      Fibrosis: "orange",
    };
    return colorMap[name] || "magenta";
  };

  // Debounced drawImage function
  const drawImage = useCallback(() => {
    if (canvasRef.current && xrayData && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const img = imageRef.current;
      const scaleToFit = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const offsetX = (canvas.width - img.width * scaleToFit) / 2;
      const offsetY = (canvas.height - img.height * scaleToFit) / 2;

      // Draw the image
      ctx.save();
      ctx.translate(offsetX + panOffset.x, offsetY + panOffset.y);
      ctx.scale(scale * scaleToFit, scale * scaleToFit);
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Apply filters
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const brightness = filterValues.brightness;
      const contrastFactor =
        (259 * (128 + filterValues.contrast)) /
        (255 * (259 - filterValues.contrast));
      const negative = filterValues.negative > 0;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128 + brightness));
        data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128 + brightness));
        data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128 + brightness));
        if (negative) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Draw segmentation if active
      if (segmentationActive) {
        xrayData.abnormalities.forEach((abnormality) => {
          if (abnormality.segmentation && abnormality.segmentation.length > 0) {
            const segData = abnormality.segmentation;
            const color = getColorForAbnormality(abnormality.name);

            // Draw segmentation polygon
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
            ctx.globalAlpha = 1.0;

            // Draw abnormality name above the segmentation
            const minY = Math.min(...segData.filter((_, i) => i % 2 === 1));
            ctx.font = `${16 / (scale * scaleToFit)}px Arial`;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.fillText(abnormality.name, segData[0], minY - 10 / (scale * scaleToFit));
          }
        });
      }

      ctx.restore();
    }
  }, [xrayData, filterValues, scale, panOffset, segmentationActive]);

  // Load image once on component mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = xrayData.url;
    img.onload = () => {
      imageRef.current = img;
      drawImage();
    };
    return () => {
      imageRef.current = null;
    };
  }, [xrayData.url, drawImage]);

  // Debounce drawImage calls
  const debouncedDrawImage = useCallback(() => {
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
    }
    drawTimeoutRef.current = setTimeout(() => {
      drawImage();
    }, 50); // 50ms debounce
  }, [drawImage]);

  // Use effect to trigger debounced redraw
  useEffect(() => {
    debouncedDrawImage();
    return () => {
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }
    };
  }, [filterValues, scale, panOffset, segmentationActive, debouncedDrawImage]);

  // Handle zoom in
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 1));
  };

  // Handle reset filters
  const resetFilters = () => {
    setFilterValues({ brightness: 0, contrast: 0, negative: 0 });
    setActiveFilter(null);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle slider change with debouncing
  const handleSliderChange = useCallback((filter, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [filter]: parseInt(value),
    }));
  }, []);

  // Toolbar component
  const Toolbar = () => (
    <div className="flex flex-col items-center gap-y-6">
      <button
        onClick={() => setSegmentationActive((prev) => !prev)}
        className={`rounded-xl p-2 ${
          segmentationActive
            ? "bg-red-500"
            : "dark:bg-[#030811] bg-[#fdfdfd]"
        } dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]`}
        id="joy-segmentation"
      >
        {segmentationActive ? (
          <FaRegEyeSlash size={20} />
        ) : (
          <FaRegEye size={20} />
        )}
      </button>
      <button
        onClick={handleZoomIn}
        className="rounded-xl dark:bg-[#030811] bg-[#fdfdfd] p-2 dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
        id="joy-zoom-in"
      >
        <GoZoomIn size={24} />
      </button>
      <button
        onClick={handleZoomOut}
        className="rounded-xl dark:bg-[#030811] bg-[#fdfdfd] p-2 dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]"
        id="joy-zoom-out"
      >
        <GoZoomOut size={24} />
      </button>
      {["brightness", "contrast", "negative"].map((filter) => (
        <div key={filter} className="relative">
          <button
            className={`rounded-xl p-2 dark:text-[#fdfdfd] text-[#030811] ${
              activeFilter === filter
                ? "bg-[#5c60c6]"
                : "dark:bg-[#000000] bg-[#fdfdfd]"
            } dark:hover:bg-[#5c60c6] hover:bg-[#5c60c6]`}
            onClick={() => {
              if (filter === "negative") {
                setFilterValues((prev) => ({
                  ...prev,
                  negative: prev.negative === 0 ? 1 : 0,
                }));
              } else {
                setActiveFilter((prev) => (prev === filter ? null : filter));
              }
            }}
            id={`joy-${filter}`}
          >
            {filter === "brightness" && (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
              </svg>
            )}
            {filter === "contrast" && (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1V2a6 6 0 1 0 0 12z" />
              </svg>
            )}
            {filter === "negative" && (
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8zm7-4.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 1 0v-8a.5.5 0 0 0-.5-.5z" />
              </svg>
            )}
          </button>
          {filter !== "negative" && activeFilter === filter && (
            <div className="absolute left-24 top-16 z-50 flex flex-col bg-[#1a1a2e] p-6 shadow-lg rounded-md w-64">
              <h3 className="text-lg text-[#fdfdfd] mb-2 font-semibold">
                Adjust {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </h3>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={filterValues[filter]}
                onChange={(e) => handleSliderChange(filter, e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5c60c6]"
                style={{
                  accentColor: '#5c60c6',
                  transition: 'value 0.1s ease',
                }}
              />
              <div className="text-white mt-2 text-sm">
                Value:{" "}
                <span className="font-semibold">{filterValues[filter]}</span>
              </div>
              <button
                onClick={() => setActiveFilter(null)}
                className="mt-4 p-2 bg-[#5c60c6] text-[#fdfdfd] font-semibold rounded hover:bg-[#030811] border-1 hover:border-[#5c60c6] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={resetFilters}
        className="rounded-xl bg-[#5c60c6] p-2 text-[#fdfdfd] hover:bg-[#030811]"
        id="joy-reset"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
          />
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
        </svg>
      </button>
      <button
        onClick={() => navigate(-1)}
        className="rounded-xl bg-[#5c60c6] p-2 text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
          />
        </svg>
      </button>
    </div>
  );

  // Right Sidebar component
  const RightSidebar = () => (
    <div
      className="w-[25%] h-screen dark:bg-[#030811] bg-[#fdfdfd] dark:text-white text-[#030811] flex-col justify-between p-4"
      id="joy-right-sidebar"
    >
      <div className="text-center items-center">
        <h2 className="text-2xl mt-3 ml-5 font-bold">TB Probability</h2>
        <div className="mt-4 pl-10">
          <SemiCircle percentage={(xrayData.tbScore / 5 * 100).toFixed(0)} />
        </div>
        <div>
          {xrayData.abnormalities.length > 0 ? (
            <AbnormalityBar abnormalities={xrayData.abnormalities} />
          ) : (
            <div className="mt-7 pt-9 text-center text-2xl font-semibold">
              No abnormalities found
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Handle wheel for zoom
  const handleWheel = (e) => {
    setScale((prevScale) =>
      Math.min(Math.max(prevScale + e.deltaY * -0.001, 1), 3)
    );
  };

  // Handle mouse down for panning
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

  // Resize canvas
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
        drawImage();
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [drawImage]);

  return (
    <div className="flex min-h-screen dark:bg-gradient-to-b dark:bg-[#030811] bg-[#fdfdfd]">
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
      <div className="w-[35%] min-h-screen dark:bg-[#030811] bg-[#fdfdfd] dark:text-white text-[#030811] flex-col py-4">
        <div className="flex">
          <aside className="w-20 mr-1 flex flex-col items-center border-r dark:border-[#fdfdfd] border-[#030811]">
            <img
              src={logo}
              alt="Logo"
              className="w-[120%] mb-10 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <Toolbar />
          </aside>
          <div className="w-[20vw]">
            <div className="flex flex-col ">
              <h2 className="text-2xl mt-3 ml-5 font-bold">Patient Demographics</h2>
              <div className="mt-4 pl-10">
                <p className="text-lg">Id: {patientData.patientId}</p>
                <p className="text-lg">Age: {patientData.age}</p>
                <p className="text-lg">Gender: {patientData.sex}</p>
                <p className="text-lg">Location: {patientData.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 dark:bg-[#030811] bg-[#fdfdfd] flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={scale > 1 ? handleMouseDown : null}
        id="joy-canvas"
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg"
          style={{ display: "block", visibility: "visible" }}
        ></canvas>
      </div>
      <RightSidebar />
    </div>
  );
};

export default PlaygroundAnalysis;