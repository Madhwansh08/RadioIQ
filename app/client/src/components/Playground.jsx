import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import backgroundData from '../assets/bglottie.json';

export default function Playground() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/playground');
  };

  return (
    <section className="relative animate-border  bg-gradient-to-b from-white to-gray-100 dark:from-[#0c0c1b] dark:to-[#030811] py-12 sm:py-20 lg:py-32 rounded-2xl shadow-md px-6 ">
    {/* Background Lottie Animation */}
    <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none -left-1/4 -right-1/4 w-[150%]">
    <Lottie
      animationData={backgroundData}
      loop
      autoplay
      className="w-full h-full lottie-spinner scale-[1.3]"
      style={{
        '--lottie-color': '#5c60c6',
        '--lottie-fill': '#5c60c6' 
      }}
    />
  </div>

    <div className="relative z-10 mx-auto max-w-7xl lg:flex lg:items-center lg:justify-between">
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-gray-900 dark:text-[#fdfdfd] sm:text-4xl md:text-5xl">
        <div className="flex flex-col items-center md:flex-row md:items-start">
         
          <div className="flex flex-col">
            <span className="text-3xl sm:text-5xl lg:text-6xl text-center md:text-left mt-2">
              Check out the Platform Before You Start
            </span>
          </div>
        </div>
      </h2>
      <div className="mt-8 flex items-center justify-center lg:mt-0 lg:shrink-0">
        <SpotlightButton onClick={handleClick}>Check Out</SpotlightButton>
      </div>
    </div>
  </section>
  );
}

function SpotlightButton({ children, onClick }) {
  const btnRef = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    const spotlight = spanRef.current;

    const handleMouseMove = (e) => {
      const { width, left } = btn.getBoundingClientRect();
      const x = e.clientX - left;
      const percent = (x / width) * 100;
      spotlight.animate(
        { left: `${percent}%` },
        { duration: 250, fill: 'forwards' }
      );
    };

    const handleMouseLeave = () => {
      spotlight.animate(
        { left: '50%' },
        { duration: 100, fill: 'forwards' }
      );
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.button
      onClick={onClick}
      ref={btnRef}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-full border border-[#5c60c6] bg-[#fdfdfd] px-8 py-3 md:px-20 md:py-5 text-base md:text-xl font-semibold text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:bg-black dark:text-[#fdfdfd]"
    >
      <span className="relative z-10 mix-blend-difference dark:mix-blend-normal">
        {children}
      </span>
      <span
        ref={spanRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20 backdrop-blur-xl dark:bg-[#5c60c6]/30"
      />
    </motion.button>
  );
}