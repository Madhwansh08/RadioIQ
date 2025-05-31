import { motion } from "framer-motion";

const ToolTip = ({ isHovered, gifSrc }) => {
  return (
    isHovered && (
      <motion.span
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute -top-28 left-1/2 transform -translate-x-1/2 bg-[#030811]/70 text-white 
                   text-xs p-2 rounded-lg shadow-lg w-36 h-36 flex items-center justify-center 
                   pointer-events-none"
      >
        <img src={gifSrc} alt="Annotation GIF" className="w-full h-full object-contain rounded-md" />
      </motion.span>
    )
  );
};

export default ToolTip;
