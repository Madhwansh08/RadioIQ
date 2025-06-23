"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Header from "../components/Header";
import NuvaLogo from "../assets/Nuva Logo.mp4";
import meril from "../assets/meril.jpg";
import ISO from "../assets/ISO.png";

const accordionData = [
  {
    id: 1,
    title: "AI-Powered Diagnostics",
    content:
      "Automatically detects and analyzes lung abnormalities with high precision.",
  },
  {
    id: 2,
    title: "Time-Based Comparisons",
    content:
      "Tracks disease progression by comparing past X-rays for better insights.",
  },
  {
    id: 3,
    title: "Comprehensive Reporting",
    content:
      "Generates detailed diagnostic reports in both clinical and patient-friendly formats.",
  },
  {
    id: 4,
    title: "Interactive Radiologist Tools",
    content:
      "Allows radiologists to adjust AI-generated annotations and provide feedback.",
  },
  {
    id: 5,
    title: "Secure & Scalable Infrastructure",
    content:
      "Ensures data security, high availability, and seamless hospital system integration.",
  },
];

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (id) => {
    setActiveIndex(activeIndex === id ? null : id);
  };

  return (
    <div className="bg-white dark:bg-black relative">
      {/* Header */}

      <div className="relative inset-0 h-[70vh]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover z-10"
        >
          <source src={NuvaLogo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <Header />

      <div className="relative z-10">
        <div className="w-full flex items-center justify-center -mt-32">
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-[70%] mx-auto p-6 py-16 text-center rounded-2xl bg-[#030811] dark:bg-[#fdfdfd] shadow-lg shadow-[#5c60c6]"
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold mb-10 text-[#5c60c6]"
            >
              Revolutionizing Radiological Diagnostics with AI
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="dark:text-[#030811] text-[#fdfdfd] text-lg text-justify"
            >
              "RadioIQ is an AI-powered healthcare application designed to
              transform radiological diagnostics by automating X-ray analysis.
              Utilizing advanced deep learning models, it detects and highlights
              abnormalities with high precision, assisting radiologists in
              making faster and more accurate clinical decisions. The platform
              enhances diagnostic workflows, reducing turnaround times while
              ensuring consistent and reliable results. With features like
              automated image annotation, confidence scoring, and historical
              comparisons, RadioIQ empowers healthcare providers with
              data-driven insights, ultimately improving patient outcomes and
              bridging the gap in radiology accessibility worldwide."
            </motion.p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-6 px-4 py-2 bg-[#5c60c6] text-white rounded-xl inline-block"
            >
              <p className="font-medium text-xl">
                AI-powered insights, seamless diagnostics, and enhanced clinical
                confidence.
              </p>
            </motion.div>
          </motion.section>
        </div>
      </div>

      {/* Mission and vision section */}
      <div className="relative">
        <div className="mx-auto mt-32 max-w-7xl z-10">
          <div className="relative isolate overflow-hidden px-6 py-24 bg-[#030811] dark:bg-[#fdfdfd]  text-center shadow-lg shadow-[#5c60c6] sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto text-5xl font-bold tracking-tight text-[#5c60c6]">
              Our Mission
            </h2>
            <p className="mx-auto mt-6 text-lg/8 dark:text-[#030811] text-[#fdfdfd] text-justify">
              At RadioIQ, our mission is to revolutionize radiological
              diagnostics by integrating cutting-edge AI technologies. We aim to
              reduce diagnostic delays, enhance accuracy, and optimize
              workflows, allowing radiologists to focus on complex cases while
              minimizing human errors. By ensuring seamless scalability and
              accessibility, we strive to make high-quality diagnostic tools
              available to healthcare providers of all sizes. Our AI systems are
              designed not only to assist but to subtly perceive patterns often
              overlooked by the human eye—supporting clinicians in making more
              informed decisions. Through innovation, efficiency, and compliance
              with international standards, we are committed to improving
              patient care and advancing the future of medical imaging.
            </p>
            <div
              aria-hidden="true"
              className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl"
            >
              <div
                style={{
                  clipPath:
                    "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
                }}
                className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mb-16 mt-32 max-w-7xl z-10">
          <div className="relative isolate overflow-hidden px-6 py-24 text-center bg-[#030811] dark:bg-[#fdfdfd] shadow-lg shadow-[#5c60c6] sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto text-5xl font-bold text-[#5c60c6]">
              Our Vision
            </h2>
            <p className="mx-auto mt-6  text-lg/8 text-justify dark:text-[#030811] text-[#fdfdfd]">
              We envision a future where AI-powered X-ray abnormality
              diagnostics redefine radiology—making accurate, timely, and
              insightful healthcare accessible to all. By bridging the gap
              between data and diagnosis, we aim to empower clinicians with
              tools that extend perception and elevate care.Our goal is to
              empower radiologists with intelligent tools that automate routine
              tasks, enhance decision-making, and improve patient outcomes. By
              continuously refining AI models and integrating with hospital
              systems, we aim to create a seamless, scalable, and globally
              accessible solution. RadioIQ aspires to be at the forefront of
              medical innovation, bridging the gap between technology and
              healthcare to deliver precision-driven, life-saving diagnostics.
            </p>
            <div
              aria-hidden="true"
              className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl"
            >
              <div
                style={{
                  clipPath:
                    "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
                }}
                className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us? */}
      <div className="w-full flex flex-col items-center justify-center mt-40 mb-16">
        <h2 className="t w-[70%] text-7xl font-bold text-left mb-12 text-[#030811] dark:text-[#fdfdfd]">
          Why Choose RadioIQ?
        </h2>
        <div className="flex w-[70%] items-center justify-center gap-y-20">
          <div className="w-1/2 mx-auto p-4 z-10">
            <div className="space-y-3">
              {accordionData.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full flex justify-between items-center p-4 bg-inverse opacity-90 transition-all hover:cursor-pointer"
                  >
                    <span className="text-xl font-semibold text-[#030811] dark:text-[#fdfdfd]">
                      {item.title}
                    </span>
                    {activeIndex === item.id ? (
                      <ChevronUpIcon className="h-6 w-6 text-[#030811] dark:text-[#fdfdfd]" />
                    ) : (
                      <ChevronDownIcon className="h-6 w-6 text-[#030811] dark:text-[#fdfdfd]" />
                    )}
                  </button>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={
                      activeIndex === item.id
                        ? { height: "auto", opacity: 1 }
                        : { height: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 text-[#5c60c6]">{item.content}</div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-1/2">
            <img
              src="https://radioiq.s3.ap-south-1.amazonaws.com/static/RV_load.gif"
              alt="gif"
              className="ml-20 w-[500px]"
            />
          </div>
        </div>
      </div>
	  
	  <div className="mx-auto mb-16 mt-32 max-w-7xl z-10">
        <div className="relative isolate overflow-hidden px-6 py-16 bg-[#030811] dark:bg-[#fdfdfd] shadow-lg shadow-[#5c60c6] sm:rounded-3xl sm:px-16 flex flex-col md:flex-row items-center justify-center text-center md:text-left">
          {/* ISO Image - Replace the src below with your actual ISO image path */}
          <div className="flex-shrink-0 mb-8 md:mb-0 md:mr-12 w-full md:w-auto flex justify-center">
            <img
              src={ISO} // Update this path to your actual ISO image
              alt="ISO Certification"
              className="w-72 h-72 object-contain rounded-lg p-2"
            />
          </div>
          {/* Content */}
          <div className="mx-auto max-w-3xl text-left text-lg dark:text-[#030811] text-[#fdfdfd] space-y-2">
            <p>
              <span className="font-semibold">Manufacturer Name:</span> Nuvo AI Pvt. Ltd.
            </p>
            <p>
              <span className="font-semibold">Address:</span> 135/139 Survey No. 135/139 Muktanand Marg, Bilakhia House, Chala, Vapi, Pardi, Valsad Gujarat India-396191
            </p>
            <p>
              <span className="font-semibold">Label No.:.</span>NAI/LBL/RadioIQ_Offline/01
            </p>
            <p>
              <span className="font-semibold">Version:</span> 1.0.0
            </p>
            <p>
              <span className="font-semibold">QMS Lic.:</span> EN ISO 13485: 2016
            </p>
            <p>
              <span className="font-semibold">QMS Lic. No:</span> QMS-13-016-2025
            </p>
            <p>
              <span className="font-semibold">QMS. Lic. No. issue date:</span> June 2025
            </p>
          </div>
          <div
            aria-hidden="true"
            className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
              }}
              className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
            />
          </div>
        </div>
      </div>

      {/* <main className="isolate"> */}
      {/* Family section */}
      {/* <div className="relative isolate -z-10 overflow-hidden bg-gradient-to-b from-indigo-100/20">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-black dark:bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96"
          />
          <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8"> */}
      {/* <h1 className="max-w-2xl text-balance text-5xl mt-16 font-semibold tracking-tight text-[#5c60c6] sm:text-7xl lg:col-span-2 xl:col-auto">
                The Bilakhia Family Journey
              </h1>
              <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
                <p className="text-pretty text-lg font-medium dark:text-gray-500 text-gray-300 sm:text-xl/8">
                  Over the past three decades, The Bilakhia Family has worked
                  towards accelerating technologies over various fronts. From
                  spearheading the printing inks and agrochemical sectors to
                  becoming one of the largest medical device companies in Asia.
                </p>
              </div>
              <img
                alt=""
                src={meril}
                className="w-full max-w-lg rounded-2xl object-cover lg:max-w-none xl:row-span-2 xl:row-end-2 ml-48 mt-20"
              />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t dark:from-[#fdfdfd] from-[#030811]" />
        </div>
      </main> */}
      <div className="mt-20 w-full h-[60vh]">
        <img
          alt=""
          src={meril}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
