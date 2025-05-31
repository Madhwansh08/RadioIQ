import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredModal({ message, onClose }) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="bg-slate-900/20 backdrop-blur p-8 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer"
      >
        <motion.div
          initial={{ scale: 0, rotate: '12.5deg' }}
          animate={{ scale: 1, rotate: '0deg' }}
          exit={{ scale: 0, rotate: '0deg' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-[#1b1c3a] to-[#030811] text-white p-6 rounded-lg w-full max-w-lg shadow-xl cursor-default relative overflow-hidden"
        >
         
          <div className="relative z-10 text-center">
            <div className="bg-white w-16 h-16 mb-4 rounded-full text-3xl text-[#5c60c6] grid place-items-center mx-auto">
              <FiAlertCircle />
            </div>
            <h3 className="text-3xl font-bold mb-2">Session Expired</h3>
            <p className="mb-6">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="bg-transparent hover:bg-white/10 transition-colors text-white font-semibold w-full py-2 rounded"
              >
                Close
              </button>
              <button
                onClick={handleLogin}
                className="bg-white hover:opacity-90 transition-opacity text-[#5c60c6] font-semibold w-full py-2 rounded"
              >
                Go to Login
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
