import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/admin-login" replace />;
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
