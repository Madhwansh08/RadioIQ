import React, { useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import comingimg from "../assets/coming.png";

const Research = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: {
      perView: 1,
      spacing: 15,
      origin: "center",
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: {
          perView: 2,
          spacing: 20,
        },
      },
      "(min-width: 1024px)": {
        slides: {
          perView: 3,
          spacing: 25,
        },
      },
    },
  });

  const researchData = [
    {
      img: comingimg,
      category: "Technology",
      title: "AI Chatbot for Seamless Interaction",
      description:
        "Engage with our intelligent chatbot for real-time support and guidance, making your interaction with our AI both natural and efficient.",
    },
    {
      img: comingimg,
      category: "Technology",
      title: "Advanced Bone Suppression",
      description:
        "Experience clearer radiological images with our advanced bone suppression technology that minimizes visual interference for more precise diagnostics.",
    },
    {
      img: comingimg,
      category: "Technical",
      title: "Enhanced Abnormality Detection & Classification",
      description:
        "Expanding our AI’s capabilities to detect a wider range of abnormalities, ensuring a more comprehensive and reliable diagnostic process.",
    },
    {
      img: comingimg,
      category: "Technical",
      title: "Multi-Modal Report Generation",
      description:
        "Generate detailed diagnostic reports that integrate labeled X-ray findings, AI insights, and natural language explanations, along with comparisons to previous scans.",
    },
  ];

  const toggleDescription = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="py-10 bg-gradient-to-b dark:from-[#030811] dark:to-[#0c051b] from-[#fdfdfd] to-[#fdfefd] sm:py-16 lg:py-24">
      <div className="relative px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold leading-tight dark:text-[#fdfdfd] text-[#030811] sm:text-4xl lg:text-5xl">
            Coming up next
          </h2>
        </div>

        <div ref={sliderRef} className="keen-slider mt-12 lg:mt-16">
          {researchData.map((item, index) => (
            <div
              key={item.title}
              className="keen-slider__slide min-w-[300px] max-w-[400px] mx-auto"
            >
              <div className="bg-gradient-to-b dark:from-[#030811] dark:to-[#0c051b] from-[#fdfdfd] to-[#fdfefd] p-6 rounded-xl shadow-lg h-full flex flex-col">
                <div className="mb-4 flex-1">
                  <div className="aspect-w-4 aspect-h-3">
                    <img
                      className="object-cover w-full h-full rounded-t-xl"
                      src={item.img}
                      alt={item.title}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="inline-flex px-4 py-2 text-xs font-semibold tracking-widest uppercase rounded-full text-[#5c60c6] dark:bg-[#030811] bg-[#fdfdfd] border-2 border-[#5c60c6]">
                    {item.category}
                  </span>
                  <p className="mt-4 text-xl font-semibold">
                    <button
                      title={item.title}
                      className="dark:text-[#fdfdfd] dark:hover:text-[#5c60c6] text-[#030811] hover:text-[#5c60c6] bg-transparent border-none p-0 cursor-pointer text-left"
                    >
                      {item.title}
                    </button>
                  </p>

                  <button
                    className="lg:hidden mt-2 self-center transform transition-transform"
                    onClick={() => toggleDescription(index)}
                  >
                    <svg
                      className={`w-6 h-6 dark:text-[#fdfdfd] text-[#030811] transform ${
                        expandedIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div
                    className={`mt-4 text-sm dark:text-[#d0d0d0] text-[#030811] ${
                      expandedIndex === index ? "block" : "hidden lg:block"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="hidden lg:block absolute top-1/2 left-0 transform -translate-y-1/2 p-4 dark:text-[#fdfdfd] dark:bg-[#030811] text-[#030811] bg-[#fdfdfd] rounded-full shadow-lg dark:hover:bg-[#5c60c6] hover:scale-110 transition-transform"
          onClick={() => instanceRef.current?.prev()}
        >
          <svg
            className="w-7 h-7"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          className="hidden lg:block absolute top-1/2 right-0 transform -translate-y-1/2 p-4 dark:text-[#fdfdfd] dark:bg-[#030811] text-[#030811] bg-[#fdfdfd] rounded-full shadow-lg dark:hover:bg-[#5c60c6] hover:scale-110 transition-transform"
          onClick={() => instanceRef.current?.next()}
        >
          <svg
            className="w-7 h-7"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default Research;
