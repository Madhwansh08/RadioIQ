import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DemoComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white">
      <div className="flex flex-col border-b border-gray-200 lg:border-0">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute hidden h-full w-1/2 bg-gradient-to-b dark:from-[#030811] rounded-t-lg dark:to-[#0b071a] from-[#fdfdfd] to-[#fdfefd] lg:block"
          />
          <div className="relative dark:bg-[#030811] bg-[#fdfdfd] lg:bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-8">
              <div className="mx-auto max-w-2xl py-24 lg:max-w-none lg:py-64">
                <div className="lg:pr-16 lg:mr-12">
                  <h1 className="text-4xl font-bold tracking-tight dark:text-[#fdfdfd] text-[#030811] sm:text-5xl xl:text-6xl">
                    Revolutionizing Healthcare with RadioIQ
                  </h1>
                  <p className="mt-4 text-xl dark:text-gray-400 text-gray-600">
                    Explore how AI-powered solutions are transforming medical
                    imaging by accurately detecting abnormalities. Watch our
                    demo to see the future of diagnostics in action.
                  </p>
                  <div className="mt-8">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="inline-block rounded-md border border-transparent bg-[#5c60c6] px-8 py-3 font-medium text-white hover:bg-indigo-700"
                    >
                      Watch Full Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Video Section - Hidden on mobile */}
          <div className="hidden lg:block relative h-48 w-full rounded-t-lg sm:h-64 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-1/2">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030811] to-transparent pointer-events-none"></div>

            {/* Video */}
            <video
              className="h-full w-full object-contain"
              muted
              loop
              playsInline
              onMouseOver={(e) => e.target.play()}
              onFocus={(e) => e.target.play()}
              onMouseOut={(e) => e.target.pause()}
              onBlur={(e) => e.target.pause()}
            >
              <source
                src="https://radioiq.s3.ap-south-1.amazonaws.com/static/Radio+IQ+Video.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white rounded-lg shadow-lg w-full max-w-6xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                className="absolute top-4 right-4 bg-[#030811] hover:bg-[#5c60c6] text-[#fdfdfd] font-bold rounded-lg p-2 shadow-lg z-50"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ✖
              </button>
              <div className="aspect-w-16 aspect-h-9 relative">
                <iframe
                  className="w-full h-full rounded-b-lg"
                  src="https://radioiq.s3.ap-south-1.amazonaws.com/static/Radio+IQ+Video.mp4"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}