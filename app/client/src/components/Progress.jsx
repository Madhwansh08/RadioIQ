
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Progress = ({ currentStep, patientSlug, xraySlug, onNavigate }) => {
  const navigate = useNavigate();

  const pages = [
    // {name: 'Home', href: '/', current: currentStep === 'home', action: () => navigate('/')},
    { name: 'Upload', href: '/analysis/upload', current: currentStep === 'upload', action: () => onNavigate('/analysis/upload') },
    {
      name: 'Analysis',
      href: `/analysis/${patientSlug}/${xraySlug}`,
      current: currentStep === 'analysis',
      action: () => onNavigate(`/analysis/${patientSlug}/${xraySlug}`),
    },
    {
      name: 'Edit Page',
      href: `/analysis/${patientSlug}/${xraySlug}/edit`,
      current: currentStep === 'edit',
      action: () => onNavigate(`/analysis/${patientSlug}/${xraySlug}/edit`),
    },
    { name: 'Heatmap', href: '/analysis/${patientSlug}/${xraySlug}/heatmap', current: currentStep === 'heatmap', action: () => onNavigate(`/analysis/${patientSlug}/${xraySlug}/heatmap`) },
    { name: 'Quadrant', href: '/analysis/${patientSlug}/${xraySlug}/quadrant', current: currentStep === 'quadrant', action: () => onNavigate(`/analysis/${patientSlug}/${xraySlug}/quadrant`) },
    { name: 'Report', href: '/analysis/${patientSlug}/${xraySlug}/report', current: currentStep === 'report', action: () => onNavigate(`/analysis/${patientSlug}/${xraySlug}/report`) },
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className="dark:border-[#5c60c6] border-[#030811] dark:bg-[#030811] bg-[#fdfdfd] p-2 rounded-lg"
    >
      <ol
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-center"
      >
        {/* Home Button */}
        

        {/* Breadcrumb Steps */}
        {pages.map((page, index) => (
          <motion.li
            key={page.name}
            className="flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 24 44"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="h-full w-4 shrink-0 text-[#5c60c6]"
            >
              <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
            </svg>
            <button
              onClick={page.action}
              aria-current={page.current ? 'page' : undefined}
              className={`ml-2 text-sm font-medium ${
                page.current ? 'dark:text-[#fdfdfd] text-[#030811]' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {page.name}
            </button>
          </motion.li>
        ))}
      </ol>
    </nav>
  );
};

export default Progress;
