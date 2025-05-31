import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import patientReducer from "./slices/patientSlice";
import tableReducer from "./slices/tableSlice";
import themeReducer from "./slices/themeSlice";
import xrayReducer from "./slices/xraySlice";
import metadataReducer from "./slices/metadataSlice";
import notificationReducer from "./slices/notificationSlice";
import loaderReducer from "./slices/loaderSlice";
import sseReducer from "./slices/sseSlice";   

const rootReducer = combineReducers({
  auth: authReducer,
  patient: patientReducer,
  table: tableReducer,
  theme: themeReducer,
  xray: xrayReducer,
  metadata: metadataReducer,
  notification: notificationReducer,
  loader: loaderReducer,
  sse: sseReducer,                          
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "theme", "table"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
