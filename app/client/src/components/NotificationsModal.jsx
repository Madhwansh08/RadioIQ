import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaBell, FaTimes, FaCheckCircle, FaExclamationCircle , FaTrash} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { removeNotification , clearNotifications } from "../redux/slices/notificationSlice";

const NotificationItem = ({ notification }) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const dispatch = useDispatch();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="relative mb-2 rounded-lg overflow-hidden dark:bg-[#0d1021] dark:hover:bg-[#161a33] bg-[#fdfdfd] hover:bg-[#eaeaea] "
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsSwiping(true)}
      onDragEnd={(e, info) => {
        setIsSwiping(false);
        if (Math.abs(info.offset.x) > 100) {
          dispatch(removeNotification(notification.id));
        }
      }}
    >
      <div className="flex items-start gap-3 p-3 relative z-10">
        <div className="pt-1">
          {notification.type === "success" ? (
            <FaCheckCircle className="text-green-400" />
          ) : (
            <FaExclamationCircle className="text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="dark:text-[#fdfdfd] text-[#030811]">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useSelector((state) => state.notification.notifications);
  const dispatch = useDispatch();

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };


  return (
    <>
      <motion.button
        className="fixed bottom-8 left-8 p-4 bg-[#5c60c6] text-[#fdfdfd] rounded-full shadow-lg hover:bg-[#4a4eac] transition-colors z-50"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaBell size={24} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 dark:bg-black/50 bg-[#fdfdfd]/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-8 w-96 dark:bg-[#030811] bg-[#fdfdfd] rounded-xl shadow-xl z-50 border border-[#231b6e] overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold dark:text-[#fdfdfd] text-[#030811]">
                    Notifications ({notifications.length})
                  </h3>
                  {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAll}
                        className="ml-20 pl-10 text-red-400 hover:text-red-300 transition-colors"
                        title="Clear all notifications"
                      >
                        <FaTrash />
                      </button>
                    )}
                  <button onClick={() => setIsOpen(false)}>
                    <FaTimes className="text-[#fdfdfd] hover:text-[#5c60c6]" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
                  <div className="[&::-webkit-scrollbar]:hidden pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">
                        No notifications yet
                      </p>
                    ) : (
                      <AnimatePresence initial={false}>
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationsModal;