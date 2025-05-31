import React, { useState, useEffect } from "react";
import Metrics from "../components/dashcomponents/Metrics";
import ChartOne from "../components/dashcomponents/ChartOne";
import ChartTwo from "../components/dashcomponents/ChartTwo";
import ChartThree from "../components/dashcomponents/ChartThree";
import ChartFour from "../components/dashcomponents/ChartFour";
import ChartFive from "../components/dashcomponents/ChartFive";
import ChartSix from "../components/dashcomponents/ChartSix";
import ChartSeven from "../components/dashcomponents/ChartSeven";
import ChartEight from "../components/dashcomponents/ChartEight"; // New chart component
import axios from "axios";
import { useSelector } from "react-redux";
import config from "../utils/config";

const Dashboard = () => {
  const [patientCount, setPatientCount] = useState(0);
  const [xrayCount, setXrayCount] = useState(0);
  const [commonAbnormalities, setCommonAbnormalities] = useState([]);
  const [xrayByDays, setXrayByDays] = useState([]); 
  const [abnormalityGenderCount, setAbnormalityGenderCount] = useState([]);
  const [abnoramlityAgeCount, setAbnormalityAgeCount] = useState([]);
  const [abnormalityLocationCount, setAbnormalityLocationCount] = useState([]);
  const [normalAbnormalCount, setNormalAbnormalCount] = useState([]);
  const [tbCategories, setTbCategories] = useState({
    low: 0,
    medium: 0,
    high: 0,
  });

  const auth = useSelector((state) => state.auth);

  // Toggle state for displaying ChartFive or ChartEight
  const [showChartFive, setShowChartFive] = useState(true);
  const [heatmapLink , setHeatmapLink] = useState("");

  // Fetch all patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/patients/get/AllPatients`,
          {
            withCredentials: true,
          }
        );
        setPatientCount(response.data.length);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, [auth.token]);

  useEffect(() => {
    const fetchXrays = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/AllXrays`,
          {
            withCredentials: true,
          }
        );
        setXrayCount(response.data.length);
      } catch (error) {
        console.error("Error fetching Xrays", error);
      }
    };
    fetchXrays();
  }, [auth.token]);

  useEffect(() => {
    const fetchCommonAbnormalities = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/CommonAbnormalities`,
          {
            withCredentials: true,
          }
        );
        setCommonAbnormalities(response.data.topAbnormalities);
      } catch (error) {
        console.error("Error fetching common abnormalities:", error);
      }
    };
    fetchCommonAbnormalities();
  }, [auth.token]);

  useEffect(() => {
    const fetchXrayByDays = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/XrayDay`,
          {
            withCredentials: true,
          }
        );
        setXrayByDays(response.data.formattedXrays);
      } catch (error) {
        console.error("Error fetching X-rays by days:", error);
      }
    };
    fetchXrayByDays();
  }, [auth.token]);

  useEffect(() => {
    const fetchAbnormalityGenderCount = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/AbnormalityByGender`,
          {
            withCredentials: true,
          }
        );
        if (response?.data?.abnormalityByGender) {
          setAbnormalityGenderCount(response.data.abnormalityByGender);
        } else {
          console.error("No abnormalityByGender data found");
        }
      } catch (error) {
        console.error("Error fetching abnormality by gender count:", error);
      }
    };
    fetchAbnormalityGenderCount();
  }, [auth.token]);

  useEffect(() => {
    const fetchAbnormalityAgeCount = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/AbnormalityByAge`,
          {
            withCredentials: true,
          }
        );
        if (response.data?.abnormalityByAge) {
          setAbnormalityAgeCount(response.data.abnormalityByAge);
        } else {
          console.error("No abnormalityByAge data found");
        }
      } catch (error) {
        console.error("Error fetching abnormality by age count:", error);
      }
    };
    fetchAbnormalityAgeCount();
  }, [auth.token]);

  useEffect(() => {
    const fetchAbnormalityLocationCount = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/AbnormalityByLocation`,
          {
            withCredentials: true,
          }
        );
        if (response.data?.abnormalityByLocation) {
          setAbnormalityLocationCount(response.data.abnormalityByLocation);
        } else {
          console.error("No abnormalityByLocation data found");
        }
      } catch (error) {
        console.error("Error fetching abnormality by location count:", error);
      }
    };
    fetchAbnormalityLocationCount();
  }, [auth.token]);

  useEffect(() => {
    const fetchNormalAbnormalCount = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/NormalAbnormalXrays`,
          {
            withCredentials: true,
          }
        );
        if (response.data?.xrayStatsByDays) {
          setNormalAbnormalCount(response.data.xrayStatsByDays);
        }
      } catch (error) {
        console.error("Error fetching normal & abnormal X-ray count:", error);
      }
    };
    fetchNormalAbnormalCount();
  }, [auth.token]);

  const totalNormalXrays = normalAbnormalCount.reduce(
    (sum, day) => sum + day.normalCount,
    0
  );
  const totalAbnormalXrays = normalAbnormalCount.reduce(
    (sum, day) => sum + day.abnormalCount,
    0
  );

  useEffect(() => {
    const fetchTbScores = async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/xrays/get/AllXraysObjects`,
          {
            withCredentials: true,
          }
        );
        const xrays = response.data.xrays;
        let low = 0,
          medium = 0,
          high = 0;
        xrays.forEach((xray) => {
          const tbScore = (xray.tbScore * 100).toFixed(2);
          if (tbScore < 30) {
            low++;
          } else if (tbScore >= 30 && tbScore < 70) {
            medium++;
          } else {
            high++;
          }
        });
        setTbCategories({ low, medium, high });
      } catch (error) {
        console.error("Error fetching TB scores:", error);
      }
    };
    fetchTbScores();
  }, [auth.token]);


  useEffect(() => {
    if (!showChartFive) {
      // Only call the API if we haven't fetched it yet (optional check)
      if (!heatmapLink) {
        axios
          .get(`${config.API_URL}/api/xrays/get/heatmap`, {
            withCredentials: true,
          })
          .then((res) => {
            if (res.data?.heatmapLink) {
              setHeatmapLink(res.data.heatmapLink);
            }
          })
          .catch((err) => {
            console.error("Error fetching heatmap link:", err);
          });
      }
    }
  }, [showChartFive, heatmapLink, auth.token]);




  return (
    <div>
      <Metrics
        patientCount={patientCount}
        xrayCount={xrayCount}
        normalCount={totalNormalXrays}
        abnormalCount={totalAbnormalXrays}
      />
      <div className="flex flex-wrap gap-6 p-6 bg-gray-950 dark:bg-gray-50">
        <div className="w-full mr-10 shadow-[#030811] drop-shadow-sm lg:w-8/12">
          <ChartOne xrayByDays={xrayByDays} />
        </div>
        <div className="ml-12 w-full shadow-[#030811] drop-shadow-sm lg:w-3/12">
          <ChartTwo commonAbnormalities={commonAbnormalities} />
        </div>
      </div>

      <ChartSix data={normalAbnormalCount} />
      <ChartSeven tbCategories={tbCategories} />

      <div className="flex flex-wrap gap-6 p-6 bg-gray-950 dark:bg-gray-50">
        <div className="w-full shadow-[#030811] drop-shadow-sm">
          <ChartThree abnormalityGenderCount={abnormalityGenderCount} />
        </div>

        <div className="w-full shadow-[#030811] drop-shadow-sm">
          <ChartFour abnoramlityAgeCount={abnoramlityAgeCount} />
        </div>

        {/* Toggle for ChartFive / ChartEight */}
        <div className="w-full shadow-[#030811] drop-shadow-sm">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowChartFive((prev) => !prev)}
              className="bg-[#030811] hover:bg-[#5c60c6] text-white px-4 py-2 rounded-full"
            >
              {showChartFive ? "Switch to Map View" : "Switch to Basic"}
            </button>
          </div>

          {showChartFive ? (
            <ChartFive abnormalityLocationCount={abnormalityLocationCount} />
          ) : (
            // Pass the heatmapLink as a prop to ChartEight
            <ChartEight heatmapLink={heatmapLink} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
