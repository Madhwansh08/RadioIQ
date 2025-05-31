import React from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import errimg from "../assets/Error.gif";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdfdfd] px-6 py-16 sm:py-24">
        <img src={errimg} alt="Error" className="w-64 sm:w-80 md:w-96" />
        <p className="mt-6 text-lg font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-md text-center">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:bg-indigo-500 transition-all"
          >
            Go back home
          </button>
       
        </div>
      </div>
    </>
  );
}
