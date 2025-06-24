import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const VIDEO_URL_1 = "https://radioiq.s3.ap-south-1.amazonaws.com/static/Radio+IQ+Video.mp4";
const VIDEO_URL_2 = "https://radioiq.s3.ap-south-1.amazonaws.com/static/Radio+IQ+Video.mp4"; // replace with your second video URL

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
                    imaging by accurately detecting abnormalities. <br />
                    <span className="font-semibold text-[#5c60c6] dark:text-[#b2b7ff]">
                      Scan the QR codes to watch the demo video on your device!
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* QR Codes Section - Hidden on mobile */}
          <div className="hidden lg:flex flex-col items-center justify-center relative h-48 w-full rounded-t-lg sm:h-64 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-1/2">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030811] to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center space-y-8 h-full">
              <div className="flex flex-row items-center justify-center space-x-24">
                <div className="flex flex-col items-center">
                  <QRCodeSVG value={VIDEO_URL_1} size={240} fgColor="#030811" bgColor="#fdfdfd" />
                  <span className="mt-2 text-sm text-[#030811] dark:text-[#fdfdfd] font-medium">
                    Product Demo
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <QRCodeSVG value={VIDEO_URL_2} size={240} fgColor="#5c60c6" bgColor="#fdfdfd" />
                  <span className="mt-2 text-sm text-[#030811] dark:text-[#fdfdfd] font-medium">
                    Admin Demo
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Scan with your camera to view online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}