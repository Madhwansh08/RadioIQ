import React, { useEffect, useState, useRef } from "react";
import LogoImage from "./../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import {
  Cog6ToothIcon,
  ArrowsRightLeftIcon
} from "@heroicons/react/24/outline";
import { clearTableData } from "../redux/slices/tableSlice";
import user from "../assets/user.png";
 
const Header = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
 
  const navigate = useNavigate();
 
  // Listen for window resize and scroll events
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };
 
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
 
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
 
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
 
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
 
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearTableData());
      
      toast.success("User logged out");
      navigate("/login");
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error("Logout failed");
    }
  };
 
  // Animated tab for desktop nav links
  const AnimatedTab = ({ children, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
 
    return (
      <div
        className="relative cursor-pointer px-3 py-2"
        role="button"
        tabIndex="0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick();
          }
        }}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        <motion.div
          className="absolute inset-0 rounded-md dark:bg-[#5c60c6] bg-[#5c60c6] z-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
        <motion.span
          className="relative z-10 text-sm font-semibold text-[#fdfdfd]"
          animate={{ color: isHovered ? "#ffffff" : "#fdfdfd" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.span>
      </div>
    );
  };
 
  // Avatar dropdown (for desktop)
  const AvatarDropdown = () => {
    const dropdownRef = useRef(null);
 
    // Close dropdown if clicked outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsDropdownOpen(false);
        }
      };
 
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
 
    return (
      <div className="relative" ref={dropdownRef}>
        <div
          className="w-10 h-10 dark:bg-[#5c60c6] bg-[#fdfdfd] rounded-full flex items-center justify-center dark:text-white text-[#030811] cursor-pointer"
          role="button"
          tabIndex="0"
          onClick={toggleDropdown}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleDropdown();
          }}
        >
          <img src={user} alt="User" className="rounded-full"/>
        </div>
        <AnimatePresence>
  {isDropdownOpen && (
    <motion.div
      className="absolute right-0 mt-2 w-60 dark:bg-gray-900 bg-gray-100 rounded-md shadow-lg z-50 p-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Display User Info */}
      <div className="flex items-center space-x-3 mb-4">
    <img
      src={user}
      alt="Profile"
      className="w-12 h-12 rounded-full object-cover"
    />
  
  <div className="flex flex-col min-w-0">
    <p className="font-semibold text-sm dark:text-[#fdfdfd] text-[#030811] truncate">
      {auth?.user?.name || "Unknown User"}
    </p>
    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
      {auth?.user?.email}
    </p>
  </div>
</div>
 
      <hr className="mb-3" />
      {/* Dropdown Actions */}
      <button
        aria-label="Profile Settings"
        onClick={() => {
          navigate("/dashboard/settings");
          setIsDropdownOpen(false);
        }}
        className="group flex items-center space-x-2 px-4 py-2 w-full text-sm dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] dark:hover:text-white cursor-pointer hover:bg-[#5c60c6] hover:text-white"
        tabIndex="0"
      >
        {/* Profile Icon */}
        <Cog6ToothIcon className="w-5 h-5" />
        <span>Profile Settings</span>
      </button>
 
      <button
        aria-label="Logout"
        onClick={handleLogout}
        className="flex items-center space-x-2 px-4 py-2 w-full text-sm dark:text-[#fdfdfd] text-[#030811] dark:hover:bg-[#5c60c6] dark:hover:text-white cursor-pointer hover:bg-[#5c60c6] hover:text-white"
        tabIndex="0"
      >
        {/* Logout Icon */}
        <ArrowsRightLeftIcon className="h-5 w-5" />
        <span>Switch User</span>
      </button>
      <div className="mt-2 items-center justify-center px-4 py-2 w-full">
        <ThemeToggle />
      </div>
    </motion.div>
  )}
</AnimatePresence>
 
      </div>
    );
  };
 
  return (
 
    <header
    className={`fixed top-0 w-full z-50 ${
      isScrolled
        ? isDesktop
          ? "dark:bg-[#030811]/70 rounded-full bg-[#fdfdfd]/70 backdrop-blur-md"
          : "dark:bg-[#030811] bg-[#fdfdfd]"
        : "dark:bg-[#030811] bg-[#fdfdfd]"
    } transition-all duration-300`}
  >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex flex-1">
            <button
              onClick={() => navigate("/")}
              className="-m-1.5 p-1.5"
              aria-label="Navigate to home"
            >
              <img
                className="h-8 sm:h-10 w-auto hover:animate-pulse invert grayscale dark:invert-0"
                src={"https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"}
                alt="CXR Vision Logo"
              />
            </button>
          </div>
          {isDesktop ? (
            <div className="hidden lg:flex lg:gap-x-8 items-center text-[#030811] dark:text-[#fdfdfd]">
              <AnimatedTab onClick={() => navigate("/about")}>
               <span className="dark:text-[#fdfdfd] text-[#030811]">About</span>
              </AnimatedTab>
              <AnimatedTab onClick={() => navigate("/analysis/upload")}>
              <span className="dark:text-[#fdfdfd] text-[#030811]">X-ray Analysis</span>
              </AnimatedTab>
              {auth?.user && (
                <AnimatedTab onClick={() => navigate("/dashboard")}>
                 <span className="dark:text-[#fdfdfd] text-[#030811]">Dashboard</span>
                </AnimatedTab>
              )}
              {auth?.user ? (
                <AvatarDropdown />
              ) : (
                <AnimatedTab onClick={() => navigate("/login")}>
                    <span className="dark:text-[#fdfdfd] text-[#030811]">Log in</span>
                </AnimatedTab>
              )}
            </div>
          ) : (
            <button
              aria-label="Open main menu"
              type="button"
              onClick={toggleMenu}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-[#fdfdfd]"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          )}
        </nav>
 
        {/* Mobile Menu */}
        {isMenuOpen && !isDesktop && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-[#030811] px-4 sm:px-6 py-6 overflow-y-auto"
              role="dialog"
              tabIndex="0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsMenuOpen(false);
              }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    navigate("/");
                    setIsMenuOpen(false);
                  }}
                  className="-m-1.5 p-1.5"
                  aria-label="Navigate to home"
                >
                  <img
                    className="h-8 w-auto invert grayscale dark:invert-0"
                    src={"https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"}
                    alt="CXR Vision Logo"
                  />
                </button>
                <button
                  aria-label="Close menu"
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md p-2.5 text-[#fdfdfd]"
                >
                  <span className="sr-only">Close menu</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
 
              <div className="mt-6">
                {auth?.user ? (
                  <>
                    {/* User Info & Profile Options */}
                    <div className="flex items-center space-x-3 mb-4">
                      {auth?.profilePicture ? (
                        <img
                          src={auth.profilePicture}
                          alt="Profile"
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#5c60c6] rounded-full flex items-center justify-center text-white">
                          {auth?.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <p className="font-semibold text-sm text-[#fdfdfd]">
                          {auth.user.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {auth.user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2 mb-2 text-base font-semibold text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        navigate("/dashboard/settings");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2 mb-2 text-base font-semibold text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate("/analysis/upload");
                        setIsMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2 mb-2 text-base font-semibold text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white"
                    >
                      CXR Analysis
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-2 mb-2 text-base font-semibold text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white"
                    >
                      Switch User
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-4 py-2 mb-4 text-base font-semibold text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white"
                  >
                    Log in
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
 
  );
};
 
export default Header;