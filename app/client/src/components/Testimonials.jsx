import React from "react";
import user from "../assets/user.png";

const testimonials = [
  {
    id: 1,
    name: "Dr. Aarav Kumar",
    content:
      "RadioIQ is an incredible tool that detects abnormalities in lung X-rays, reducing doctors' workload and enhancing diagnostic efficiency.",
  },
  {
    id: 2,
    name: "Dr. Priya Sharma",
    content:
      "This platform has transformed my diagnostic process, helping to detect abnormalities with ease and minimizing my workload significantly.",
  },
  {
    id: 3,
    name: "Dr. Rajesh Patel",
    content:
      "RadioIQ is an essential tool for doctors, providing accurate lung X-ray analysis and easing the burden of manual diagnoses.",
  },
  {
    id: 4,
    name: "Dr. Neha Gupta",
    content:
      "Thanks to RadioIQ, detecting lung abnormalities has become faster and more accurate, significantly reducing my daily workload.",
  },
  {
    id: 5,
    name: "Dr. Rohan Deshmukh",
    content:
      "RadioIQ has been a game-changer, streamlining the detection of lung issues and making our diagnostic process much more efficient.",
  },
  {
    id: 6,
    name: "Dr. Sanya Mehta",
    content:
      "RadioIQ allows for quick and accurate lung X-ray analysis, making it an indispensable tool in reducing doctors' workload and errors.",
  },
  {
    id: 7,
    name: "Dr. Vikram Singh",
    content:
      "I rely on RadioIQ to identify lung abnormalities. It has made a significant difference in my workflow and diagnostic accuracy.",
  },
  {
    id: 8,
    name: "Dr. Ananya Rao",
    content:
      "RadioIQ has revolutionized our approach to lung X-rays, making it easier to detect abnormalities and significantly lowering the workload on doctors.",
  },
];

const Testimonials = () => {
  return (
    <div className="overflow-hidden py-10 dark:bg-[#030811] bg-[#fdfdfd] sm:py-16 lg:py-24">
      <section className="relative px-4 mx-auto max-w-8xl sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold leading-tight dark:text-[#fdfdfd] text-[#030811] sm:text-4xl lg:text-5xl">
            Some words from Radiologists
          </h2>
        </div>

        {/* Scrolling Section */}
        <div className="relative mt-12 overflow-hidden">
          <div className="flex space-x-8 animate-scroll">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 dark:bg-[#030811] bg-[#fdfdfd] rounded-lg border border-[#5c60c6] shadow-lg hover:shadow-xl hover:scale-90 transition-transform duration-300"
              >
                <div className="px-6 py-8">
                  <div className="flex items-center justify-between">
                    <img
                      className="flex-shrink-0 object-cover w-14 h-14 rounded-full"
                      src={user}
                      alt={`Testimonial ${testimonial.id}`}
                    />
                    <div className="min-w-0 ml-4 mr-auto">
                      <p className="text-lg font-semibold dark:text-[#fdfdfd] text-[#030811] truncate">
                        {testimonial.name}
                      </p>
                    </div>
                  </div>
                  <blockquote className="mt-6 space-y-2">
                    <p className="text-lg dark:text-[#fdfdfd] text-[#030811] leading-relaxed">
                      {testimonial.content}
                    </p>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyframe Animation */}
      <style>
        {`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .animate-scroll {
            display: flex;
            gap: 2rem;
            will-change: transform;
            animation: scroll 25s linear infinite;
            padding-left: 1rem;
          }

          .animate-scroll > * {
            flex: 0 0 calc(100% - 1rem);
          }

          @media (min-width: 768px) {
            .animate-scroll > * {
              flex: 0 0 calc(50% - 1rem);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Testimonials;
