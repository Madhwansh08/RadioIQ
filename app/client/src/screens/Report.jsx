import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { FaXmark } from "react-icons/fa6";
import { GoArrowLeft } from "react-icons/go";
import { BarLoader } from "../components/BarLoader";
import axios from "axios";
import config from "../utils/config";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1_resize.png";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import lowTbImage from '../assets/low.png';
import mediumTbImage from '../assets/medium.png';
import highTbImage from '../assets/high.png';
import UsbFolderPicker from "../components/UsbFolderPicker";

const Report = () => {
  const [patientData, setPatientData] = useState(null);
  const [xrayData, setXrayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState(null);
  const [modelAnnotatedImageUrl, setModelAnnotatedImageUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [usbModalOpen, setUsbModalOpen] = useState(false);
  const [pendingPdfBlob, setPendingPdfBlob] = useState(null);
  const auth = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    patientName: "",
    advice: "",
    referredBy: auth.user.name,
    radiologist: "",
    location: "",
    bodyPartExamined: "Chest",
    otherBodyPart: "",
  });

  const { patientSlug, xraySlug } = useParams();

  const tiers = [
    {
      id: 1,
      name: "Standard Report",
      description: "Basic report with essential details.",
      features: [
        "Patient Details",
        "X-ray Details",
        "Digital Signature",
        "Date Generated At",
      ],
    },
    {
      id: 2,
      name: "Detailed Report",
      description: "Includes a more detailed breakdown.",
      features: [
        "Patient Details",
        "X-ray Analysis",
        "Doctor's Comments",
        "AI Predictions",
      ],
      mostPopular: true,
    },
    {
      id: 3,
      name: "Full Diagnostic Report",
      description: "Comprehensive report with full evaluation.",
      features: [
        "Patient Details",
        "X-ray Analysis",
        "Doctor's Comments",
        "AI Predictions",
        "Treatment Suggestions",
        "Risk Analysis",
      ],
    },
  ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch patient data
        const patientResponse = await axios.get(
          `${config.API_URL}/api/patients/${patientSlug}`
        );
        setPatientData(patientResponse.data);
        // Fetch X-ray data
        const xrayResponse = await axios.get(
          `${config.API_URL}/api/xrays/${xraySlug}`
        );
        setXrayData(xrayResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch patient or X-ray data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientSlug, xraySlug]);

  useEffect(() => {
    if (patientData?.patient?.location) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        location: patientData.patient.location,
      }));
    }
  }, [patientData]);

  const handleOpenModal = (reportType) => {
    setSelectedReportType(reportType);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = async () => {
    setShowModal(false);

    if (selectedReportType === 1) {
      handleStandardDownload();
    } else if (selectedReportType === 2) {
      handleDetailedDownload();
    } else {
      handleFullDownload();
    }
  };

  const handleStandardDownload = async () => {
    try {
      setReportLoading(true);
      const response = await axios.get(
        `${config.API_URL}/api/reports/${patientSlug}/${xraySlug}/report`
      );
      const report = response.data.report;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [350, 270],
      });

      const currentDate = new Date().toLocaleDateString();
      doc.addImage(logo1, "PNG", 12, 4, 59, 20);

      // Set Font for Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 128);

      // Calculate Centered X-Position
      const pageWidth = doc.internal.pageSize.getWidth(); // Get page width
      const title = "CXR Medical Report";
      const textWidth = doc.getTextWidth(title); // Get text width
      const centerX = (pageWidth - textWidth) / 2; // Centered X position

      // Add Centered Title
      doc.text(title, centerX, 17);

      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString();

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${dateString}`, 220, 15);
      doc.text(`Time: ${timeString}`, 220, 20);

      // Add Header Divider (Centered)
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.1);
      doc.line(10, 24, pageWidth - 10, 24);

      // Patient Details Section
      let yOffset = 36;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT DETAILS", 10, yOffset);

      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(10, yOffset + 1, 48, yOffset + 1);

      yOffset += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PATIENT ID:", 10, yOffset);
      doc.setFont("helvetica", "normal");
      doc.text(patientSlug, 32, yOffset);

      doc.setFont("helvetica", "bold");
      doc.text("PATIENT NAME:", 100, yOffset);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(formData.patientName, 130, yOffset);

      doc.setFont("helvetica", "bold");
      doc.text("GENDER/AGE:", 180, yOffset);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`${report.gender} / ${report.age.toString()}`, 205, yOffset);

      yOffset += 10;
      doc.setFont("helvetica", "bold");
      doc.text("DATE OF EXAMINATION:", 10, yOffset);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(
        report.createdAt
          ? new Date(report.createdAt).toLocaleDateString()
          : "N/A",
        54,
        yOffset
      );

      doc.setFont("helvetica", "bold");
      doc.text("BODY PART EXAMINED:", 100, yOffset);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      const bodyPart =
        formData.bodyPartExamined === "Other"
          ? formData.otherBodyPart
          : formData.bodyPartExamined;
      doc.text(bodyPart, 143, yOffset);

      doc.setFont("helvetica", "bold");
      doc.text("REFERRED PHYSICIAN:", 180, yOffset);
      doc.setFont("helvetica", "normal");
      doc.text(formData.referredBy, 222, yOffset);

      // Findings Section
      yOffset += 20;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 128);
      doc.text("FINDINGS", 10, yOffset);

      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(10, yOffset + 1, 30, yOffset + 1);

      yOffset += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Abnormalities Found: ", 10, yOffset);

      yOffset += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (report.abnormalitiesFound && report.abnormalitiesFound.length > 0) {
        report.abnormalitiesFound.forEach((item, index) => {
          doc.text(`- ${item}`, 15, yOffset + 6 + index * 6);
        });
      } else {
        doc.text("None", 15, yOffset + 6);
      }

      yOffset +=
        10 +
        (report.abnormalitiesFound ? report.abnormalitiesFound.length * 6 : 6);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.setFont("helvetica", "bold");
      doc.text("DIFFERENTIALS", 10, yOffset + 10);
      yOffset += 10;
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(10, yOffset + 1, 44, yOffset + 1);

      yOffset += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Doctors Notes:`, 20, yOffset);

      const maxTextWidth = 250;
      const doctorNotes = xrayData.note || "No additional notes.";
      const wrappedNotes = doc.splitTextToSize(doctorNotes, maxTextWidth);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(wrappedNotes, 55, yOffset);

      yOffset += wrappedNotes.length * 6 + 10;

      doc.setDrawColor(100, 100, 255);
      doc.line(10, yOffset + 5, pageWidth - 10, yOffset + 5);

      // End of Report
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("*** End of Report ***", 135, yOffset + 15, { align: "center" });

      // Save PDF
      // doc.save(`${patientSlug}-CXR-Report.pdf`);
      const pdfBlob = doc.output("blob");
      setPendingPdfBlob(pdfBlob);
      setUsbModalOpen(true);
    } catch {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDetailedDownload = async () => {
    try {
      // Fetch the report details
      setReportLoading(true);
      const response = await axios.get(
        `${config.API_URL}/api/reports/${patientSlug}/${xraySlug}/report`
      );
      const report = response.data.report;

      // Create a new jsPDF instance using A4 dimensions
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const addLogo = () => {
        doc.addImage(logo1, "PNG", 12, 4, 30, 10);
      };

      addLogo();

      // Set Font for Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 128);

      // Starting coordinates
      let x = 10;
      let y = 12;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Function to add new page if content exceeds page size
      const checkYPosition = (height) => {
        if (y + height > pageHeight - 30) {
          // leave space for disclaimer
          doc.addPage();
          addLogo();
          y = 36; // reset y position with some top margin
          x = 10; // reset x position if needed
        }
      };

      // ----------------- Report Title -----------------
      doc.text("CXR Medical Report", 105, y, { align: "center" });

      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString();

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${dateString}`, 155, y - 2);
      doc.text(`Time: ${timeString}`, 155, y + 3);

      y += 8;

      // Add Header Divider (Centered)
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.1);
      doc.line(10, y + 1, doc.internal.pageSize.getWidth() - 10, y + 1);
      y += 10;

      // ----------------- Patient Details Section -----------------
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT DETAILS", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 37, y + 1);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Patient Name
      doc.text("PATIENT NAME:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(formData.patientName || "N/A", 40, y);
      y += 7;

      // Patient ID
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT ID:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(patientSlug, 40, y);
      y += 7;

      // Gender
      doc.setFont("helvetica", "bold");
      doc.text("GENDER:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(report.gender || "N/A", 40, y);
      y += 7;

      // Age
      doc.setFont("helvetica", "bold");
      doc.text("AGE:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(report.age.toString() || "N/A", 40, y);
      y += 7;

      // Location
      doc.setFont("helvetica", "bold");
      doc.text("LOCATION:", 10, y);
      doc.setFont("helvetica", "normal");
      const maxWidth = 60; // Adjust this width if needed
      const locationLines = doc.splitTextToSize(
        formData.location || "N/A",
        maxWidth
      );
      doc.text(locationLines, 40, y);

      // Move y down based on number of lines in location
      y += locationLines.length * 5 + 2;

      // Right column details
      const rightX = 110;
      let yRight = y - 35; // align the right column with the top of the left
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      // Date of Examination
      doc.text("DATE OF EXAMINATION:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(
        report.createdAt
          ? new Date(report.createdAt).toLocaleDateString()
          : "N/A",
        rightX + 45,
        yRight
      );
      yRight += 7;

      // Referred Physician
      doc.setFont("helvetica", "bold");
      doc.text("REFERRED PHYSICIAN:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(formData.referredBy || "N/A", rightX + 45, yRight);
      yRight += 7;

      // Radiologist
      doc.setFont("helvetica", "bold");
      doc.text("RADIOLOGIST:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(formData.radiologist || "", rightX + 45, yRight);
      yRight += 7;

      // Location
      doc.setFont("helvetica", "bold");
      doc.text("EXAMINATION TYPE:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text("X-RAY", rightX + 45, yRight);
      yRight += 7;

      // Body Part Examined
      doc.setFont("helvetica", "bold");
      doc.text("BODY PART EXAMINED:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      const bodyPart =
        formData.bodyPartExamined === "Other"
          ? formData.otherBodyPart
          : formData.bodyPartExamined;
      doc.text(bodyPart, rightX + 45, yRight);
      yRight += 7;

      y = Math.max(y, yRight) + 10;

      // ----------------- Findings Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("FINDINGS", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 20, y + 1);
      y += 14;

      x += 13;
      // Abnormalities Found
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Abnormalities Found:", x, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (report.abnormalitiesFound && report.abnormalitiesFound.length > 0) {
        report.abnormalitiesFound.forEach((item, index) => {
          // If each item is an object with name and percentage
          if (typeof item === "object" && item.name && item.percentage) {
            doc.text(
              `${index + 1}. ${item.name}   ${item.percentage}%`,
              x + 5,
              y
            );
          } else {
            doc.text(`- ${item}`, x + 5, y);
          }
          y += 6;
          checkYPosition(6);
        });
      } else {
        doc.text("None", x + 5, y);
        y += 6;
      }

      y += 10;
      checkYPosition(10);

      // TB Possibility with dynamic image
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TB Possibility:", x, y);
      doc.setFont("helvetica", "normal");
      let tbPossibilityText = "";
      if (report.tbScore * 100 < 30) {
        tbPossibilityText = "Low";
      } else if (report.tbScore * 100 < 60) {
        tbPossibilityText = "Medium";
      } else {
        tbPossibilityText = "High";
      }
      doc.text(tbPossibilityText, x + 40, y);

      // Determine which TB image to use
      let tbImage;
      if (tbPossibilityText === "Low") {
        tbImage = lowTbImage;
      } else if (tbPossibilityText === "Medium") {
        tbImage = mediumTbImage;
      } else {
        tbImage = highTbImage;
      }
      // Place the TB possibility image (adjust coordinates and size as needed)
      doc.addImage(tbImage, "PNG", 120, y - 28, 60, 37.5);
      y += 15;
      checkYPosition(15);



      // ----------------- Differential Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("Differential", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 22, y + 1);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (report.differential && report.differential.length > 0) {
        report.differential.forEach((item, index) => {
          doc.text(`• ${item}`, x + 5, y);
          y += 6;
          checkYPosition(6);
        });
      }

      // ----------------- Doctors Notes -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Doctors Notes:", x, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(xrayData.note || "[Detailed notes from the radiologist]", x, y, {
        maxWidth: 190,
      });
      y += 15;
      checkYPosition(15);

      x -= 13;

      y += 10;
      checkYPosition(10);

      // ----------------- Disclaimer Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Disclaimer", 105, pageHeight - 30, { align: "center" });
      doc.setLineWidth(0.025); // Thin line
      doc.line(
        55,
        pageHeight - 29,
        doc.internal.pageSize.getWidth() - 55,
        pageHeight - 29
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "This is an AI generated reported. The findings are to be used for diagnostic purposes in consultation with a licensed medical expert.",
        105,
        pageHeight - 25,
        { align: "center", maxWidth: 190 }
      );

      // ----------------- X-ray Image Section -----------------
      y += 10;
      checkYPosition(200);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("X-Ray", x, y);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 10, y + 1);
      y += 15;
      // Draw border for image placeholder
      doc.setDrawColor(0, 0, 0);
      doc.rect(x + 21, y, 150, 150);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      // Load and add the X-ray image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = xrayData.url;
      img.onload = () => {
        doc.addImage(img, "PNG", x + 21, y, 150, 150);

        // Draw border for X-ray image
        doc.setDrawColor(0, 0, 0);
        doc.rect(x + 21, y, 150, 150);

        y += 160;

        doc.setLineWidth(0.025); // Thin line
        doc.line(x, y, doc.internal.pageSize.getWidth() - x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("*** End of Report ***", 105, y + 5, { align: "center" });

        y += 15;
        // Dotted underline for signature
        doc.setLineDash([1, 1], 0);
        doc.line(x, y, x + 50, y);
        y += 10;

        // Doctor's name and designation
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(formData.radiologist, x, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("(MD,Radiologist)", x, y);

        // Save the PDF
        // doc.save(
        //   `${patientSlug}-${report.examDate
        //     ? new Date(report.examDate).toLocaleDateString()
        //     : new Date().toLocaleDateString()
        //   }-report.pdf`
        // );
        const pdfBlob = doc.output("blob");
        setPendingPdfBlob(pdfBlob);
        setUsbModalOpen(true);


        // Stop the loader after all operations are done
        setReportLoading(false);
      };
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report. Please try again.");
      setReportLoading(false);
    } finally {
    }
  };

  function generateNegativeImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Invert RGB values for each pixel
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i]; // Red
          data[i + 1] = 255 - data[i + 1]; // Green
          data[i + 2] = 255 - data[i + 2]; // Blue
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = (error) => reject(error);
    });
  }

  const handleFullDownload = async () => {
    try {
      // Fetch the report details
      setReportLoading(true);
      const response = await axios.get(
        `${config.API_URL}/api/reports/${patientSlug}/${xraySlug}/report`
      );
      const report = response.data.report;

      // Create a new jsPDF instance using A4 dimensions
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const addLogo = () => {
        doc.addImage(logo1, "PNG", 12, 4, 30, 10);
      };

      addLogo();

      // Set Font for Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 128);

      // Starting coordinates
      let x = 10;
      let y = 12;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Function to add new page if content exceeds page size
      const checkYPosition = (height) => {
        if (y + height > pageHeight - 30) {
          // leave space for disclaimer
          doc.addPage();
          addLogo();
          y = 36; // reset y position with some top margin
          x = 10; // reset x position if needed
        }
      };

      // ----------------- Report Title -----------------
      doc.text("CXR Medical Report", 105, y, { align: "center" });

      const now = new Date();
      const dateString = now.toLocaleDateString();
      const timeString = now.toLocaleTimeString();

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${dateString}`, 155, y - 2);
      doc.text(`Time: ${timeString}`, 155, y + 3);

      y += 8;

      // Add Header Divider (Centered)
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.1);
      doc.line(10, y + 1, doc.internal.pageSize.getWidth() - 10, y + 1);
      y += 10;

      // ----------------- Patient Details Section -----------------
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT DETAILS", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 37, y + 1);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Patient Name
      doc.text("PATIENT NAME:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(formData.patientName || "N/A", 40, y);
      y += 7;

      // Patient ID
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT ID:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(patientSlug, 40, y);
      y += 7;

      // Gender
      doc.setFont("helvetica", "bold");
      doc.text("GENDER:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(report.gender || "N/A", 40, y);
      y += 7;

      // Age
      doc.setFont("helvetica", "bold");
      doc.text("AGE:", 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(report.age.toString() || "N/A", 40, y);
      y += 7;

      // Location
      doc.setFont("helvetica", "bold");
      doc.text("LOCATION:", 10, y);
      doc.setFont("helvetica", "normal");
      const maxWidth = 60; // Adjust this width if needed
      const locationLines = doc.splitTextToSize(
        formData.location || "N/A",
        maxWidth
      );
      doc.text(locationLines, 40, y);

      // Move y down based on number of lines in location
      y += locationLines.length * 5 + 2;

      // Right column details
      const rightX = 110;
      let yRight = y - 35; // align the right column with the top of the left
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      // Date of Examination
      doc.text("DATE OF EXAMINATION:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(
        report.createdAt
          ? new Date(report.createdAt).toLocaleDateString()
          : "N/A",
        rightX + 45,
        yRight
      );
      yRight += 7;

      // Referred Physician
      doc.setFont("helvetica", "bold");
      doc.text("REFERRED PHYSICIAN:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(formData.referredBy || "N/A", rightX + 45, yRight);
      yRight += 7;

      // Radiologist
      doc.setFont("helvetica", "bold");
      doc.text("RADIOLOGIST:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text(formData.radiologist, rightX + 45, yRight);
      yRight += 7;

      // Location
      doc.setFont("helvetica", "bold");
      doc.text("EXAMINATION TYPE:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      doc.text("X-RAY", rightX + 45, yRight);
      yRight += 7;

      // Body Part Examined
      doc.setFont("helvetica", "bold");
      doc.text("BODY PART EXAMINED:", rightX, yRight);
      doc.setFont("helvetica", "normal");
      const bodyPart =
        formData.bodyPartExamined === "Other"
          ? formData.otherBodyPart
          : formData.bodyPartExamined;
      doc.text(bodyPart, rightX + 45, yRight);
      yRight += 7;

      y = Math.max(y, yRight) + 10;

      // ----------------- Findings Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("FINDINGS", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 20, y + 1);
      y += 14;

      x += 13;
      // Abnormalities Found
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Abnormalities Found:", x, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (report.abnormalitiesFound && report.abnormalitiesFound.length > 0) {
        report.abnormalitiesFound.forEach((item, index) => {
          // If each item is an object with name and percentage
          if (typeof item === "object" && item.name && item.percentage) {
            doc.text(
              `${index + 1}. ${item.name}   ${item.percentage}%`,
              x + 5,
              y
            );
          } else {
            doc.text(`- ${item}`, x + 5, y);
          }
          y += 6;
          checkYPosition(6);
        });
      } else {
        doc.text("None", x + 5, y);
        y += 6;
      }

      y += 10;
      checkYPosition(10);

      // TB Possibility with dynamic image
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TB Possibility:", x, y);
      doc.setFont("helvetica", "normal");
      let tbPossibilityText = "";
      if (report.tbScore * 100 < 30) {
        tbPossibilityText = "Low";
      } else if (report.tbScore * 100 < 60) {
        tbPossibilityText = "Medium";
      } else {
        tbPossibilityText = "High";
      }
      doc.text(tbPossibilityText, x + 40, y);

      // Determine which TB image to use
      let tbImage;
      if (tbPossibilityText === "Low") {
        tbImage = lowTbImage;
      } else if (tbPossibilityText === "Medium") {
        tbImage = mediumTbImage;
      } else {
        tbImage = highTbImage;
      }
      // Place the TB possibility image (adjust coordinates and size as needed)
      doc.addImage(tbImage, "PNG", 120, y - 28, 60, 37.5);
      y += 15;
      checkYPosition(15);



      // ----------------- Differential Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("Differential", x, y);
      doc.setDrawColor(0, 0, 128);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 22, y + 1);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (report.differential && report.differential.length > 0) {
        report.differential.forEach((item) => {
          doc.text(`• ${item}`, x + 5, y);
          y += 6;
          checkYPosition(6);
        });
      }
      // ----------------- Doctors Notes -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Doctors Notes:", x, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(xrayData.note || "[Detailed notes from the radiologist]", x, y, {
        maxWidth: 190,
      });
      y += 15;
      checkYPosition(15);

      x -= 13;
      y += 10;
      checkYPosition(10);

      // ----------------- Disclaimer Section -----------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Disclaimer", 105, pageHeight - 30, { align: "center" });
      doc.setLineWidth(0.025); // Thin line
      doc.line(
        55,
        pageHeight - 29,
        doc.internal.pageSize.getWidth() - 55,
        pageHeight - 29
      );
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "This is an AI generated reported. The findings are to be used for diagnostic purposes in consultation with a licensed medical expert.",
        105,
        pageHeight - 25,
        { align: "center", maxWidth: 190 }
      );

      // ----------------- X-ray Image Section -----------------
      y += 10;
      checkYPosition(160);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 128);
      doc.text("X-Ray", x, y);
      doc.setLineWidth(0.025); // Thin line
      doc.line(x, y + 1, x + 12, y + 1);
      y += 15;
      // Draw border for image placeholder
      doc.setDrawColor(0, 0, 0);
      doc.rect(x + 21, y, 150, 150);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Load and add the X-ray image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = xrayData.url;
      img.onload = () => {
        doc.addImage(img, "PNG", x + 21, y, 150, 150);

        // Draw border for X-ray image
        doc.setDrawColor(0, 0, 0);
        doc.rect(x + 21, y, 150, 150);

        y += 160;

        // ----------------- Model Annotated Image Section -----------------
        checkYPosition(160);
        doc.setDrawColor(0, 0, 128);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 128);
        doc.text("Model Annotated", x, y);
        doc.setLineWidth(0.025); // Thin line
        doc.line(x, y + 1, x + 35, y + 1);
        y += 15;
        // Draw border for image placeholder
        doc.setDrawColor(0, 0, 0);
        // doc.rect(x + 21, y, 150, 150);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Load and add the heatmap image
        const modelAnnotated = new Image();
        modelAnnotated.crossOrigin = "anonymous";
        modelAnnotated.src = xrayData.modelannotated || xrayData.url;
        modelAnnotated.onload = () => {
          doc.addImage(modelAnnotated, "PNG", x + 21, y, 150, 150);

          // Draw border for heatmap image
          doc.setDrawColor(0, 0, 0);
          doc.rect(x + 21, y, 150, 150);

          y += 160;
          // ----------------- Heatmap Image Section -----------------
          checkYPosition(200);
          doc.setDrawColor(0, 0, 128);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 128);
          doc.text("Heatmap", x, y);
          doc.setLineWidth(0.025); // Thin line
          doc.line(x, y + 1, x + 16, y + 1);
          y += 15;
          x += 17;
          // Draw border for image placeholder
          doc.setDrawColor(0, 0, 0);
          doc.rect(x, y, 75, 75);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);


          const heatmapImg2 = new Image();
          heatmapImg2.crossOrigin = "anonymous";
          heatmapImg2.src = xrayData.heatmap || xrayData.url;
          heatmapImg2.onload = async () => {
            doc.addImage(heatmapImg2, "PNG", x, y, 150, 150);

            // Draw border for heatmap image
            doc.setDrawColor(0, 0, 0);
            doc.rect(x, y, 150, 150);

            y += 160;

            // ----------------- Transformed Image Section -----------------
            checkYPosition(200);
            doc.setDrawColor(0, 0, 128);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 128);
            doc.text("Transformed Image", x, y);
            doc.setLineWidth(0.025); // Thin line
            doc.line(x, y + 1, x + 39, y + 1);
            y += 15;
            x += 17;
            // Draw border for image placeholder
            doc.setDrawColor(0, 0, 0);
            doc.rect(x, y, 75, 75);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            const transformedImg1 = new Image();
            transformedImg1.crossOrigin = "anonymous";
            transformedImg1.src = await generateNegativeImage(xrayData?.url) || xrayData?.url;
            transformedImg1.onload = () => {
              doc.addImage(transformedImg1, "PNG", x, y, 75, 75);
              doc.text("Negative Image", x, y - 2);

              // Draw border for transformed image
              doc.setDrawColor(0, 0, 0);
              doc.rect(x + 80, y, 75, 75);

              // Load and add the transformed image2
              const transformedImg2 = new Image();
              transformedImg2.crossOrigin = "anonymous";
              transformedImg2.src = annotatedImageUrl || xrayData?.url;
              transformedImg2.onload = () => {
                doc.addImage(transformedImg2, "PNG", x + 80, y, 75, 75);
                doc.text("Doctor's Annotated", x + 80, y - 2);

                // Draw border for transformed image
                doc.setDrawColor(0, 0, 0);
                doc.rect(x + 80, y, 75, 75);

                y += 82;

                //second row
                // Draw border for image placeholder
                doc.setDrawColor(0, 0, 0);
                doc.rect(x, y, 75, 75);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                // Load and add the transformed image
                const transformedImg3 = new Image();
                transformedImg3.crossOrigin = "anonymous";
                transformedImg3.src = xrayData?.ctr?.imageUrl || xrayData?.url;
                transformedImg3.onload = () => {
                  doc.addImage(transformedImg3, "PNG", x, y, 75, 75);
                  doc.text("CTR", x, y - 2);

                  // Draw border for transformed image
                  doc.setDrawColor(0, 0, 0);
                  doc.rect(x + 80, y, 75, 75);

                  // Load and add the transformed image2
                  const transformedImg4 = new Image();
                  transformedImg4.crossOrigin = "anonymous";
                  transformedImg4.src = xrayData?.clahe || xrayData?.url;
                  transformedImg4.onload = () => {
                    doc.addImage(transformedImg4, "PNG", x + 80, y, 75, 75);
                    doc.text("Clahe", x + 80, y - 2);

                    // Draw border for transformed image
                    doc.setDrawColor(0, 0, 0);
                    doc.rect(x + 80, y, 75, 75);

                    y += 90;
                    x -= 17;
                    doc.setLineWidth(0.025); // Thin line
                    doc.line(x, y, doc.internal.pageSize.getWidth() - x, y);
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(12);
                    doc.text("*** End of Report ***", 105, y + 5, {
                      align: "center",
                    });

                    y += 15;
                    // Dotted underline for signature
                    doc.setLineDash([1, 1], 0);
                    doc.line(x, y, x + 50, y);
                    y += 10;

                    // Doctor's name and designation
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.text(formData.radiologist, x, y);
                    y += 7;
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.text("(MD,Radiologist)", x, y);

                    // Save the PDF
                    // doc.save(
                    //   `${patientSlug}-${report.examDate
                    //     ? new Date(report.examDate).toLocaleDateString()
                    //     : new Date().toLocaleDateString()
                    //   }-report.pdf`
                    // );
                    const pdfBlob = doc.output("blob");
                    setPendingPdfBlob(pdfBlob);
                    setUsbModalOpen(true);


                    // Stop the loader after all operations are done
                    setReportLoading(false);
                  };
                };
              };
            };
          }
        };
      };
      // };
    } catch (error) {
      toast.error("Failed to generate report. Please try again.");
      setReportLoading(false);
    } finally {
    }
  };

  const handleMouseEnter = (index) => {
    document.querySelectorAll(".tier-card").forEach((card, idx) => {
      if (idx !== index) {
        card.classList.add("blur-custom", "scale-90");
      }
    });
  };

  const handleMouseLeave = () => {
    document.querySelectorAll(".tier-card").forEach((card) => {
      card.classList.remove("blur-custom", "scale-90");
    });
  };

  const navigate = useNavigate();


  const warnedRef = useRef(false);  // ← guard ref

  useEffect(() => {
    if (warnedRef.current) return;  // ← bail out if already warned

    const isMobile =
      window.innerWidth < 1024 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isMobile) {
      toast.warn("This page is for desktop devices; design may change on other devices");
      warnedRef.current = true;
    }
  }, []);

  return (
    <div className="relative dark:bg-[#030811] bg-[#fdfdfd] pt-24 sm:pt-32 min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="absolute top-4 left-4"
      >
        <img
          src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"
          alt="Logo"
          className="h-14 w-auto invert grayscale dark:invert-0 "
        />
      </motion.div>
      <button
        className="ml-5 pl-5 dark:text-[#fdfdfd] text-[#030811] items-center bg-[#5c60c6] py-5 px-5 rounded-full hover:bg-[#a591ff]"
        onClick={() => navigate(-1)}
      >
        <GoArrowLeft size={24} />
      </button>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-5xl font-semibold tracking-tight dark:text-[#fdfdfd] text-[#030811] sm:text-6xl">
            Download Report
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium dark:text-[#fdfdfd] text-[#030811] sm:text-xl/8 text-center">
          Download the report according to your choice.
        </p>
        <div className="isolate mx-auto mt-16 grid items-stretch max-w-md grid-cols-1 gap-x-10  sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 p-0">
          {tiers.map((tier, index) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? "lg:z-10" : "",
                "tier-card group flex flex-col justify-between rounded-3xl dark:bg-[#030811] bg-[#fdfdfd] p-8 ring-1 ring-[#5c60c6] xl:p-10 transition-transform transform-gpu hover:scale-105 shadow-custom-blue hover:blur-none"
              )}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={classNames(
                      tier.mostPopular
                        ? "text-[#5c60c6]"
                        : "dark:text-[#fdfdfd] text-[#030811]",
                      "text-3xl font-semibold h-[6vh]"
                    )}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular && (
                    <p className="rounded-full dark:bg-[#030811]/30 bg-[#fdfdfd] px-2.5 py-1 text-xs font-semibold text-[#5c60c6]">
                      Recommended
                    </p>
                  )}
                </div>
                <p className="mt-4 text-sm dark:text-gray-100 text-[#030811]">
                  {tier.description}
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm dark:text-gray-100 text-[#030811]"
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        aria-hidden="true"
                        className="h-6 w-5 flex-none text-[#5c60c6]"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleOpenModal(tier.id)}
                className="mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
              >
                Download Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/*
  USB path picker modal with toast notifications and loader
*/}
      <UsbFolderPicker
        open={usbModalOpen}
        onClose={() => setUsbModalOpen(false)}
        onSelectFolder={async (folderPath) => {
          setUsbModalOpen(false);
          if (!pendingPdfBlob) return;
          setReportLoading(true); // Show loader
          const formData = new FormData();
          formData.append("file", pendingPdfBlob, "CXR-Report.pdf");
          formData.append("targetPath", folderPath);

          try {
            const response = await fetch(`${config.API_URL}/api/save-to-usb`, {
              method: "POST",
              body: formData,
            });
            if (response.ok) {
              toast.success("Report saved to USB!");
            } else {
              const data = await response.json();
              toast.error("Error saving to USB: " + (data.error || "Unknown error"));
            }
          } catch (err) {
            toast.error("Failed to save to USB: " + err.message);
          } finally {
            setReportLoading(false); // Hide loader
            setPendingPdfBlob(null);
          }
        }}
      />
      {/* Loader overlay when saving to USB */}
      {reportLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center dark:bg-[#030811]/50 bg-[#fdfdfd]/50 bg-opacity-50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center">
            <BarLoader />
            <span className="mt-4 text-lg text-[#5c60c6]">Saving report to USB...</span>
          </div>
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white dark:bg-[#030811] py-6 w-[600px] px-16 rounded-lg shadow-lg relative border border-indigo-600">
            <button
              className="absolute top-6 right-4"
              onClick={handleCloseModal}
            >
              <FaXmark className="h-7 w-7 dark:text-white" />
            </button>
            <h2 className="text-2xl font-bold mb-8 text-center text-black dark:text-white">
              Enter Patient Details
            </h2>
            <div className="flex flex-col gap-6">
              <label className="text-gray-700 dark:text-white">
                Patient Name
                <input
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="Patient Name"
                  required
                  className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                />
              </label>

              <label className="text-gray-700 dark:text-white">
                Referred By
                <input
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleInputChange}
                  placeholder="Referred By"
                  required
                  className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                />
              </label>

              <label className="text-gray-700 dark:text-white">
                Radiologist
                <input
                  name="radiologist"
                  value={formData.radiologist}
                  onChange={handleInputChange}
                  placeholder="Radiologist"
                  required
                  className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                />
              </label>

              <label className="text-gray-700 dark:text-white">
                Location
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Location"
                  required
                  className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                />
              </label>

              <label className="text-gray-700 dark:text-white">
                Advice
                <input
                  name="advice"
                  value={formData.advice}
                  onChange={handleInputChange}
                  placeholder="Advice"
                  required
                  className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                />
              </label>

              <label className="text-gray-700 dark:text-white">
                Body Part Examined
                <select
                  name="bodyPartExamined"
                  required
                  value={formData.bodyPartExamined}
                  onChange={handleInputChange}
                  className="px-3 py-2 rounded-md border-2 border-gray-400 bg-white w-full mt-1 dark:text-gray-800"
                >
                  <option value="Chest">Chest</option>
                  <option value="Bone">Bone</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              {formData.bodyPartExamined === "Other" && (
                <label className="text-gray-700 dark:text-white">
                  Specify Other Body Part
                  <input
                    name="otherBodyPart"
                    value={formData.otherBodyPart}
                    onChange={handleInputChange}
                    placeholder="Specify Other Body Part"
                    className="px-3 py-2 rounded-md border-2 border-gray-400 w-full mt-1 dark:text-gray-800"
                  />
                </label>
              )}

              <button
                onClick={handleGenerateReport}
                className="block rounded-md px-3 py-2 text-center text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 mt-4"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {(reportLoading && !showModal) && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center dark:bg-[#030811]/50 bg-[#fdfdfd]/50 bg-opacity-50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center">
            <BarLoader />
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
