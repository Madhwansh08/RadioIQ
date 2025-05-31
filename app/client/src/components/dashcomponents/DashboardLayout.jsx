import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  Cog6ToothIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import { FaUser } from "react-icons/fa";
import Logo from "../../assets/logo.png";
import { CiTimer , CiUser , CiEdit} from "react-icons/ci";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
  {name: 'X-rays Record' , path:"/dashboard/tables", icon: CiTimer},
  {name: "MetaData Extract" , path:"/dashboard/metadata", icon: CiEdit},
  { name: "Profile", path: "/dashboard/settings", icon: CiUser },
 
  
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <button
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        ></button>
        <div className="relative flex w-64 flex-col bg-[#030811] text-white">
          <button
            className="absolute top-4 right-4 text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center justify-center h-16 border-b border-gray-300 dark:border-gray-700">
            <button onClick={() => navigate('/')} className="h-8">
              <img src={"https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"} alt="Logo" className="h-8 invert dark:invert-0" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={() =>
                  classNames(
                    location.pathname === item.path
                      ? "bg-[#5c60c6] text-[#fdfdfd]"
                      : "text-gray-800 dark:text-gray-400 hover:bg-gray-500 dark:hover:bg-gray-600 hover:text-white",
                    "flex items-center gap-x-3 px-3 py-2 rounded-md"
                  )
                }
              >
                <item.icon className="h-6 w-6" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col dark:bg-[#030811] bg-[#fdfdfd] dark:text-white text-[#030811]">
        <div className="flex items-center justify-center h-16 border-b border-gray-300 dark:border-gray-700">
          <button onClick={() => navigate('/')} className="h-8 mr-5 pr-5">
            <img src={"https://radioiq.s3.ap-south-1.amazonaws.com/static/RadioIQ.png"} alt="Logo" className="h-8 invert grayscale dark:invert-0"/>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4 overflow-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={() =>
                classNames(
                  location.pathname === item.path
                    ? "bg-[#5c60c6] text-[#fdfdfd]"
                    : "text-black dark:text-[#fdfdfd] hover:bg-[#5c60c6] hover:text-white",
                  "flex items-center gap-x-3 px-3 py-2 rounded-md"
                )
              }
            >
              <item.icon className="h-6 w-6" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-10 shadow px-4 sm:px-6 lg:px-8 bg-black dark:bg-white">
          <button
            className="text-[#030811] lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-[#030811]" />
          </button>
        </header>
        {/* Main Section */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#000000] dark:bg-[#ffffff]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
