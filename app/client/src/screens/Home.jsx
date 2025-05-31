import React, { useRef, useEffect, lazy, Suspense, useState, useCallback } from "react";
import throttle from "lodash.throttle";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
// import Playground from "../components/Playground";
import Contact from "../components/Contact";
import AOS from "aos";
import "aos/dist/aos.css";
import SessionExpiredModal from "../components/SessionModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile , clearUser } from "../redux/slices/authSlice";

const Content = lazy(() => import("../components/Content"));
const Research = lazy(() => import("../components/Research"));
const DemoComponent = lazy(() => import("../components/DemoComponent"));
const ShuffleHero = lazy(() => import("../components/ShuffleHero"));

const Home = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const featuresRef = useRef(null);
  const contactRef = useRef(null);
  const demoRef = useRef(null);
  const progressRef = useRef(null);
  const dispatch=useDispatch()
  const user=useSelector((state)=>state.auth.user)
  const [showExpired, setShowExpired] = useState(false)
  const didValidate = useRef(false)


    // Initial session validation (runs once)
    useEffect(() => {
      if (!user || didValidate.current) return;
      didValidate.current = true;
  
      dispatch(fetchUserProfile())
        .unwrap()
        .catch(() => {
          setShowExpired(true);
          dispatch(clearUser());
        });
    }, [dispatch, user]);
  
    // Periodic session validation (every minute)
    useEffect(() => {
      if (!user) return;
  
      const intervalId = setInterval(() => {
        dispatch(fetchUserProfile())
          .unwrap()
          .catch(() => {
            setShowExpired(true);
            dispatch(clearUser());
          });
      }, 60 * 1000); // check every 60 seconds
  
      return () => clearInterval(intervalId);
    }, [dispatch, user]);
  
    const handleClose = () => {
      setShowExpired(false);
      // Optional: navigate('/login');
    };
  // Scroll progress animation handler
  useEffect(() => {
    const handleScrollProgress = () => {
      requestAnimationFrame(() => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - 
          document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        if (progressRef.current) {
          progressRef.current.style.width = `${scrolled}%`;
        }
      });
    };

    window.addEventListener('scroll', handleScrollProgress);
    return () => window.removeEventListener('scroll', handleScrollProgress);
  }, []);

  // Show/hide scroll to top button
  useEffect(() => {
    const checkScroll = throttle(() => {
      setShowScrollButton(window.scrollY > 200);
    }, 200);

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  // Scroll handlers
  const scrollToTop = useCallback(
    throttle(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1000),
    []
  );

  const scrollToFeatures = useCallback(
    throttle(() => {
      featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1000),
    []
  );

  const scrollToDemo = useCallback(
    throttle(() => {
      demoRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1000),
    []
  );

  // Scroll position tracker
  const handleScroll = useCallback(
    throttle(() => {
      setScrollPosition(window.pageYOffset);
    }, 200),
    []
  );

  // Window resize handler
  const handleResize = useCallback(
    throttle(() => {
      AOS.refresh();
    }, 200),
    []
  );

  useEffect(() => {
    AOS.init({ duration: 600, easing: "ease-in-out", once: true });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      handleScroll.cancel();
      handleResize.cancel();
    };
  }, [handleScroll, handleResize]);

  return (
    
    <div className="dark:bg-[#030811] bg-[#fdfdfd] w-full">
       {showExpired && (
        <SessionExpiredModal
          message="Your session has expired. Please log in again."
          onClose={handleClose}
        />
      )}
      <Header scrollPosition={scrollPosition} />

      {/* Smooth Progress Bar */}
      <div
        ref={progressRef}
        className="fixed top-0 left-0 h-1 bg-[#5C60C6] z-50 transition-all duration-75 ease-out"
        style={{ transformOrigin: 'left center' }}
      />

      {/* Back to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-4 bg-[#5C60C6] rounded-full shadow-lg transition-all duration-300 hover:bg-[#4e52b5] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#5C60C6] focus:ring-opacity-50"
          aria-label="Back to top"
        >
          <svg
            className="w-6 h-6 text-[#fdfdfd]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-b dark:from-[#030811] dark:via-[#05030c] dark:to-[#0c0c1b] from-[#ffffff] via-[#ffffff] to-[#ffffff] z-20 ">
      <section className="py-10 sm:py-16 lg:py-24" data-aos="fade-up">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-12 py-10 mt-10 lg:grid-cols-2">
            {/* Text Content */}
            <div className="order-1 lg:order-none text-center lg:text-left">
              <h1 className="text-4xl  font-bold dark:text-[#fdfdfd] text-[#030811] sm:text-6xl lg:text-7xl">
                Empower Predict Prevent, with
                <div className="relative inline-block mt-2">
                  <span className="absolute inset-x-0 bottom-0 border-b-[12px] dark:border-[#030811] border-[#fafbfd]" />
                  <span className="relative  text-4xl font-bold text-[#5C60C6] sm:text-6xl lg:text-7xl ">
                    {"RadioIQ.".split("").map((char, idx) => (
                      <span className="hover-effect" key={`${char}-${idx}`}>
                        {char}
                      </span>
                    ))}
                  </span>
                </div>
              </h1>
              <p className="mt-8 text-base dark:text-[#fdfdfd] text-[#030811] sm:text-xl lg:pr-12">
                AI-driven tools to help healthcare professionals analyze, annotate,
                and report medical images with precision.
              </p>
              
              {/* Buttons Container */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8">
                <button
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-[#fdfdfd] bg-[#5C60C6] rounded-full shadow-lg transition-all duration-200 hover:bg-[#4e52b5] focus:bg-[#4e52b5]"
                  style={{ boxShadow: "0px 4px 10px rgba(92, 96, 198, 0.4)" }}
                >
                  Start exploring
                </button>
                <button
                  onClick={scrollToDemo}
                  className="w-full sm:w-auto flex items-center justify-center text-base font-semibold dark:text-[#fdfdfd] text-[#5c60c6] transition-all duration-200 hover:opacity-80"
                >
                  <svg
                    className="w-10 h-10 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      fill="#5C60C6"
                      stroke="#5C60C6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Image Section - Hidden on mobile and iPad mini */}
            <div className="order-2 lg:order-none hidden lg:block">
              <Suspense fallback={<div className="h-96 w-full bg-gray-200 animate-pulse" />}>
                <ShuffleHero />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Numbers Section */}
      <section
        ref={ref}
        className="py-10 mt-8 dark:bg-[#030811] bg-[#f8f7f7] sm:py-16 lg:py-24"
        data-aos="fade-up"
      >
        <div className="max-w-5xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold whitespace-nowrap leading-tight dark:text-[#fdfdfd] text-[#030811] sm:text-4xl lg:text-6xl">
              Our results in numbers
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-10 text-center sm:grid-cols-2 md:grid-cols-3">
            <div>
              <h3 className="font-bold text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r dark:from-[#fdfdfd] dark:to-[#fdfdfd] from-[#030811] to-[#030811]">
                {inView && <CountUp start={0} end={90} duration={2.5} suffix="%" />}
              </h3>
              <p className="mt-4 text-lg sm:text-xl font-medium dark:text-[#fdfdfd] text-[#030811]">
                Sensitivity
              </p>
            </div>
            <div>
              <h3 className="font-bold text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r dark:from-[#fdfdfd] dark:to-[#fdfdfd] from-[#030811] to-[#030811]">
                {inView && <CountUp start={0} end={85} duration={3} suffix="%" />}
              </h3>
              <p className="mt-4 text-lg sm:text-xl font-medium dark:text-[#fdfdfd] text-[#030811]">
                Specificity
              </p>
            </div>
            <div>
              <h3 className="font-bold text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r dark:from-[#fdfdfd] dark:to-[#fdfdfd] from-[#030811] to-[#030811]">
                {inView && (
                  <CountUp
                    start={0}
                    end={100}
                    duration={1.5}
                    separator=","
                    suffix="k+"
                  />
                )}
              </h3>
              <p className="mt-4 text-lg sm:text-xl font-medium dark:text-[#fdfdfd] text-[#030811]">
                Datasets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <Suspense fallback={<div className="h-96 w-full bg-gray-200 animate-pulse" />}>
        <Content />
      </Suspense>

      <section ref={featuresRef} data-aos="fade-up">
        <Features />
      </section>

      <section ref={demoRef} data-aos="fade-up">
        <Suspense fallback={<div className="h-96 w-full bg-gray-200 animate-pulse" />}>
          <DemoComponent />
        </Suspense>
      </section>

      <section data-aos="fade-up">
        <Suspense fallback={<div className="h-96 w-full bg-gray-200 animate-pulse" />}>
          <Research />
        </Suspense>
      </section>



      <section ref={contactRef} data-aos="fade-up">
        <Testimonials />
      </section>

      {/* Playground Section */}
      {/* <section data-aos="fade-up" className="my-2" >
        <Playground />
      </section> */}

      {/* Contact and Footer */}
      <section className="my-2" data-aos="fade-up">
      <Contact drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}/>
      </section>

      <Footer scrollToFeatures={scrollToFeatures} setDrawerOpen={setDrawerOpen}/>
    </div>
  );
};

export default Home;