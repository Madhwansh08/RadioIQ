// src/redux/slices/sseSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { addTableData } from "./tableSlice";
import { addNotification } from "./notificationSlice";
import { toast } from "react-toastify";
import config from "../../utils/config";

const initialClientId = localStorage.getItem("clientId") || null;

const sseSlice = createSlice({
  name: "sse",
  initialState: {
    clientId: initialClientId,
  },
  reducers: {
    setClientId(state, action) {
      state.clientId = action.payload;
    },
  },
});

export const { setClientId } = sseSlice.actions;


export const initSse = () => (dispatch) => {
  const eventSource = new EventSource(`${config.API_URL}/events`, {
    withCredentials: true,
  });

  eventSource.onmessage = (evt) => {
    console.log("cbewfjbewjfbejwf 2",evt);
    const data = JSON.parse(evt.data);

    // 1) capture clientId
    if (data.clientId) {
      localStorage.setItem("clientId", data.clientId);
      dispatch(setClientId(data.clientId));
    }

    // 2) successful completion
    if (data.status === "completed") {
      if (data.patient && data.xray) {
        dispatch(
          addTableData({
            patientId: data.patient.patientId,
            sex: data.patient.sex,
            age: data.patient.age,
            location: data.patient.location,
            xray: data.xray,
            fileName: data.fileName,
          })
        );
        const msg = `File "${data.fileName}" processed successfully.`;
        dispatch(
          addNotification({
            id: Date.now(),
            type: "success",
            message: msg,
            timestamp: new Date().toISOString(),
          })
        );
        toast.success(msg);
      } else if (
        data.message &&
        data.message.includes("not a valid lung X-ray")
      ) {
        const msg = `File "${data.fileName}" is not a valid lung X-ray.`;
        dispatch(
          addNotification({
            id: Date.now(),
            type: "error",
            message: msg,
            timestamp: new Date().toISOString(),
          })
        );
        toast.error(msg);
      }
    }
    // 3) error cases (incl. SageMaker 424)
    else if (data.status === "error" || data.errorCode === 424) {
      const msg = `Error processing file "${data.fileName}": Server busy.`;
      dispatch(
        addNotification({
          id: Date.now(),
          type: "error",
          message: msg,  
          timestamp: new Date().toISOString(),
        })
      );
      toast.error(msg);
    }
  };

  eventSource.onerror = (err) => {
    console.error("❌ SSE error:", err);
    eventSource.close();
    // retry after 5s
    setTimeout(() => dispatch(initSse()), 5000);
  };
};

export default sseSlice.reducer;
