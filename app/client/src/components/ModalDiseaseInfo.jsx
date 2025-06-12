import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lung_nodule from '../assets/diseases/Nodule.png';
import consolidation from '../assets/diseases/Consolidation.png';
import pleural_effusion from '../assets/diseases/Pleural Effusion.png';
import opacity from '../assets/diseases/Opacity.png';
import rib_fractures from '../assets/diseases/Rib Fractures.png';
import pneumothorax from '../assets/diseases/Pneumothorax.png';
import cardiomegaly from '../assets/diseases/Cardiomegaly.png';

// Fill these with actual images & descriptions for your 7 diseases
const DISEASES = [
  {
    name: "Lung Nodules",
    image: lung_nodule,
    description:
      "A lung nodule (pulmonary nodule), is a small (<3cm) growth in the lung and are common. On chest X-rays or a CT scan, these nodules look different from the surrounding (normal) lung tissue. Common causes of lung nodules are inflamed tissue due to an infection or inflammation or benign lung tumors.",
  },
  {
    name: "Consolidation",
    image: consolidation,
    description:
      "Lung consolidation is when the air in the small airways of the lungs is replaced with a fluid, solid, or other material such as pus, blood, water, stomach contents, or cells. It can be caused by conditions like aspiration, pneumonia, and lung cancer.",
  },
  {
    name: "Pleural effusion",
    image: pleural_effusion,
    description:
      "Pleural effusion is the accumulation of excess fluid in the pleural space surrounding the lungs. On chest X-rays, it appears as a homogenous opacity with blunting of the costophrenic angle. Common causes include heart failure, infections, and malignancies.",
  },
  {
    name: "Opacity",
    image: opacity,
    description:
      "An opacity on a chest X-ray indicates an area where the lung appears more solid, suggesting a decrease in air content. This can result from various conditions, including infections, hemorrhage, edema, or malignancies.",
  },
  {
    name: "Rib fractures",
    image: rib_fractures,
    description:
      "Rib fractures are breaks in the rib bones, often due to trauma. They can be identified on chest X-rays, though some may not be visible. Complications include pneumothorax and pulmonary contusion.",
  },
  {
    name: "Pneumothorax",
    image: pneumothorax,
    description:
      "Pneumothorax is the presence of air in the pleural space, causing lung collapse. On chest X-rays, it appears as an area without lung markings. Symptoms include sudden chest pain and shortness of breath.",
  },
  {
    name: "Cardiomegaly",
    image: cardiomegaly,
    description:
      "Cardiomegaly refers to an enlarged heart, visible on chest X-rays as an increased cardiothoracic ratio (>50%). It can result from conditions like hypertension, heart valve disease, or cardiomyopathy.",
  },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } },
  exit: { opacity: 0, scale: 0.9, y: 80, transition: { duration: 0.15 } }
};

const sideListVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200 } }
};

const ModalDiseaseInfo = ({ open, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const modalRef = useRef();

  // Handle click outside modal to close
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Allow ESC to close
  React.useEffect(() => {
    if (!open) return;
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onMouseDown={handleBackdropClick}
        >
          <motion.div
            className="
              dark:bg-gray-950 bg-gray-50 rounded-xl p-0 flex flex-col md:flex-row shadow-2xl border border-[#5c60c6]
              md:min-w-[700px] md:max-w-[900px] max-h-[90vh] overflow-y-auto
            "
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            ref={modalRef}
            onMouseDown={(e) => e.stopPropagation()} // Prevent click inside from triggering backdrop
          >
            {/* Left side: Disease list */}
            <motion.div
              className="
                md:w-1/3 flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-[#22223c]
                dark:bg-[#030811] bg-gray-200 rounded-t-xl md:rounded-l-xl md:rounded-tr-none py-3 md:py-6
                overflow-x-auto md:overflow-x-visible
              "
              initial="initial"
              animate="animate"
              variants={sideListVariants}
            >
              <h2 className="px-6 pb-2 md:pb-4 font-semibold text-base md:text-lg text-[#5c60c6] hidden md:block">
                Diseases
              </h2>
              <ul className="flex md:flex-col flex-row gap-1 px-2 justify-center">
                {DISEASES.map((d, i) => (
                  <motion.li
                    key={d.name}
                    onClick={() => setSelectedIdx(i)}
                    className={`cursor-pointer rounded-lg px-3 md:px-4 py-2 mb-1 transition-colors duration-150 text-xs md:text-base
                      ${selectedIdx === i
                        ? "bg-[#5c60c6] dark:text-white text-white"
                        : "bg-transparent dark:text-gray-300 text-gray-800 hover:dark:text-white hover:bg-[#23265a]"
                      }
                      min-w-fit text-center
                    `}
                    tabIndex={0}
                    variants={itemVariants}
                    whileTap={{ scale: 0.96 }}
                    whileHover={selectedIdx !== i ? { scale: 1.07 } : {}}
                  >
                    {d.name}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            {/* Right side: Image + Description */}
            <div className="w-full md:w-2/3 flex flex-col items-center justify-center px-4 md:px-8 py-6 md:py-8">
              <motion.button
                onClick={onClose}
                className="self-end mb-2 md:mb-4 text-gray-400 hover:text-[#5c60c6] text-2xl font-bold transition-colors"
                aria-label="Close"
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                ×
              </motion.button>
              <AnimatePresence mode="wait">
                <motion.img
                  key={DISEASES[selectedIdx].image}
                  src={DISEASES[selectedIdx].image}
                  alt={DISEASES[selectedIdx].name}
                  className="w-40 h-40 md:w-60 md:h-60 object-cover rounded-lg border-2 border-[#5c60c6] shadow-lg mb-4 md:mb-6"
                  style={{ background: "#181a2c" }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                />
              </AnimatePresence>
              <motion.h3
                className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-[#5c60c6]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                key={DISEASES[selectedIdx].name}
              >
                {DISEASES[selectedIdx].name}
              </motion.h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={DISEASES[selectedIdx].description}
                  className="text-base md:text-lg dark:text-gray-200 text-gray-800 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {DISEASES[selectedIdx].description}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalDiseaseInfo;