import React, {useState} from "react";
import LogoImage from "./../assets/logo.png";
import PdfModal from "./PdfModal";
import userManual from "../assets/RadioIQ+User+Manual.pdf";
import tnc from "./../assets/Radioiq-TnC.pdf";
import pp from "../assets/Radioiq-PP.pdf";

const Footer = ({ scrollToFeatures, setDrawerOpen }) => {
  const [pdfModal, setPdfModal] = useState({ open: false, url: "", title: "" });

  return (
    <footer>
      <section className="py-10 dark:bg-[#030811] bg-[#fdfdfd] sm:pt-16 lg:pt-24">
        <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-12">
            <div>
              <p className="text-xl font-bold dark:text-gray-500 text-[#030811]">
                Company
              </p>
              <ul className="mt-8 space-y-4">
                <li>
                  <a
                    href="/about"
                    title="About"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    About{" "}
                  </a>
                </li>
                <li>
                  <button
                    onClick={scrollToFeatures}
                    title="Features"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    Features{" "}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setPdfModal({ open: true, url: userManual, title: "User Manual" })}
                    title="User Manual"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  // ... other props
                  >{" "}User Manual{" "}</button>
                </li>
              </ul>
            </div>

            <PdfModal
              open={pdfModal.open}
              pdfUrl={pdfModal.url}
              title={pdfModal.title}
              onClose={() => setPdfModal({ ...pdfModal, open: false })}
            />

            <div>
              <p className="text-xl font-bold dark:text-gray-500 text-[#030811]">
                Help
              </p>
              <ul className="mt-8 space-y-4">
                <li>
                  <button
                    onClick={() => setDrawerOpen(true)}
                    title="Customer Support"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    Customer Support{" "}
                  </button>
                </li>

                <li>
                  <a
                    href={tnc}
                    target="_blank"
                    title="Terms & Conditions"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    Terms &amp; Conditions{" "}
                  </a>
                </li>
                <li>
                  <a
                    href={pp}
                    target="_blank"
                    title="Privacy Policy"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    Privacy Policy{" "}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xl font-bold dark:text-gray-500 text-[#030811]">
                Experts Involved
              </p>
              <ul className="mt-8 space-y-4">
                <li>
                  <span className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80">
                    {" "}
                    Radiologists{" "}
                  </span>
                </li>
                <li>
                  <span className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80">
                    {" "}
                    Pulmonary Specialist{" "}
                  </span>
                </li>

                <li>
                  <span className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80">
                    {" "}
                    IIT Professors{" "}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xl dark:text-gray-500 text-[#030811] font-bold">
                Explore Other Products
              </p>
              <ul className="mt-8 space-y-4">
                <li>
                  <a
                    href="#"
                    title="DicomPixel"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    DicomPixel{" "}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    title="TaviVision"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    TaviVision{" "}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    title="Ophthalmvision"
                    className="text-base dark:text-[#fdfdfd] text-[#030811] transition-all duration-200 hover:text-opacity-80 focus:text-opacity-80"
                  >
                    {" "}
                    Ophthalmvision{" "}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <hr className="mt-16 mb-10 border-gray-800" />
          <div className="flex flex-wrap items-center w-full justify-between">
            <div>
              <img className="h-8 auto md:order-1 dark:invert-0 invert" src={LogoImage} alt="" />
            </div>
            <div>
              <p className="w-full mt-8 text-sm text-center dark:text-[#fdfdfd] text-[#030811] md:mt-0 md:w-auto md:order-2">
                © Copyright 2025, All Rights Reserved by Nuvoai | v1.0.1
              </p>
            </div>
            <div>
              <div>{" "}</div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
