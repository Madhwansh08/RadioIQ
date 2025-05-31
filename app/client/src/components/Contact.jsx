import React, { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import {
  motion,
  useDragControls,
  useMotionValue,
  useAnimate,
} from "framer-motion";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../utils/config";

export const Contact = ({drawerOpen, setDrawerOpen}) => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    comment: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Form validation
      if (!formData.name || !formData.email || !formData.comment) {
        toast.error("All fields are required");
        return;
      }
      if (!emailRegex.test(formData.email)) {
        toast.error("Invalid email format");
        return;
      }

      const response = await axios.post(
        `${config.API_URL}/api/contact/submit`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        toast.success("Feedback submitted successfully");
        setFormData({ name: "", email: "", comment: "" }); // Reset form
        setDrawerOpen(false); // Close drawer
        navigate("/");
      } else {
        toast.error(`Submission failed: ${response.statusText}`);
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Server error occurred");
      } else if (error.request) {
        toast.error("No response from server. Please try again later.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center dark:bg-[#fdfdfd] bg-[#030811] px-8 py-24 dark:text-[#030811] text-[#fdfdfd]">
      <BlockInTextCard
        tag="Contact Us"
        text={
          <>
            <strong>Have any query?</strong> We're here to help!
          </>
        }
        examples={[
          "Need help with Technical support",
          "Want to learn more about the services",
          "Feedback/Suggestion",
          "Need assistance with a purchase",
        ]}
        onContactClick={() => setDrawerOpen(true)}
      />
      <DragCloseDrawer open={drawerOpen} setOpen={setDrawerOpen}>
        <div className="mx-auto max-w-2xl space-y-6 text-[#fdfdfd] items-center flex flex-col">
          <h2 className="text-4xl font-bold text-center text-[#fdfdfd]">
            Fill up the Details
          </h2>

          <form
            className="w-full max-w-md  p-6 rounded-lg shadow-lg space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col">
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-[#fdfdfd]"
              >
                Your Name
              </label>
              <input
                type="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-[#030811] border border-[#fdfdfd] text-[#fdfdfd] text-sm rounded-lg focus:ring-[#5c60c6] focus:border-[#5c60c6] block w-full p-3 placeholder-gray-400"
                placeholder="Enter your name"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-[#fdfdfd]"
              >
                Your email
              </label>
              <input
                type="text"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[#030811] border border-[#fdfdfd] text-[#fdfdfd] text-sm rounded-lg focus:ring-[#5c60c6] focus:border-[#5c60c6] block w-full p-3 placeholder-gray-400"
                placeholder="Enter your email"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="comment"
                className="block mb-2 text-sm font-medium text-[#fdfdfd]"
              >
                Your message
              </label>
              <textarea
                id="comment"
                rows="4"
                value={formData.comment}
                onChange={handleInputChange}
                className="block p-3 w-full text-sm text-[#fdfdfd] bg-[#030811] rounded-lg border border-[#fdfdfd] focus:ring-[#5c60c6] focus:border-[#5c60c6] placeholder-gray-400"
                placeholder="Leave a comment..."
              ></textarea>
            </div>

            <button
              type="submit"
              data-testid="submit-button"
              className="w-full py-3 px-5 text-base font-medium text-[#fdfdfd] bg-[#5c60c6] rounded-lg hover:bg-[#6d70e3] focus:outline-none focus:ring-4 focus:ring-[#5c60c6] hover:text-white transition-all duration-300"
            >
              Submit
            </button>
          </form>
        </div>
      </DragCloseDrawer>
    </div>
  );
};

const BlockInTextCard = ({ tag, text, examples, onContactClick }) => {
  return (
    <div className="w-full max-w-xl space-y-6">
      <div>
        <p className="mb-1.5 text-2xl font-bold uppercase">{tag}</p>
        <hr className="dark:border-[#030811] border-[#fdfdfd]" />
      </div>
      <p className="max-w-lg text-xl leading-relaxed">{text}</p>
      <div>
        <Typewrite examples={examples} />
        <hr className="border-neutral-300" />
      </div>
      <button
        onClick={onContactClick}
        className="w-full rounded-full border dark:border-[#030811] border-[#fdfdfd] py-2 text-sm font-medium transition-colors hover:bg-[#030811] hover:text-[#fdfdfd]"
      >
        Contact Support
      </button>
    </div>
  );
};

const LETTER_DELAY = 0.025;
const BOX_FADE_DURATION = 0.125;

const FADE_DELAY = 5;
const MAIN_FADE_DURATION = 0.25;

const SWAP_DELAY_IN_MS = 5500;

const Typewrite = ({ examples }) => {
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setExampleIndex((pv) => (pv + 1) % examples.length);
    }, SWAP_DELAY_IN_MS);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <p className="mb-2.5 text-sm font-light uppercase">
      <span className="inline-block size-2 dark:bg-[#030811] bg-[#fdfdfd]" />
      <span className="ml-3">
        EXAMPLE:{" "}
        {examples[exampleIndex].split("").map((l, i) => (
          <motion.span
            initial={{
              opacity: 1,
            }}
            animate={{
              opacity: 0,
            }}
            transition={{
              delay: FADE_DELAY,
              duration: MAIN_FADE_DURATION,
              ease: "easeInOut",
            }}
            key={`${exampleIndex}-${i}`}
            className="relative"
          >
            <motion.span
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: i * LETTER_DELAY,
                duration: 0,
              }}
            >
              {l}
            </motion.span>
            <motion.span
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                delay: i * LETTER_DELAY,
                times: [0, 0.1, 1],
                duration: BOX_FADE_DURATION,
                ease: "easeInOut",
              }}
              className="absolute bottom-[3px] left-[1px] right-0 top-[3px] dark:bg-[#030811] bg-[#fdfdfd]"
            />
          </motion.span>
        ))}
      </span>
    </p>
  );
};

const DragCloseDrawer = ({ open, setOpen, children }) => {
  const [scope, animate] = useAnimate();
  const [drawerRef, { height }] = useMeasure();
  const y = useMotionValue(0);
  const controls = useDragControls();

  const handleClose = async () => {
    animate(scope.current, { opacity: [1, 0] });
    const yStart = typeof y.get() === "number" ? y.get() : 0;
    animate("#drawer", { y: [yStart, height] });
    setOpen(false);
  };

  return (
    <>
      {open && (
        <motion.div
          ref={scope}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 dark:bg-[#030811]/70 bg-[#fdfdfd]/70"
        >
          <motion.div
            id="drawer"
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ ease: "easeInOut" }}
            className="absolute bottom-0 h-[75vh] w-full overflow-hidden rounded-t-3xl bg-[#030811]"
            style={{ y }}
            drag="y"
            dragControls={controls}
            onDragEnd={() => {
              if (y.get() >= 100) {
                handleClose();
              }
            }}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
          >
            <div className="absolute left-0 right-0 top-0 z-10 flex justify-center bg-[#030811] p-4">
              <button
                onPointerDown={(e) => controls.start(e)}
                className="h-2 w-16 cursor-grab touch-none rounded-full bg-[#fdfdfd] hover:bg-[#5c60c6] active:cursor-grabbing"
              />
            </div>
            <div className="relative z-0 h-full overflow-y-scroll p-4 pt-12">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Contact;