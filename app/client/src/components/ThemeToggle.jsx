import { motion } from "framer-motion";
import { FiMoon, FiSun } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../redux/slices/themeSlice";

const TOGGLE_CLASSES =
  "text-sm font-medium flex items-center gap-2 px-3 md:pl-3 md:pr-3.5 py-3 md:py-1.5 transition-colors relative z-10";

const ThemeToggle = () => {
  const theme = useSelector((state) => state.theme); // Get theme from Redux
  const dispatch = useDispatch();

  // Ensure the theme is applied to the HTML root element
  const applyThemeToDOM = (theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Apply the current theme on component mount and whenever it changes
  applyThemeToDOM(theme);

  return (
    <div className="relative flex w-fit items-center rounded-full">
      {/* Light Theme Button */}
      <button
        className={`${TOGGLE_CLASSES} ${
          theme === "light" ? "text-white" : "text-slate-200"
        }`}
        onClick={() => theme === "dark" && dispatch(toggleTheme())}
      >
        <FiSun className="relative z-10 text-lg md:text-sm" />
        <span className="relative z-10">Light</span>
      </button>

      {/* Dark Theme Button */}
      <button
        className={`${TOGGLE_CLASSES} ${
          theme === "dark" ? "text-white" : "text-slate-800"
        }`}
        onClick={() => theme === "light" && dispatch(toggleTheme())}
      >
        <FiMoon className="relative z-10 text-lg md:text-sm" />
        <span className="relative z-10">Dark</span>
      </button>

      {/* Animated Slider */}
      <div
        className={`absolute inset-0 z-0 flex ${
          theme === "dark" ? "justify-end" : "justify-start"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", damping: 15, stiffness: 250 }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-600 to-[#5c60c6]"
        />
      </div>
    </div>
  );
};

export default ThemeToggle;
