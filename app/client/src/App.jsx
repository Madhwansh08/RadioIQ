import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./screens/Home";
import MetaData from "./components/dashcomponents/MetaData";
import About from "./screens/About";
import Analysis from "./screens/Analysis";
import { Provider } from 'react-redux'
import {store , persistor} from "./redux/store";
import Login from "./screens/auth/Login";
import Register from "./screens/auth/Register";
import Error from "./screens/Error";
import Upload from "./screens/Upload";
import { ToastContainer , Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./routes/Private";
import Dashboard from "./screens/Dashboard";
import Forgot from "./screens/auth/Forgot";
import DashboardLayout from "./components/dashcomponents/DashboardLayout";
import Settings from "./components/dashcomponents/Settings";
import AnalysisEdit from "./screens/AnalysisEdit";
import Quadrant from "./screens/Quadrant";
import Heatmap from "./screens/Heatmap";
import Report from "./screens/Report";
import Tables from "./components/dashcomponents/Tables";
import Verify from "./screens/auth/Verify";
// import PlaygroundUpload from "./screens/playground/PlaygroundUpload";
import AlreadyVerifiedRoute from "./routes/AlreadyVerifiedRoute";
import VerifiedRoute from "./routes/Verified";
import PublicRoute from "./routes/Public";
import { initSse } from "./redux/slices/sseSlice";
import {PersistGate} from "redux-persist/integration/react";
// import PlaygroundAnalysis from "./screens/playground/PlaygroundAnalysis";


store.dispatch(initSse());

function App() {
  return (

    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div>
          <ToastContainer
  position="bottom-right"
  autoClose={2500}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  draggable
  pauseOnFocusLoss
  transition={Zoom}
  transitionDuration={{ enter: 300, exit: 200 }}

/>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              {/* <Route path="/playground" element={<PlaygroundUpload />} />
              <Route path="/playground/playground-analysis" element={<PlaygroundAnalysis/>} /> */}


              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot" element={<Forgot />} />
              </Route>


              {/* Dashboard route with PrivateRoute */}
              <Route element={<PrivateRoute />}>
              <Route element={<VerifiedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="tables" element={<Tables />} />
                  <Route path="metadata" element={<MetaData />} />
                </Route>
                </Route>
              </Route>



              {/* Analysis routes with PrivateRoute */}
              <Route element={<PrivateRoute />}>
                <Route element={<VerifiedRoute />}>
                  <Route
                    path="/analysis/:patientSlug/:xraySlug"
                    element={<Analysis />}
                  />
                </Route>
              </Route>
              <Route
                path="/analysis/:patientSlug/:xraySlug/heatmap"
                element={<PrivateRoute />}
              >
                <Route index element={<Heatmap />} />
              </Route>


              <Route
                path="/analysis/:patientSlug/:xraySlug/quadrant"
                element={<PrivateRoute />}
              >
                <Route index element={<Quadrant />} />
              </Route>


              <Route
                path="/analysis/:patientSlug/:xraySlug/edit"
                element={<PrivateRoute />}
              >
                <Route index element={<AnalysisEdit />} />
              </Route>




              <Route element={<PrivateRoute />}>
                <Route element={<AlreadyVerifiedRoute />}>
                  <Route path="/verify" element={<Verify />} />
                </Route>
              </Route>



              <Route
                path="/analysis/:patientSlug/:xraySlug/report"
                element={<PrivateRoute />}
              >
                <Route index element={<Report />} />
              </Route>

              <Route path="/analysis/upload" element={<PrivateRoute />}>
                <Route index element={<Upload />} />
              </Route>

              {/* Catch-all error route */}
              <Route path="*" element={<Error />} />
            </Routes>
          </div>
        </Router>
    </PersistGate>
    </Provider>

  );
}

export default App;
