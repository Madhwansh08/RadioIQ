import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Features = () => {
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: 1,
      title: "Abnormalities Detection",
      description:
        "Identify and highlight 50 potential abnormalities in medical images using advanced AI algorithms for faster diagnostics.",
      icon: (
        <svg
          className="flex-shrink-0 w-7 h-7 text-[#5c60c6]"
          xmlns="http://www.w3.org/2000/svg"
          fill="#5c60c6"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9.145 18.29c-5.042 0-9.145-4.102-9.145-9.145s4.103-9.145 9.145-9.145 9.145 4.103 9.145 9.145-4.102 9.145-9.145 9.145zm0-15.167c-3.321 0-6.022 2.702-6.022 6.022s2.702 6.022 6.022 6.022 6.023-2.702 6.023-6.022-2.702-6.022-6.023-6.022zm9.263 12.443c-.817 1.176-1.852 2.188-3.046 2.981l5.452 5.453 3.014-3.013-5.42-5.421z" />
        </svg>
      ),
      image:
        "https://res.cloudinary.com/dkaa6ubzd/image/upload/v1734339152/assetsRV/yqmormklalkuoag8ovmu.png",
    },
    {
      id: 2,
      title: "Doctor Editing Interface",
      description:
        "A dedicated interface for doctors to add, modify, or delete annotations, ensuring accurate and personalized reports.",
      icon: (
        <svg
          className="flex-shrink-0 w-9 h-9 text-[#5c60c6]"
          xmlns="http://www.w3.org/2000/svg"
          fill="#5c60c6"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            d="m11.239 15.533c-1.045 3.004-1.238 3.451-1.238 3.84 0 .441.385.627.627.627.272 0 1.108-.301 3.829-1.249zm.888-.888 3.22 3.22 6.408-6.401c.163-.163.245-.376.245-.591 0-.213-.082-.427-.245-.591-.58-.579-1.458-1.457-2.039-2.036-.163-.163-.377-.245-.591-.245-.213 0-.428.082-.592.245zm-3.127-.895c0-.402-.356-.75-.75-.75-2.561 0-2.939 0-5.5 0-.394 0-.75.348-.75.75s.356.75.75.75h5.5c.394 0 .75-.348.75-.75zm5-3c0-.402-.356-.75-.75-.75-2.561 0-7.939 0-10.5 0-.394 0-.75.348-.75.75s.356.75.75.75h10.5c.394 0 .75-.348.75-.75zm0-3c0-.402-.356-.75-.75-.75-2.561 0-7.939 0-10.5 0-.394 0-.75.348-.75.75s.356.75.75.75h10.5c.394 0 .75-.348.75-.75zm0-3c0-.402-.356-.75-.75-.75-2.561 0-7.939 0-10.5 0-.394 0-.75.348-.75.75s.356.75.75.75h10.5c.394 0 .75-.348.75-.75z"
            fillRule="nonzero"
          />
        </svg>
      ),
      image:
        "https://res.cloudinary.com/dkaa6ubzd/image/upload/v1734339149/assetsRV/h2pswmx8puhxx8b7t0ql.png",
    },
    {
      id: 3,
      title: "Analyze Button",
      description:
        "Select specific image regions for enhanced analysis with detailed explanations of findings.",
      icon: (
        <svg
          className="flex-shrink-0 w-9 h-9 text-[#5c60c6]"
          xmlns="http://www.w3.org/2000/svg"
          fill="#5c60c6"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21.169 19.754c.522-.79.831-1.735.831-2.754 0-2.761-2.238-5-5-5s-5 2.239-5 5 2.238 5 5 5c1.019 0 1.964-.309 2.755-.832l2.831 2.832 1.414-1.414-2.831-2.832zm-4.169.246c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3zm-4.89 2h-7.11l2.599-3h2.696c.345 1.152.976 2.18 1.815 3zm-2.11-5h-10v-17h22v12.11c-.574-.586-1.251-1.068-2-1.425v-8.685h-18v13h8.295c-.19.634-.295 1.305-.295 2zm-4-4h-2v-6h2v6zm3 0h-2v-9h2v9zm3 0h-2v-4h2v4z" />
        </svg>
      ),
      image:
        "https://res.cloudinary.com/dh0kdktqr/image/upload/v1734667033/features_ie2nyc.png",
    },
    {
      id: 4,
      title: "Heatmap Generation",
      description:
        "Visualize critical areas of interest with color-coded heatmaps for enhanced diagnostics.",
      icon: (
        <svg
          className="flex-shrink-0 w-9 h-9 text-[#5c60c6]"
          xmlns="http://www.w3.org/2000/svg"
          fill="#5c60c6"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 0c-3.148 0-6 2.553-6 5.702 0 4.682 4.783 5.177 6 12.298 1.217-7.121 6-7.616 6-12.298 0-3.149-2.851-5.702-6-5.702zm0 8c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12 16l-6.707-2.427-5.293 2.427-5.581-2.427-6.419 2.427 4-9 3.96-1.584c.38.516.741 1.08 1.061 1.729l-3.523 1.41-1.725 3.88 2.672-1.01 1.506-2.687-.635 3.044 4.189 1.789.495-2.021.465 2.024 4.15-1.89-.618-3.033 1.572 2.896 2.732.989-1.739-3.978-3.581-1.415c.319-.65.681-1.215 1.062-1.731l4.021 1.588 3.936 9z" />
        </svg>
      ),
      image:
        "https://res.cloudinary.com/dkaa6ubzd/image/upload/v1734339147/assetsRV/ghxe1rpimutanyvjx8xz.png",
    },
  ];

  // Handle feature toggle
  const toggleFeature = (id) => {
    setActiveFeature(activeFeature === id ? null : id);
  };

  return (
    <section className="py-10 dark:bg-[#fdfdfd] bg-[#030811] sm:py-16 lg:py-24">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-start">
        <div className="lg:mr-16 lg:w-1/2 w-full">
          <h2 className="text-left text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight dark:text-[#030811] text-[#fdfdfd] mb-6 sm:mb-10">
            Features
          </h2>
          <div className="space-y-6 sm:space-y-8 lg:space-y-12">
            {features.map((feature) => (
              <div key={feature.id} className="group">
                <div
                  className="flex items-center cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveFeature(activeFeature === feature.id ? null : feature.id);
                    }
                  }}
                >
                  <span className="flex-shrink-0">
                    {React.cloneElement(feature.icon, {
                      className: `${feature.icon.props.className} w-6 h-6 sm:w-7 sm:h-7`
                    })}
                  </span>
                  <h3 className="ml-4 sm:ml-5 text-lg sm:text-2xl font-semibold dark:text-[#030811] text-[#fdfdfd]">
                    {feature.title}
                  </h3>
                  {/* Toggle Icon - Keep this section */}
                  <svg
                    className={`ml-auto w-5 h-5 sm:w-6 sm:h-6 transition-transform dark:text-[#030811] text-[#fdfdfd] ${
                      activeFeature === feature.id ? "rotate-180" : "rotate-0"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <AnimatePresence>
                  {activeFeature === feature.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 sm:mt-3 ml-10 sm:ml-14 text-base sm:text-lg dark:text-gray-600 text-gray-200"
                    >
                      {feature.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Image Container - Hidden on mobile */}
        <div className="hidden lg:block lg:w-1/3 mt-12 lg:mt-0 lg:ml-12 relative">
          <AnimatePresence>
            {features.map((feature, index) => (
              <motion.img
                key={feature.id}
                src={feature.image}
                alt={feature.title}
                className="absolute w-full rounded-lg shadow-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: activeFeature === feature.id ? 1 : 0.5,
                  scale: activeFeature === feature.id ? 1 : 0.8,
                }}
                transition={{ duration: 0.5 }}
                style={{
                  top: `${index * 10}px`,
                  left: `${index * 10}px`,
                  zIndex: activeFeature === feature.id ? 10 : 1,
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Features;